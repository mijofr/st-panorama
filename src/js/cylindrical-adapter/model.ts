export type CylindricalFaces = 'left' | 'front' | 'right' | 'back' | 'top' | 'bottom';

/**
 * Object defining a cylindrical as a single net file (cross arrangement)
 */
export type CylindricalPanorama = {
    type: 'cylindrical';
    path: string;
};

/**
 * Size information of a cylindrical panorama
 */
export type CylindricalData = {
    isCylindrical: true;
    flipTopBottom: boolean;
    faceSize: number;
};

export type CylindricalAdapterConfig = {
    /**
     * used for cylindrical tiles adapter
     * @internal
     */
    blur?: boolean;
};
