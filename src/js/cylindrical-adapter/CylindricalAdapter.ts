import type { PanoramaPosition, Position, TextureData, Viewer } from '@photo-sphere-viewer/core';
import { AbstractAdapter, CONSTANTS, PSVError, SYSTEM, utils } from '@photo-sphere-viewer/core';
import { BoxGeometry, Color, CylinderGeometry, DataTexture, MathUtils, Mesh, MeshBasicMaterial, RGBAFormat, Texture, Vector2, Vector3 } from 'three';
import {
    CylindricalAdapterConfig,
    CylindricalData,
    CylindricalFaces,
    CylindricalPanorama
} from './model.ts';
import { cleanCylindrical, cleanCylindricalArray, isCylindrical } from './utils.ts';

type CylindricalMesh = Mesh<CylinderGeometry, MeshBasicMaterial>;
type CylindricalTexture = TextureData<Texture[], CylindricalPanorama, CylindricalData>;

const getConfig = utils.getConfigParser<CylindricalAdapterConfig>({
    blur: false,
});

const EPS = 0.000001;
const ORIGIN = new Vector3();

const CylinderHeight: number = CONSTANTS.SPHERE_RADIUS;

/**
 * Adapter for cylindricals
 */
export class CylindricalAdapter extends AbstractAdapter<CylindricalPanorama, Texture[], CylindricalData> {
    static override readonly id = 'cylindrical';
    static override readonly VERSION = "5.7.2"; // PKG_VERSION;
    static override readonly supportsDownload = false;

    private readonly config: CylindricalAdapterConfig;

    constructor(viewer: Viewer, config: CylindricalAdapterConfig) {
        super(viewer);

        this.config = getConfig(config);
    }

    override supportsTransition() {
        return true;
    }

    override supportsPreload() {
        return true;
    }

    /**
     * {@link https://github.com/bhautikj/vrProjector/blob/master/vrProjector/CylindricalProjection.py#L130}
     */
    override textureCoordsToSphericalCoords(point: PanoramaPosition, data: CylindricalData): Position {
        if (utils.isNil(point.textureX) || utils.isNil(point.textureY) || utils.isNil(point.textureFace)) {
            throw new PSVError(`Texture position is missing 'textureX', 'textureY' or 'textureFace'`);
        }

        const u = 2 * (point.textureX / data.faceSize - 0.5);
        const v = 2 * (point.textureY / data.faceSize - 0.5);

        function yawPitch(x: number, y: number, z: number): [number, number] {
            const dv = Math.sqrt(x * x + y * y + z * z);
            return [Math.atan2(y / dv, x / dv), -Math.asin(z / dv)];
        }

        let yaw: number;
        let pitch: number;
        switch (point.textureFace) {
            case 'front':
                [yaw, pitch] = yawPitch(1, u, v);
                break;
            case 'right':
                [yaw, pitch] = yawPitch(-u, 1, v);
                break;
            case 'left':
                [yaw, pitch] = yawPitch(u, -1, v);
                break;
            case 'back':
                [yaw, pitch] = yawPitch(-1, -u, v);
                break;
            case 'bottom':
                [yaw, pitch] = data.flipTopBottom ? yawPitch(-v, u, 1) : yawPitch(v, -u, 1);
                break;
            case 'top':
                [yaw, pitch] = data.flipTopBottom ? yawPitch(v, u, -1) : yawPitch(-v, -u, -1);
                break;
            default:
                throw new Error("invalid textureFace");
        }

        return { yaw, pitch };
    }

    override sphericalCoordsToTextureCoords(position: Position, data: CylindricalData): PanoramaPosition {
        // @ts-ignore
        const raycaster = this.viewer.renderer.raycaster;
        // @ts-ignore
        const mesh = this.viewer.renderer.mesh;
        raycaster.set(ORIGIN, this.viewer.dataHelper.sphericalCoordsToVector3(position));
        const point = raycaster.intersectObject(mesh)[0].point.multiplyScalar(1 / CONSTANTS.SPHERE_RADIUS);

        function mapUV(x: number, a1: number, a2: number): number {
            return Math.round(MathUtils.mapLinear(x, a1, a2, 0, data.faceSize));
        }

        let textureFace: CylindricalFaces;
        let textureX: number;
        let textureY: number;
        if (1 - Math.abs(point.z) < EPS) {
            if (point.z > 0) {
                textureFace = 'front';
                textureX = mapUV(point.x, 1, -1);
                textureY = mapUV(point.y, 1, -1);
            } else {
                textureFace = 'back';
                textureX = mapUV(point.x, -1, 1);
                textureY = mapUV(point.y, 1, -1);
            }
        } else if (1 - Math.abs(point.x) < EPS) {
            if (point.x > 0) {
                textureFace = 'left';
                textureX = mapUV(point.z, -1, 1);
                textureY = mapUV(point.y, 1, -1);
            } else {
                textureFace = 'right';
                textureX = mapUV(point.z, 1, -1);
                textureY = mapUV(point.y, 1, -1);
            }
        } else {
            if (point.y > 0) {
                textureFace = 'top';
                textureX = mapUV(point.x, -1, 1);
                textureY = mapUV(point.z, 1, -1);
            } else {
                textureFace = 'bottom';
                textureX = mapUV(point.x, -1, 1);
                textureY = mapUV(point.z, -1, 1);
            }
            if (data.flipTopBottom) {
                textureX = data.faceSize - textureX;
                textureY = data.faceSize - textureY;
            }
        }

        return { textureFace, textureX, textureY };
    }

    async loadTexture(panorama: CylindricalPanorama, loader = true): Promise<CylindricalTexture> {
        if (this.viewer.config.fisheye) {
            utils.logWarn('fisheye effect with cylindrical texture can generate distorsion');
        }

        let cleanPanorama: CylindricalPanorama = panorama;

        let result: { textures: Texture[]; flipTopBottom: boolean; cacheKey: string };
        result = await this.loadTexturesNet(cleanPanorama, loader);

        return {
            panorama,
            texture: result.textures,
            cacheKey: result.cacheKey,
            panoData: {
                isCylindrical: true,
                flipTopBottom: result.flipTopBottom,
                faceSize: (result.textures[0].image as HTMLImageElement | HTMLCanvasElement).width,
            },
        };
    }


    private async loadTexturesNet(panorama: CylindricalPanorama, loader: boolean) {
        console.log("pano", panorama);
        const cacheKey = panorama.path;
        const img = await this.viewer.textureLoader.loadImage(
            panorama.path,
            loader ? (p) => this.viewer.loader.setProgress(p) : null,
            cacheKey
        );

        if (img.width / 4 !== img.height / 3) {
            utils.logWarn('Invalid cylindrical image, the width should be 4/3rd of the height');
        }

        const ratio = Math.min(1, SYSTEM.maxCanvasWidth / (img.width / 4));
        const tileWidth = (img.width / 4) * ratio;

        const pts = [
            [0, 1 / 3], // left
            [1 / 2, 1 / 3], // right
            [1 / 4, 0], // top
            [1 / 4, 2 / 3], // bottom
            [3 / 4, 1 / 3], // back
            [1 / 4, 1 / 3], // front
        ];

        const textures: Texture[] = [];

        for (let i = 0; i < 6; i++) {
            const buffer = document.createElement('canvas');
            buffer.width = tileWidth;
            buffer.height = tileWidth;

            const ctx = buffer.getContext('2d');
            if (ctx == null) {  throw new Error("no ctx"); }

            if (this.config.blur) {
                ctx.filter = 'blur(1px)';
            }

            ctx.drawImage(
                img,
                img.width * pts[i][0], img.height * pts[i][1],
                img.width / 4, img.height / 3,
                0, 0,
                tileWidth, tileWidth
            );

            textures[i] = utils.createTexture(buffer);
        }

        return {
            textures,
            cacheKey,
            flipTopBottom: true,
        };
    }

    createMesh(scale = 1): CylindricalMesh {
        const cubeSize = CONSTANTS.SPHERE_RADIUS;
        const geometry = new CylinderGeometry(cubeSize, cubeSize, CylinderHeight, 64, 1, true).scale(-1, 1, 1);

        let cMaterial = new MeshBasicMaterial({
            color: new Color(0xffff00),
            wireframe: true
        });

        /*
        const materials = [];
        for (let i = 0; i < 6; i++) {
            materials.push(new MeshBasicMaterial());
        }
        */

        return new Mesh(geometry, cMaterial);
    }

    setTexture(mesh: CylindricalMesh, textureData: CylindricalTexture) {
        const { texture, panoData } = textureData;

        /*
        for (let i = 0; i < 6; i++) {
            if (panoData.flipTopBottom && (i === 2 || i === 3)) {
                texture[i].center = new Vector2(0.5, 0.5);
                texture[i].rotation = Math.PI;
            }

            mesh.material[i].map = texture[i];
            */
            
    }

    setTextureOpacity(mesh: CylindricalMesh, opacity: number) {
        /*
        for (let i = 0; i < 6; i++) {
            mesh.material[i].opacity = opacity;
            mesh.material[i].transparent = opacity < 1;
        }
        */
    }

    disposeTexture(textureData: CylindricalTexture) {
        textureData.texture?.forEach((texture) => texture.dispose());
    }
}


export function createDataTexture(r: number, g: number, b: number) {

    const data = new Uint8Array(4);
    data[0] = Math.floor(r * 255);
    data[1] = Math.floor(g * 255);
    data[2] = Math.floor(b * 255);
    data[3] = 255;
    const texture = new DataTexture( data, 1, 1, RGBAFormat);
    texture.needsUpdate = true;
    return texture;
  }
  
  