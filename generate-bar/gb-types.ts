import { PanoData } from "@photo-sphere-viewer/core";

export interface PlanGroup {
	name: string;
	subtitle?: string;
	id: string;
	plans: Plan[];
	setup?: PanoData;
}

export interface Plan {
	name: string;
	img: string;
	id: string;
    height: number;
    width: number;
	points: MapPoint[];
	setup?: PanoData;
}



export interface MapPoint {
	id: string;
	x: number;
	y: number;
	setup?: PanoData;
	hasAlt?: string;
}

export interface PointData {
	id: string;
	planName: string;
	planGroupName: string;
	planGroupSubtitle?: string;
	planGroupId: string;
	planId: string;
	hasAlt: boolean;
	altId?: string;
	isAlt: boolean;
	panoData?: PanoData;
}