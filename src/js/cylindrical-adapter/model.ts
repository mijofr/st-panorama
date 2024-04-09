
/**
 * Object defining a cylindrical as a single net file (cross arrangement)
 */
export type CylindricalPanorama = {
    type: 'cylindrical';
    path: string;
    height: number;
};

/**
 * Size information of a cylindrical panorama
 */
export type CylindricalPanoData = {
    isCylindrical: true;
    fullWidth: number,
	fullHeight: number
};

export type CylindricalAdapterConfig = {
    /**
     * Background color of the canvas, which will be visible when using cropped panoramas
     * @default '#000'
     */
    backgroundColor?: string;
    /**
     * Interpolate the missing parts of cropped panoramas (async)
     */
    interpolateBackground?: boolean;
    /**
     * number of faces of the sphere geometry, higher values may decrease performances
     * @default 64
     */
    resolution?: number;
};
