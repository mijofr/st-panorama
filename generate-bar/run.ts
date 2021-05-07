const fs = require('fs');

var htmlOut: string[] = [];
var landCssOut: string[] = [];
var portCssOut: string[] = [];


function main() {
	let groups: PlanGroup[] = JSON.parse(fs.readFileSync("info.json").toString()) as PlanGroup[];
    create(groups);
	
    fs.writeFileSync("./../src/svgbar.hbs", htmlOut.join("\n"));
	fs.writeFileSync("./../src/scss/port.scss", portCssOut.join("\n"));
	fs.writeFileSync("./../src/scss/land.scss", landCssOut.join("\n"));


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


			let heightPerc: number = 95 * plan.height / maxHeight;
			let widthPerc: number = 95 * plan.width / maxWidth;

			portCssOut.push(` #SVGMAP_${plan.img.toUpperCase()} { height: ${heightPerc}%; }`)
			landCssOut.push(` #SVGMAP_${plan.img.toUpperCase()} { width: ${widthPerc}%; }`)

			htmlOut.push(`<div class="sTitle"><div><div>${plan.name}</div></div></div>`);

			let circles: string = plan.points.map(p => {
				return `<circle class="cameraPoint" cx="${p.x.toFixed(4)}" cy="${p.y.toFixed(4)}" r="0.02em" id="${p.id}" onclick="cclick(evt)" />`;
			}).join("\n");

			htmlOut.push(`<svg class="mapBox" id="SVGMAP_${plan.img.toUpperCase()}" viewBox="0 0 ${plan.width.toFixed(4)} ${plan.height.toFixed(4)}" version="1.1" xmlns="http://www.w3.org/2000/svg">`);
			htmlOut.push(`<image xlink:href="./panorama-assets/rooms/${plan.img}.png" y="0" x="0" height="100%" width="100%" />`);
			htmlOut.push(circles);
			htmlOut.push(`</svg>`)

		});
	});

}




main();

export interface MapPoint {
	id: string;
	x: number;
	y: number;
}


export interface PlanGroup {
	name: string;
	plans: Plan[];
}

export interface Plan {
	name: string;
	img: string;
    height: number;
    width: number;
	points: MapPoint[];
}
