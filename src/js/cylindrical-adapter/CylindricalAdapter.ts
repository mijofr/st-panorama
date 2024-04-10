import type { PanoramaPosition, Position, TextureData, Viewer } from '@photo-sphere-viewer/core';
import { AbstractAdapter, CONSTANTS, PSVError, SYSTEM, TextureLoader, utils } from '@photo-sphere-viewer/core';
import { BoxGeometry, Color, CylinderGeometry, DataTexture, Material, MathUtils, Mesh, MeshBasicMaterial, RGBAFormat, Texture, Vector2, Vector3 } from 'three';
import {
    CylindricalAdapterConfig,
    CylindricalPanoData,
    CylindricalPanorama
} from './model.ts';
import { cleanCylindrical, cleanCylindricalArray, isCylindrical } from './utils.ts';
import * as THREE from 'three';

type CylindricalMesh = Mesh<CylinderGeometry, [MeshBasicMaterial, MeshBasicMaterial, MeshBasicMaterial]>;
type CylindricalTexture = TextureData<Texture[], CylindricalPanorama, CylindricalPanoData>;

const getConfig = utils.getConfigParser<CylindricalAdapterConfig>({
    backgroundColor: '#332266',
    interpolateBackground: false,
    resolution: 64
});

const EPS = 0.000001;
const ORIGIN = new Vector3();

const CylinderHeight: number = CONSTANTS.SPHERE_RADIUS;

/**
 * Adapter for cylindricals
 */
export class CylindricalAdapter extends AbstractAdapter<CylindricalPanorama, Texture[], CylindricalPanoData> {
    static override readonly id = 'cylindrical';
    static override readonly VERSION = "5.7.2"; // PKG_VERSION;
    static override readonly supportsDownload = false;

    private readonly config: CylindricalAdapterConfig;

    private cylindricalPano: CylindricalPanoData = null;

    public logPAno() {
        console.log(this.cylindricalPano);
    }

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
    override textureCoordsToSphericalCoords(point: PanoramaPosition, data: CylindricalPanoData): Position {
        if (utils.isNil(point.textureX) || utils.isNil(point.textureY)) {
            throw new PSVError(`Texture position is missing 'textureX', 'textureY' or 'textureFace'`);
        }
        if (this.cylindricalPano) {
            data = this.cylindricalPano;
        }
        if (data == null) {
            return {pitch:-1, yaw:-1}
        }

        let yaw: number = 0;
        let pitch: number = 0;

        return { yaw, pitch };
    }

    override sphericalCoordsToTextureCoords(position: Position, data: CylindricalPanoData): PanoramaPosition {

        if (this.cylindricalPano) {
            data = this.cylindricalPano;
        }
        if (data == null) {
            return {textureX:-1, textureY:-1}
        }

        // @ts-ignore
        const raycaster = this.viewer.renderer.raycaster;
        // @ts-ignore
        const mesh = this.viewer.renderer.mesh;
        raycaster.set(ORIGIN, this.viewer.dataHelper.sphericalCoordsToVector3(position));
        const point = raycaster.intersectObject(mesh)[0].point.multiplyScalar(1 / CONSTANTS.SPHERE_RADIUS);

        let textureX: number = 0;
        let textureY: number = 0;
        return { textureX, textureY };
    }

    async loadTexture(panorama: CylindricalPanorama, loader = true): Promise<CylindricalTexture> {
        if (this.viewer.config.fisheye) {
            utils.logWarn('fisheye effect with cylindrical texture can generate distorsion');
        }

        const cacheKey = panorama.path;
        const img = await this.viewer.textureLoader.loadImage(
            panorama.path,
            loader ? (p) => this.viewer.loader.setProgress(p) : null,
            cacheKey
        );

        const textures: Texture[] = [];
        textures.push(utils.createTexture(img));

        

        return {
            panorama,
            texture: textures,
            cacheKey: cacheKey,
            panoData: {
                isCylindrical: true,
                fullWidth: (textures[0].image as HTMLImageElement | HTMLCanvasElement).width,
                fullHeight: (textures[0].image as HTMLImageElement | HTMLCanvasElement).height,
            },
        };
    }



    createMesh(scale = 1): CylindricalMesh {
        const geometry = new CylinderGeometry(CONSTANTS.SPHERE_RADIUS, CONSTANTS.SPHERE_RADIUS, 1, this.config.resolution, 1, false, Math.PI / 2).scale(-1, 1, 1);
        geometry.rotateY(Math.PI/-2)

        let materials: [MeshBasicMaterial, MeshBasicMaterial, MeshBasicMaterial] = [
            new MeshBasicMaterial({
                color: new Color(this.config.backgroundColor)
            }),
            new MeshBasicMaterial({
                color: new Color(this.config.backgroundColor)
            }),
            new MeshBasicMaterial({
                color: new Color(this.config.backgroundColor)
            })
        ];

        return new Mesh(geometry, materials);
    }

    setTexture(mesh: CylindricalMesh, textureData: CylindricalTexture) {

        this.cylindricalPano = textureData.panoData;
    
        mesh.scale.set(1,18.5,1);
        

        const { texture, panoData } = textureData;

        console.log("tex", texture[0]);

        mesh.material[0].map = texture[0];
        mesh.material[0].color = null;            

        let n = new THREE.TextureLoader();
        let topTex = n.loadAsync("./panorama-assets/compass-1.png").then(w => {
            w.flipY = false;
            mesh.material[1].map = w;
            mesh.material[1].color = null;
            mesh.material[1].side = THREE.FrontSide;
            

        })

        let bottomTex = n.loadAsync("./panorama-assets/compass-2.png").then(v => {
            v.flipY = true;
            mesh.material[2].map = v;
            mesh.material[2].color = null;
            mesh.material[2].side = THREE.FrontSide;
        });
        

    }

    setTextureOpacity(mesh: CylindricalMesh, opacity: number) {

        mesh.material.forEach(m => {
            m.opacity = opacity;
            m.transparent = opacity < 1
        });
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
  
  