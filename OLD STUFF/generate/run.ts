const fs = require('fs');


function main() {
	let groups = JSON.parse(fs.readFileSync("info.json").toString()) as PlanGroup[];

    let plans = create(groups);

	let htmlOut= getFullHtml(plans.join("\n"));
    fs.writeFileSync("./../index.html", htmlOut);
}



export function create(groups: PlanGroup[]): string[] {

    let results = [];


	let maxHeight = 0;
	let maxWidth = 0;
	groups.forEach(group => {
		group.plans.forEach(plan => {
			maxHeight = Math.max(maxHeight, plan.height);
			maxWidth = Math.max(maxWidth, plan.width);
		});
	})

	groups.forEach(group => {

		results.push(`<div class="topTitle"><div><div>${group.name}</div></div></div>`);

		group.plans.forEach(plan => {

			let heightPerc = 95 * plan.height / maxHeight;
			let widthPerc = 95 * plan.width / maxWidth;

			results.push(`<div class="sTitle"><div><div>${plan.name}</div></div></div>`);

			let circles: string = plan.points.map(p => {
				return `<circle class="cameraPoint" cx="${p.x.toFixed(4)}" cy="${p.y.toFixed(4)}" r="0.02rem" id="${p.id}" onclick="cclick(evt)" />`;
			}).join("\n");

			let out: string = `
<svg class="mapBox" height="${heightPerc.toFixed(4)}%" width="${widthPerc.toFixed(4)}%" viewBox="0 0 ${plan.width.toFixed(4)} ${plan.height.toFixed(4)}" version="1.1" xmlns="http://www.w3.org/2000/svg">
<style> .cameraPoint:hover { cursor: pointer; } </style>
<image xlink:href="./rooms/${plan.img}.png" y="0" x="0" height="100%" width="100%" />
${circles}
</svg>`;
            results.push(out);
		});
	})

	return results;
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


function getFullHtml(insert: string): string {
	return `
	<!doctype html>

<html lang="en">
<head>
  <meta charset="utf-8">

  <title>Trekorama</title>
  <meta name="description" content="Trekorama">
  <meta name="author" content="MiJoFr">
  <link rel="icon" href="./favicon.ico" type="image/x-icon" />
  <link rel="stylesheet" href="styles.css">

  <script type="text/javascript" src="./lib/polyfill.min.js"></script>
  <script type="text/javascript" src="./lib/browser.js"></script>

  <script type="text/javascript" src="./lib/three.min.js"></script>
  <script type="text/javascript" src="./lib/photo-sphere-viewer.js"></script>
  <link rel="stylesheet" type="text/css" href="./pano-styles.css">
  <script type="text/javascript" src="./lib/visible-range.js"></script>

  <link rel="stylesheet" media="screen" href="https://fontlibrary.org//face/bebasneueregular" type="text/css"/>

  <style id="hTag"></style>

</head>

<body>
  
   <div class="bar">
   <div class="innerBar">
	${insert}
	</div>
	</div>
	<div class="main">
    <div class="container">
      <div class="blockage"></div>
      <div class="subContainer">
        <div class="subSubContainer">
            <div id="photosphere"></div>
        </div>
      </div>
    </div>
   </div>
   
   <script type="text/javascript" src="./main2.js"></script>

</body>
</html>
	`
}  