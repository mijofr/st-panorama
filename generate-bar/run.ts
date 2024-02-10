const fs = require('fs');

var htmlOut: string[] = [];
var landCssOut: string[] = [];
var portCssOut: string[] = [];
var setups: [string, PanoData][] = [];
var alts: [string, string][] = [];


function main() {
	let groups: PlanGroup[] = JSON.parse(fs.readFileSync("info.json").toString()) as PlanGroup[];
    create(groups);
	
    fs.writeFileSync("./../src/svgbar.hbs", htmlOut.join("\n"));
	fs.writeFileSync("./../src/scss/port.scss", portCssOut.join("\n"));
	fs.writeFileSync("./../src/scss/land.scss", landCssOut.join("\n"));


	fs.writeFileSync("./../src/js/panoSetup.json", JSON.stringify({ panoDatas: setups, alts: alts }));

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


		htmlOut.push(`<div class="topTitle"><div><div>${group.name}</div></div></div>`);

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


			let heightPerc: number = 95 * plan.height / maxHeight;
			let widthPerc: number = 95 * plan.width / maxWidth;

			portCssOut.push(` #SVGMAP_${id} { height: ${heightPerc}%; }`)
			landCssOut.push(` #SVGMAP_${id} { width: ${widthPerc}%; }`)

			htmlOut.push(`<div class="sTitle"><div><div>${plan.name}</div></div></div>`);
	

			htmlOut.push(`<svg class="mapBox" id="SVGMAP_${id}" viewBox="0 0 ${plan.width.toFixed(4)} ${plan.height.toFixed(4)}" version="1.1" xmlns="http://www.w3.org/2000/svg">`);
			htmlOut.push(`<image class="mapPlanImg" xlink:href="./panorama-assets/rooms/${plan.img}" y="0" x="0" height="100%" width="100%" />`);

			plan.points.forEach(p => {
				if (p.x != null && p.y != null) {
					htmlOut.push(`<circle class="cameraPoint" cx="${p.x.toFixed(4)}" cy="${p.y.toFixed(4)}" r="0.04em" id="${p.id}" onclick="cclick(evt)" />`);
				}
			});	

			htmlOut.push(`</svg>`)

		});
	});

}




main();

export interface PlanGroup {
	name: string;
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

