import "../scss/index.scss";

import * as PhotoSphereViewer from "photo-sphere-viewer";
import * as VisibleRangePlugin from "photo-sphere-viewer/dist/plugins/visible-range";
// import { EVENTS } from "photo-sphere-viewer/src/data/constants";
import supportsWebP from "supports-webp";

import * as SetupData from "./panoSetup.json";

var viewer;
window.addEventListener("load", function () {

	supportsWebP.then((supported) => {

		let imgExt = ".jpg";

		if (supported) {
			window.useWebP = true;
			imgExt = ".webp";
		} else {
			window.useWebP = false;
		}

		const STARWIDTH = 6144;
		const STARHEIGHT = 3072;

		viewer = new PhotoSphereViewer.Viewer({
			panorama: "./panorama-assets/panoramas/starmap" + imgExt,
			container: "photosphere",
			// caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
			loadingImg: "./images/loading.png",
			defaultLat: 0.3,
			touchmoveTwoFingers: false,
			mousewheelCtrlKey: false,
			autorotateDelay: 1,
			autorotateSpeed: "0.5rpm",
			panoData: {
				fullWidth: STARWIDTH,
				fullHeight: STARHEIGHT,
				croppedWidth: STARWIDTH,
				croppedHeight: STARHEIGHT,
				croppedX: 0,
				croppedY: 0,
				poseHeading: 270, // 0 to 360
				posePitch: 0, // -90 to 90
				poseRoll: 0, // -180 to 180
			},
			canvasBackground: "#000000",
			fisheye: -0.1,
			navbar: false,
			plugins: [[VisibleRangePlugin, { usePanoData: true }]],
		});

		const { hash } = window.location;
		if (hash !== undefined && hash.length > 0) {
			const id = hash.substring(1);
			console.log(id);
			window.activateId(id);
		}

	});

	this.setTimeout(() => {
		const el = document.getElementById("innerBar");
		if (el) {
			el.className = "ready";
		}
	}, 1500);

});

window.activateId = (id) => {

	let imgExt = ".jpg";
	if (window.useWebP) {
		imgExt = ".webp";
	}

	const styleTag = document.getElementById("hTag");

	styleTag.innerHTML = `
		#${id} {
			stroke: #c96046; paint-order: fill stroke markers;
		}
	`;

	let panoSetup = {
		fullWidth: 2496,
		fullHeight: 1536,
		croppedWidth: 2496,
		croppedHeight: 768,
		croppedX: 0,
		croppedY: 384,
		poseHeading: 0, // 0 to 360
		posePitch: 0, // -90 to 90
		poseRoll: 0, // -180 to 180
	};

	for (const n of SetupData.default.panoDatas) {
		if (n[0] === id) {
			panoSetup = n[1];
		}
	}

	let hasAlt = false;
	const alertButton = document.getElementById("alertButton");
	for (const n of SetupData.default.alts) {
		if (n[0] === id) {
			alertButton.className = "visible";
			alertButton.setAttribute("ALT_LINK", n[1]);
			hasAlt = true;
		}
	}
	if (hasAlt === false) {
		alertButton.className = null;
	}

	const url = `./panorama-assets/panoramas/${id}${imgExt}`;
	const opts = {
		panoData: panoSetup,
	};
	viewer.setPanorama(url, opts);

	if (viewer.isAutorotateEnabled()) {
		viewer.stopAutorotate();
	}

	// var visibleRangePlugin = viewer.getPlugin(VisibleRangePlugin);
	// visibleRangePlugin.setRangesFromPanoData();

};

window.alrtClicked = ($element) => {
	const altlink = $element.getAttribute("alt_link");
	if (altlink) {
		window.activateId(altlink);
	}
};

window.cclick = ($element) => {
	const { target } = $element;
	const { id } = target;

	window.activateId(id);

};
