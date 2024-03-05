import "../scss/index.scss";

import { Viewer, EquirectangularAdapter } from "@photo-sphere-viewer/core";
import { VisibleRangePlugin } from "@photo-sphere-viewer/visible-range-plugin";
import { AutorotatePlugin } from "@photo-sphere-viewer/autorotate-plugin";

// import * as VisibleRangePlugin from "photo-sphere-viewer/dist/plugins/visible-range";
// import { EVENTS } from "photo-sphere-viewer/src/data/constants";
import supportsWebP from "supports-webp";

import * as SetupData from "./panoSetup.json";

function getPanoVerticalRange(p) {
	if (p.croppedHeight === p.fullHeight) {
		return null;
	} else {
		const getAngle = (y) => Math.PI * (1 - y / p.fullHeight) - Math.PI / 2;
		return [getAngle(p.croppedY + p.croppedHeight), getAngle(p.croppedY)];
	}
}

function getPanoHorizontalRange(p) {
	if (p.croppedWidth === p.fullWidth) {
		return null;
	} else {
		const getAngle = (x) => 2 * Math.PI * (x / p.fullWidth) - Math.PI;
		return [getAngle(p.croppedX), getAngle(p.croppedX + p.croppedWidth)];
	}
}

var viewer;
var visibleRangePlugin;

var currentHorizRange = null;
var currentVertRange = null;

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

		const randVal = Math.random();

		let initPanoSrc = "./panorama-assets/panoramas/STARMAP" + imgExt;
		let initPanoData = {
			fullWidth: STARWIDTH,
			fullHeight: STARHEIGHT,
			croppedWidth: STARWIDTH,
			croppedHeight: STARHEIGHT,
			croppedX: 0,
			croppedY: 0,
			poseHeading: 270, // 0 to 360
			posePitch: 0, // -90 to 90
			poseRoll: 0, // -180 to 180
		};
		let defaultPitch = 0.3;
		let rotateSpeed = "0.5rpm";

		if (randVal < 0.1) {
			initPanoSrc = "./panorama-assets/panoramas/HOLOGRID_01.png";
			initPanoData = {
				fullWidth: 2880,
				fullHeight: 1440,
				croppedWidth: 2880,
				croppedHeight: 1440,
				croppedX: 0,
				croppedY: 0,
				poseHeading: 75, // 0 to 360
				posePitch: 0, // -90 to 90
				poseRoll: 0, // -180 to 180
			};
			defaultPitch = 0;
			rotateSpeed = "1rpm";
		}

		viewer = new Viewer({
			adapter: [
				EquirectangularAdapter, {
					interpolateBackground: true,
					backgroundColor: "#000",
					// useXmpData: true,
				},
			],
			plugins: [
				[AutorotatePlugin, {
					autostartDelay: 1,
					autorotateSpeed: rotateSpeed,
					autostartOnIdle: false,
				}],
				[VisibleRangePlugin, { usePanoData: false }], // because broken with transitions for now
			],
			panorama: initPanoSrc,
			container: "photosphere",
			// caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
			loadingImg: "./images/loading.png",
			defaultPitch: defaultPitch,
			touchmoveTwoFingers: false,
			mousewheelCtrlKey: false,
			panoData: initPanoData,
			fisheye: 0, // this causes that jump after load.
			navbar: false,
		});

		visibleRangePlugin = viewer.getPlugin(VisibleRangePlugin);

		const { hash } = window.location;
		if (hash !== undefined && hash.length > 0) {
			const id = hash.substring(1);
			console.log(id);
			window.activateId(id);
		}

		viewer.addEventListener("panorama-load", () => {
			console.log("load");
			/* Future task if can be bothered: if the current angle isn't within the new vertical range, on hitting load,
			animate roll back up to the proper angle */
		});
		viewer.addEventListener("panorama-loaded", () => {
			console.log("loaded");

			visibleRangePlugin.setHorizontalRange(currentHorizRange);
			visibleRangePlugin.setVerticalRange(currentVertRange);

		});

		/*
		this.document.addEventListener("keydown", (event) => {

			console.log("keypress", event, visibleRangePlugin);
			console.log(visibleRangePlugin.config.horizontalRange, visibleRangePlugin.config.verticalRange);
			console.log(viewer.getPosition());
		});
		*/

	});

	this.setTimeout(() => {
		const el = document.getElementById("innerBar");
		if (el) {
			el.className = "ready";
		}
	}, 1500);

});

// had to do some things to this to get it to work in the new version,
// it used to be fullheight 1536.

const DEFAULTPANOSETUP = {
	fullWidth: 2496,
	fullHeight: 1248,
	croppedWidth: 2496,
	croppedHeight: 768,
	croppedX: 0,
	croppedY: 240,
	poseHeading: 0, // 0 to 360
	posePitch: 0, // -90 to 90
	poseRoll: 0, // -180 to 180
};

// doing nasty thing?
// gives invalid panodata error but does look a bit better
/*
const DEFAULTPANOSETUP = {
	fullWidth: 3072,
	fullHeight: 1536,
	croppedWidth: 3072,
	croppedHeight: 768,
	croppedX: 0,
	croppedY: 384,
	poseHeading: 0, // 0 to 360
	posePitch: 0, // -90 to 90
	poseRoll: 0, // -180 to 180
};
*/

window.activateId = (id) => {

	let imgExt = ".jpg";
	if (window.useWebP) {
		imgExt = ".webp";
	}

	const styleTag = document.getElementById("hTag");

	styleTag.innerHTML = `
		#${id} { fill: #CC3E28; color: #E06147; }
	`;

	let panoSetup = DEFAULTPANOSETUP;

	for (const n of SetupData.default.panoDatas) {
		if (n[0] === id) {
			panoSetup = n[1];
		}
	}

	let hasAlt = false;
	const alertButton = document.getElementById("alertButton");
	for (const n of SetupData.default.alts) {
		if (n[0] === id) {
			alertButton.classList.add("visible");
			alertButton.classList.remove("invisible");
			alertButton.setAttribute("ALT_LINK", n[1]);
			hasAlt = true;
		}
	}
	if (hasAlt === false) {
		alertButton.classList.remove("visible");
		alertButton.classList.add("invisible");
	}

	const url = `./panorama-assets/panoramas/${id}${imgExt}`;

	// eslint-disable-next-line prefer-const
	let panoOpts = {
		transition: true,
		speed: 500,
		panoData: panoSetup,
		zoom: 35,
	};

	// I have to do this manually apparently because doing it from
	// panoData seems to be broken if you're using a fade transition.
	currentHorizRange = getPanoHorizontalRange(panoSetup);
	currentVertRange = getPanoVerticalRange(panoSetup);
	// visibleRangePlugin.setHorizontalRange(horizRange);
	// visibleRangePlugin.setVerticalRange(vertRange);

	viewer.setPanorama(url, panoOpts).then((res) => {
		console.log("transition complete", res);
	});

	var autoRotatePlugin = viewer.getPlugin(AutorotatePlugin);
	console.log(autoRotatePlugin);
	console.log(autoRotatePlugin.isEnabled());

	if (autoRotatePlugin.isEnabled()) {
		autoRotatePlugin.stop();
	}

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
