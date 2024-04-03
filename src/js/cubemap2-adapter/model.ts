export type CubemapFaces = 'left' | 'front' | 'right' | 'back' | 'top' | 'bottom';

/**
 * Object defining a cubemap as separated files
 */
export type Cubemap = { [K in CubemapFaces]: string };

/**
 * Object defining a cubemap as a single net file (cross arrangement)
 */
export type CubemapNet = {
    type: 'net';
    path: string;
};

/**
 * Configuration of a cubemap
 */
export type CubemapPanorama =  CubemapNet;

/**
 * Size information of a cubemap panorama
 */
export type CubemapData = {
    isCubemap: true;
    flipTopBottom: boolean;
    faceSize: number;
};

export type Cubemap2AdapterConfig = {
    /**
     * used for cubemap tiles adapter
     * @internal
     */
    blur?: boolean;
};
