import "../scss/index.scss";

import { Viewer, EquirectangularAdapter, PanoData } from "@photo-sphere-viewer/core";
import { VisibleRangePlugin } from "@photo-sphere-viewer/visible-range-plugin";
import { AutorotatePlugin } from "@photo-sphere-viewer/autorotate-plugin";

import supportsWebP from "supports-webp";

import * as _SetupData from "./panoSetup.json";
const SetupData: PanoSetupFile = _SetupData as PanoSetupFile;

import { AppConfig,  PanoSetupFile,  PointData } from "./types";


var viewer: Viewer;
var visibleRangePlugin: VisibleRangePlugin;

const READYDELAY: number = 1200;

// had to do some things to this to get it to work in the new version,
// it used to be fullheight 1536.

const DEFAULTPANOSETUP: PanoData = {
	fullWidth: 2496,
	fullHeight: 1248,
	croppedWidth: 2496,
	croppedHeight: 768,
	croppedX: 0,
	croppedY: 240,
	poseHeading: 0, // 0 to 360
	posePitch: 0, // -90 to 90
	poseRoll: 0, // -180 to 180
	isEquirectangular: true
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

const STARMAPSETUP: PanoData = {
	fullWidth: 6144,
	fullHeight: 3072,
	croppedWidth: 6144,
	croppedHeight: 3072,
	croppedX: 0,
	croppedY: 0,
	poseHeading: 270, // 0 to 360
	posePitch: 0, // -90 to 90
	poseRoll: 0, // -180 to 180
	isEquirectangular: true
}

const HOLOGRIDSETUP: PanoData = {
	fullWidth: 2880,
	fullHeight: 1440,
	croppedWidth: 2880,
	croppedHeight: 1440,
	croppedX: 0,
	croppedY: 0,
	poseHeading: 75, // 0 to 360
	posePitch: 0, // -90 to 90
	poseRoll: 0, // -180 to 180
	isEquirectangular: true
};

var appConfig: AppConfig = {
	useWebP: false,
	imgExt: ".jpg",
	pointSet: new Map<string, PointData>(),
	isOnInitImg: true,
	currentHorizRange: null,
	currentVertRange: null,
	redAlertVisible: false,
	currentId: null,
}


function getPanoVerticalRange(p: { croppedHeight: any; fullHeight: number; croppedY: any; }): [number, number] | null {
	if (p.croppedHeight === p.fullHeight) {
		return null;
	} else {
		const getAngle = (y: number) => Math.PI * (1 - y / p.fullHeight) - Math.PI / 2;
		return [getAngle(p.croppedY + p.croppedHeight), getAngle(p.croppedY)];
	}
}

function getPanoHorizontalRange(p: { croppedWidth: any; fullWidth: number; croppedX: any; }): [number, number] | null  {
	if (p.croppedWidth === p.fullWidth) {
		return null;
	} else {
		const getAngle = (x: number) => 2 * Math.PI * (x / p.fullWidth) - Math.PI;
		return [getAngle(p.croppedX), getAngle(p.croppedX + p.croppedWidth)];
	}
}

function showRedAlert(redAlertId: string): void {

	const alertButton = document.getElementById("alertButton");
	alertButton?.setAttribute("ALT_LINK", redAlertId);

	if (appConfig.redAlertVisible) {
		return;
	}
	appConfig.redAlertVisible = true;
	alertButton?.classList.remove("invisible");
	document.getElementById("fsButton")?.classList.remove("rounded");
};

function hideRedAlert() {
	if (!appConfig.redAlertVisible) {
		return;
	}
	appConfig.redAlertVisible = false;
	document.getElementById("alertButton")?.classList.add("invisible");
	document.getElementById("fsButton")?.classList.add("rounded");
};

function loadFunc(): void {
	for (const c of Array.from(SetupData.pointSet)) {
		appConfig.pointSet.set(c.id, c as PointData);
	}
	appConfig.pointSet;

	supportsWebP.then((supported) => {

		if (supported) {
			appConfig.useWebP = true;
			appConfig.imgExt = ".webp";
		} else {
			appConfig.useWebP = false;
		}


		let initPanoSrc = "./panorama-assets/panoramas/STARMAP" + appConfig.imgExt;
		let initPanoData = STARMAPSETUP;
		let defaultPitch = 0.3;
		let rotateSpeed = "0.5rpm";

		const randVal = Math.random();
		if (randVal < 0.1) {
			initPanoSrc = "./panorama-assets/panoramas/HOLOGRID_01.png";
			initPanoData = HOLOGRIDSETUP;
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

		visibleRangePlugin = viewer.getPlugin(VisibleRangePlugin) as VisibleRangePlugin;

		const { hash } = window.location;
		if (hash !== undefined && hash.length > 0) {
			const id = hash.substring(1);
			console.log("loading from URL anchor", id);
			activateId(id);
		}

		viewer.addEventListener("panorama-load", () => {
			console.log("load");
			/* Future task if can be bothered: if the current angle isn't within the new vertical range, on hitting load,
			animate roll back up to the proper angle */
		});
		viewer.addEventListener("panorama-loaded", () => {
			console.log("loaded");
			visibleRangePlugin.setHorizontalRange(appConfig.currentHorizRange as [number, number]); 
			visibleRangePlugin.setVerticalRange(appConfig.currentVertRange  as [number, number]); 

		});

	});

	window.setTimeout(() => {
		const el = document.getElementById("innerBar");
		if (el) {
			el.className = "ready";
		}
	}, READYDELAY);

};

function activateId(id: string): void {

	const selectedPoint = appConfig.pointSet.get(id);
	if (!selectedPoint) {
		console.warn("no selectedPoint");
		return;
	}

	appConfig.currentId = id;

	if (appConfig.isOnInitImg) {
		appConfig.isOnInitImg = false;
		document.getElementById("psvButtons")?.classList.remove("hidden");
	}

	const panoSetup = selectedPoint.panoData == null ? DEFAULTPANOSETUP : selectedPoint.panoData;

	const highlit = Array.from(document.getElementsByClassName("highlit"));
	for (const n of highlit) {
		n.classList.remove("highlit");
		n.classList.remove("alt-highlit");
	}

	let pointSvgElement = document.getElementById(id) as unknown as SVGUseElement;
	if (pointSvgElement == null && selectedPoint.isAlt && selectedPoint.altId != null) {
		pointSvgElement = document.getElementById(selectedPoint.altId) as unknown as SVGUseElement;
	}

	if (pointSvgElement) {
		pointSvgElement.classList.add("highlit");``
		if (selectedPoint.isAlt) {
			pointSvgElement.classList.add("alt-highlit");
		}

		const groupCont = pointSvgElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement;
		groupCont?.classList.add("highlit");

		const titleItem = pointSvgElement?.parentElement?.parentElement?.previousElementSibling;
		titleItem?.classList.add("highlit");
	}

	const highlightFrameElement = document.getElementById("hlPoint") as unknown as SVGUseElement;
	if (pointSvgElement != null && highlightFrameElement != null) {
		highlightFrameElement.setAttribute("x", pointSvgElement.getAttribute("x") ?? "0");
			highlightFrameElement.setAttribute("y", pointSvgElement.getAttribute("y") ?? "0");
			pointSvgElement.parentNode?.appendChild(highlightFrameElement);
			if (selectedPoint.isAlt) {
				highlightFrameElement.classList.add("alt-highlit");
			} else {
				highlightFrameElement.classList.remove("alt-highlit");
			}
	} else if (highlightFrameElement != null) {
		highlightFrameElement.classList.add("hide");
	}

	if (selectedPoint.hasAlt && selectedPoint.altId != null) {
		showRedAlert(selectedPoint.altId);
	} else {
		hideRedAlert();
	}

	const url = `./panorama-assets/panoramas/${id}${appConfig.imgExt}`;

	console.log("loading PanoSetp", panoSetup);
	// eslint-disable-next-line prefer-const
	let panoOpts = {
		transition: true,
		speed: 500,
		panoData: panoSetup,
		zoom: 35,
	};

	// I have to do this manually apparently because doing it from
	// panoData seems to be broken if you're using a fade transition.
	appConfig.currentHorizRange = getPanoHorizontalRange(panoSetup) as [number, number] | null;
	appConfig.currentVertRange = getPanoVerticalRange(panoSetup)  as [number, number] | null;
	// visibleRangePlugin.setHorizontalRange(horizRange);
	// visibleRangePlugin.setVerticalRange(vertRange);

	updateTitleElement(document.getElementById("titleLeftMain"), selectedPoint.planName);
	// updateTitleElement(document.getElementById("titleLeftSub"), selectedPoint.planGroupName);
	updateTitleElement(document.getElementById("titleRightMain"), selectedPoint.planGroupName);
	updateTitleElement(document.getElementById("titleRightSub"), selectedPoint.planGroupSubtitle);

	let newTitle = "Trekorama - " + selectedPoint.planGroupName;
	if (selectedPoint.planGroupSubtitle) {
		newTitle = newTitle + ` ${selectedPoint.planGroupSubtitle}`;
	}
	newTitle = newTitle + `, ${selectedPoint.planName}`;
	document.title = newTitle;

	viewer.setPanorama(url, panoOpts).then((res: any) => {
		console.log("transition complete", res);
	});

	var autoRotatePlugin = viewer.getPlugin(AutorotatePlugin) as AutorotatePlugin;
	if (autoRotatePlugin.isEnabled()) {
		autoRotatePlugin.stop();
	}

};

function updateTitleElement(titleEl: HTMLElement | null, text: string | undefined) {
	if (titleEl != null) {
		if (text == null || text === undefined || text.trim() == "") {
			titleEl.classList.add("invisible");
		} else {
			titleEl.classList.remove("invisible");
			titleEl.innerText = text;
		}
	}
}


function animationTest() {
	console.log("animationTest");
};

// handlers ==========================

(window as any).alrtClicked = ($element: { getAttribute: (arg0: string) => any; }) => {
	const altlink = $element.getAttribute("alt_link");
	if (altlink) {
		activateId(altlink);
	}
};

(window as any).cclick = ($element: { target: any; }) => {
	const { target } = $element;
	const { id } = target;

	activateId(id);

};

(window as any).downloadClicked = ($element: any) => {
	console.log("downloadClicked");
	if (viewer && viewer.config != null && viewer.config.panorama != null) {
		window.open(viewer.config.panorama, "_blank");
	}
};

(window as any).fullscreenClicked = ($element: any) => {
	console.log("fullscreenClicked");
	viewer.toggleFullscreen();
};

(window as any).directLinkClicked = ($element: any) => {
	console.log("directLinkClicked");
	// window.activateId("SNW-SB1");
	const newLoc = new URL(window.location.href);
	if (appConfig.currentId) {
		newLoc.hash = appConfig.currentId;
		window.history.pushState({}, "", newLoc);
		// eslint-disable-next-line no-undef
		navigator.clipboard.writeText(newLoc.href);
	}
};

(window as any).indexClicked = ($element: any) => {
	console.log("indexClicked");
	animationTest();
};


window.addEventListener("load", function () {
	loadFunc();
});
