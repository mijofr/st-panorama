import '../scss/index.scss';

import * as PhotoSphereViewer from 'photo-sphere-viewer';
import * as VisibleRangePlugin from 'photo-sphere-viewer/dist/plugins/visible-range';
import { EVENTS } from 'photo-sphere-viewer/src/data/constants';
var viewer;
window.addEventListener("load", function(){

    /*
            panorama: {
            left:   './panorama-assets/panoramas/orbit/left.jpg',
            front:  './panorama-assets/panoramas/orbit/front.jpg',
            right:  './panorama-assets/panoramas/orbit/right.jpg',
            back:   './panorama-assets/panoramas/orbit/back.jpg',
            top:    './panorama-assets/panoramas/orbit/top.jpg',
            bottom: './panorama-assets/panoramas/orbit/bottom.jpg'
          },
    */

    
    viewer = new PhotoSphereViewer.Viewer({
        panorama: "./panorama-assets/panoramas/starmap.webp",
        container: 'photosphere',
        // caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
        loadingImg: './images/loading.png',
        defaultLat: 0.3,
        touchmoveTwoFingers: false,
        mousewheelCtrlKey: false,
        autorotateDelay: 1,
        autorotateSpeed: "0.5rpm",
           panoData: {
            fullWidth: 6144,
            fullHeight: 3072,
            croppedWidth: 6144,
            croppedHeight: 3072,
            croppedX: 0,
            croppedY: 0,
            poseHeading: 270, // 0 to 360
            posePitch: 0, // -90 to 90
            poseRoll: 0, // -180 to 180
        },
        canvasBackground: "#000000",
        fisheye: -0.1,
        navbar: false,
        plugins: [[VisibleRangePlugin, {usePanoData: true}]]  
      });

      var visibleRangePlugin = viewer.getPlugin(VisibleRangePlugin);
      visibleRangePlugin.setRangesFromPanoData();


});



window.cclick = ($element) => {
    let target = $element.target;
    let id = target.id;
    console.log(id);

    let styleTag = document.getElementById("hTag");
    console.log(styleTag);

    styleTag.innerHTML = `
        #${id} {
            stroke: #c96046;
        }
    `;
    
    let url = `./panorama-assets/panoramas/${id}.jpg`;
    let opts = {
        panoData: {
            fullWidth: 2496,
            fullHeight: 1536,
            croppedWidth: 2496,
            croppedHeight: 768,
            croppedX: 0,
            croppedY: 384,
            poseHeading: 0, // 0 to 360
            posePitch: 0, // -90 to 90
            poseRoll: 0, // -180 to 180
        }
    };
    viewer.setPanorama(url, opts);

    if (viewer.isAutorotateEnabled()) {
        viewer.stopAutorotate();
    }  
    
    var visibleRangePlugin = viewer.getPlugin(VisibleRangePlugin);
    visibleRangePlugin.setRangesFromPanoData();


}