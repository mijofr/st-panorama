import { PanoData } from "@photo-sphere-viewer/core";
import { PointData, Plan, PlanGroup } from "./gb-types";

const fs = require('fs');
var beautify_html = require('js-beautify').html;
var sizeOf = require('buffer-image-size');


var htmlOut: string[] = [];
var landCssOut: string[] = [];
var portCssOut: string[] = [];
var delayCssOut: string[] = [];
var setups: [string, PanoData][] = [];
var alts: [string, string][] = [];

var sidebarIds: [string, string[]][] = [];

var pointSet: Map<string, PointData> = new Map<string, PointData>();

async function main() {
	let groups: PlanGroup[] = JSON.parse(fs.readFileSync("info.json").toString()) as PlanGroup[];
    create(groups);

	const rawHtml: string = htmlOut.join("\n");
	const htmlEr: string = beautify_html(rawHtml, {});
		
	
    fs.writeFileSync("./../src/svgbar.hbs", htmlEr);
	fs.writeFileSync("./../src/scss/port.scss", portCssOut.join("\n"));
	fs.writeFileSync("./../src/scss/land.scss", landCssOut.join("\n"));
	fs.writeFileSync("./../src/scss/delay.scss", delayCssOut.join("\n"));


	fs.writeFileSync("./../src/js/panoSetup.json", JSON.stringify({ 
		panoDatas: setups, 
		alts: alts, 
		sidebarIds: sidebarIds,
		pointSet: Array.from(pointSet.values()) }, null, "\t"));

	await checkImages(groups);

}


const DEFAULT_SETUP: PanoData = {
		fullWidth: 2496,
		fullHeight: 768,
		croppedWidth: 2496,
		croppedHeight: 768,
		croppedX: 0,
		croppedY: 0,
		poseHeading: 0,
		posePitch: 0,
		poseRoll: 0,
		isEquirectangular: true
}

async function checkImages(groups: PlanGroup[]) {
	for (let g of groups) {
		for (let p of g.plans) {
			let fl: string = "./../src/panorama-assets/rooms/" + p.img;
			if (!fs.existsSync(fl)) {
				console.log(`image does not exist: ${p.img}`);
				continue;
			}
			let imgBuffer: Buffer = fs.readFileSync(fl);
			let imgData = sizeOf(imgBuffer);
			let ratio = imgData.width / imgData.height;
			let ratio2 = p.width / p.height;

			let ratDiff = 100 * Math.abs(ratio - ratio2);
			if (ratDiff > 1) {
				console.log("-------------")
				console.log("Warning: ratio difference in " + p.img);
				console.log(`File Resolution: ${imgData.width}x${imgData.height} (${ratio.toFixed(4)})`);
				console.log(`Data Resolution: ${p.width}x${p.height} (${ratio2.toFixed(4)})`);
				console.log(`Ratio diffence: ${ratDiff.toFixed(4)}%`);
				console.log("-------------")
			}

		}
 	}
}


function completePanoData(p: PanoData): PanoData {
		let newObj: PanoData = Object.assign({}, DEFAULT_SETUP);
		Object.assign(newObj, p);
		return newObj;
}


export function create(groups: PlanGroup[]) {



	let maxHeight: number = 0;
	let maxWidth: number = 0;
	groups.forEach(group => {
		group.plans.forEach(plan => {
			maxHeight = Math.max(maxHeight, plan.height);
			maxWidth = Math.max(maxWidth, plan.width);
		});
	})

	groups.forEach(group => {
		group.plans.forEach(plan => {

			plan.points.forEach(p => {
				let setup!: PanoData;
				let compSetup: PanoData | undefined = undefined;
				if (p.setup != undefined) {
					setup = p.setup;
				} else if (plan.setup != undefined) {
					setup = plan.setup;
				} else if (group.setup != undefined) {
					setup = group.setup;
				}
				if (setup != undefined) {
					compSetup = completePanoData(setup);
					setups.push([p.id, compSetup]);
				}

				if (p.hasAlt != undefined) {
					alts.push([p.id, p.hasAlt]);
				}


				pointSet.set(p.id, {
						id: p.id,
						planName: plan.name,
						planGroupName: group.name,
						planGroupSubtitle: group.subtitle,
						hasAlt: p.hasAlt != undefined,
						altId: p.hasAlt,
						panoData: compSetup,
						isAlt: false
					})
			})

		});

		for (let p of Array.from(pointSet.values())) {
			if (p.hasAlt) {
				let n = pointSet.get(p.altId ?? "");
				if (n) {
					n.altId = p.id;
					n.isAlt = true;
				}
			}
		}

	});


	let groupIdx = 0;

	groups.filter(n => n.name != "HIDDEN").forEach(group => {


		htmlOut.push(`<div class="groupContainer">`);

		let subtitleStr: string = group.subtitle != null ? `<span>${group.subtitle}</span>` : ``;
		htmlOut.push(`<div class="topTitle"><div>${group.name}${subtitleStr}</div></div>`);

		htmlOut.push(`<div class="groupInnerContainer">`);

		group.plans.forEach(plan => {

			let id = (group.name + "_" + plan.name)
				.split("'")
				.join("")
				.split("(")
				.join("")
				.split(")")
				.join("")
				.split("/")
				.join("")
				.split(" ")
				.join("_")
				.toUpperCase();



			let heightPerc: number = 96 * plan.height / maxHeight;
			let widthPerc: number = 96 * plan.width / maxWidth;

			portCssOut.push(` #SVGMAP_${id} { height: ${heightPerc}%; }`)
			landCssOut.push(` #SVGMAP_${id} { width: ${widthPerc}%; }`)

			htmlOut.push(`<span class="mapGroup">`)
			htmlOut.push(`<div class="sTitle"><div><div>${plan.name}</div></div></div>`);
			//htmlOut.push(`<div class="mapBoxContainer">`);
			htmlOut.push(`<svg class="mapBox faded" id="SVGMAP_${id}" viewBox="0 0 ${plan.width.toFixed(4)} ${plan.height.toFixed(4)}" version="1.1" xmlns="http://www.w3.org/2000/svg">`);

			let imgSrc = plan.img;
			if (imgSrc.endsWith(".png")) {
				imgSrc = "600/" + plan.img;
			} else if (imgSrc.endsWith(".svg")) {
				imgSrc = "svg/" + plan.img;
			}

			htmlOut.push(`<defs><mask id="MAPMASK_${id}">`)
			htmlOut.push(`<image onload="onMapImgLoad(event)" class="mapPlanImg" xlink:href="./panorama-assets/rooms/${imgSrc}" y="0" x="0" height="100%" width="100%" />`);
			htmlOut.push(`</mask></defs>`)
			htmlOut.push(`<rect class="mapColorRect" x="0" y="0" width="100%" height="100%" mask="url(#MAPMASK_${id})" />`)
			
			htmlOut.push(`<g class="cameraPointPlanGroup cameraPointPlanGroup_${groupIdx.toString().padStart(2,'0')}">`);

			plan.points.forEach(p => {
				if (p.x != null && p.y != null) {

					htmlOut.push(`<use class="cameraPoint" href="#CIRCLEMARK" x="${p.x.toFixed(4)}" y="${p.y.toFixed(4)}" width="0.11em" height="0.11em" id="${p.id}" onclick="cclick(evt)" />`);
				}
			});	

			htmlOut.push(`</g>`);

			htmlOut.push(`</svg>`);
			htmlOut.push(`</span>`)
			groupIdx++;

		});
		
		htmlOut.push('</div></div>');
	});


	groups.filter(n => n.name != "HIDDEN").forEach(group => {
		group.plans.forEach(plan => {

			let pointCount = plan.points.length;
			let interval = Math.min(0.15 / pointCount, 0.1);
			console.log("interval", interval);
			let newArr = plan.points.map(n => n);
			newArr.sort((a,b) => a.y - b.y);
			sidebarIds.push([plan.name, newArr.map(n => n.id)]);

			let planI = 0;
			for (let p of newArr) {
				delayCssOut.push(` #${p.id} { animation-delay: ${(planI * interval).toFixed(4)}s; }`)
				planI++;
			}
		});
	});


}

main();
