const fs = require('fs');
var beautify_html = require('js-beautify').html;
var sizeOf = require('buffer-image-size');


var htmlOut: string[] = [];
var landCssOut: string[] = [];
var portCssOut: string[] = [];
var setups: [string, PanoData][] = [];
var alts: [string, string][] = [];


async function main() {
	let groups: PlanGroup[] = JSON.parse(fs.readFileSync("info.json").toString()) as PlanGroup[];
    create(groups);

	const rawHtml: string = htmlOut.join("\n");
	const htmlEr: string = beautify_html(rawHtml, {});
		
	
    fs.writeFileSync("./../src/svgbar.hbs", htmlEr);
	fs.writeFileSync("./../src/scss/port.scss", portCssOut.join("\n"));
	fs.writeFileSync("./../src/scss/land.scss", landCssOut.join("\n"));


	fs.writeFileSync("./../src/js/panoSetup.json", JSON.stringify({ panoDatas: setups, alts: alts }));

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
		poseRoll: 0
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
				if (p.setup != undefined) {
					setup = p.setup;
				} else if (plan.setup != undefined) {
					setup = plan.setup;
				} else if (group.setup != undefined) {
					setup = group.setup;
				}
				if (setup != undefined) {
					let compSetup = completePanoData(setup);
					setups.push([p.id, compSetup]);
				}

				if (p.hasAlt != undefined) {
					alts.push([p.id, p.hasAlt]);
				}
			})

		});
	});


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



			let heightPerc: number = 95 * plan.height / maxHeight;
			let widthPerc: number = 95 * plan.width / maxWidth;

			portCssOut.push(` #SVGMAP_${id} { height: ${heightPerc}%; }`)
			landCssOut.push(` #SVGMAP_${id} { width: ${widthPerc}%; }`)

			htmlOut.push(`<div class="sTitle"><div><div>${plan.name}</div></div></div>`);
	

			htmlOut.push(`<svg class="mapBox" id="SVGMAP_${id}" viewBox="0 0 ${plan.width.toFixed(4)} ${plan.height.toFixed(4)}" version="1.1" xmlns="http://www.w3.org/2000/svg">`);

			let imgSrc = plan.img;
			if (imgSrc.endsWith(".png")) {
				imgSrc = "600/" + plan.img;
			} else if (imgSrc.endsWith(".svg")) {
				imgSrc = "svg/" + plan.img;
			}

			htmlOut.push(`<image class="mapPlanImg" xlink:href="./panorama-assets/rooms/${imgSrc}" y="0" x="0" height="100%" width="100%" />`);

			plan.points.forEach(p => {
				if (p.x != null && p.y != null) {
					htmlOut.push(`<circle class="cameraPoint" cx="${p.x.toFixed(4)}" cy="${p.y.toFixed(4)}" r="0.04em" id="${p.id}" onclick="cclick(evt)" />`);
				}
			});	

			htmlOut.push(`</svg>`)

		});
		
		htmlOut.push('</div></div>');
	});

}




main();

export interface PlanGroup {
	name: string;
	subtitle?: string;
	plans: Plan[];
	setup?: PanoData;
}

export interface Plan {
	name: string;
	img: string;
    height: number;
    width: number;
	points: MapPoint[];
	setup?: PanoData;
}

export interface PanoData {
	fullWidth: number;
	fullHeight: number;
	croppedWidth: number;
	croppedHeight: number;
	croppedX: number;
	croppedY: number;
	poseHeading: number;
	posePitch: number;
	poseRoll: number;
}


export interface MapPoint {
	id: string;
	x: number;
	y: number;
	setup?: PanoData;
	hasAlt?: string;
}

