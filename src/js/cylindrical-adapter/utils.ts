import { PSVError } from '@photo-sphere-viewer/core';
import { Cylindrical, CylindricalFaces } from './model.ts';

// PSV faces order is left, front, right, back, top, bottom
// 3JS faces order is left, right, top, bottom, back, front
const CUBE_ARRAY = [0, 2, 4, 5, 3, 1];
const CUBE_HASHMAP: CylindricalFaces[] = ['left', 'right', 'top', 'bottom', 'back', 'front'];

export function isCylindrical(cylindrical: any): cylindrical is Cylindrical {
    return cylindrical && typeof cylindrical === 'object' && CUBE_HASHMAP.every((side) => side in cylindrical);
}

/**
 * Given an array of 6 objects in PSV order, returns an array in 3JS order
 */
export function cleanCylindricalArray<T>(panorama: T[]): T[] {
    const cleanPanorama: T[] = [];

    if (panorama.length !== 6) {
        throw new PSVError('A cylindrical array must contain exactly 6 images.');
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
export function cleanCylindrical<T>(cylindrical: { [K in CylindricalFaces]: T }): T[] {
    const cleanPanorama: T[] = [];

    if (!isCylindrical(cylindrical)) {
        throw new PSVError('A cylindrical object must contain exactly left, front, right, back, top, bottom images.');
    }

    // transform into array
    CUBE_HASHMAP.forEach((side, i) => {
        cleanPanorama[i] = (cylindrical as any)[side];
    });

    return cleanPanorama;
}
