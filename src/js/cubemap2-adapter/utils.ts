import { PSVError } from '@photo-sphere-viewer/core';
import { Cubemap, CubemapFaces } from './model.ts';

// PSV faces order is left, front, right, back, top, bottom
// 3JS faces order is left, right, top, bottom, back, front
const CUBE_ARRAY = [0, 2, 4, 5, 3, 1];
const CUBE_HASHMAP: CubemapFaces[] = ['left', 'right', 'top', 'bottom', 'back', 'front'];

export function isCubemap(cubemap: any): cubemap is Cubemap {
    return cubemap && typeof cubemap === 'object' && CUBE_HASHMAP.every((side) => side in cubemap);
}

/**
 * Given an array of 6 objects in PSV order, returns an array in 3JS order
 */
export function cleanCubemapArray<T>(panorama: T[]): T[] {
    const cleanPanorama: T[] = [];

    if (panorama.length !== 6) {
        throw new PSVError('A cubemap array must contain exactly 6 images.');
    }

    // reorder images
    for (let i = 0; i < 6; i++) {
        cleanPanorama[i] = panorama[CUBE_ARRAY[i]];
    }

    return cleanPanorama;
}

/**
 * Given an object where keys are faces names, returns an array in 3JS order
 */
export function cleanCubemap<T>(cubemap: { [K in CubemapFaces]: T }): T[] {
    const cleanPanorama: T[] = [];

    if (!isCubemap(cubemap)) {
        throw new PSVError('A cubemap object must contain exactly left, front, right, back, top, bottom images.');
    }

    // transform into array
    CUBE_HASHMAP.forEach((side, i) => {
        cleanPanorama[i] = (cubemap as any)[side];
    });

    return cleanPanorama;
}
