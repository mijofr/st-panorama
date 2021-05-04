var viewer;

window.addEventListener("load", function(){


    viewer = new PhotoSphereViewer.Viewer({
        panorama: "./panos/starfield.jpg",
        container: 'photosphere',
        // caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
        loadingImg: './loading.png',
        //defaultLat: 0.3,
        touchmoveTwoFingers: false,
        mousewheelCtrlKey: false,
           panoData: {
            fullWidth: 4096,
            fullHeight: 2048,
            croppedWidth: 4096,
            croppedHeight: 2048,
            croppedX: 0,
            croppedY: 0,
            poseHeading: 270, // 0 to 360
            posePitch: 0, // -90 to 90
            poseRoll: 0, // -180 to 180
        },
        canvasBackground: "#000000",
        fisheye: -0.1,
        navbar: false,
        plugins: [[PhotoSphereViewer.VisibleRangePlugin, {usePanoData: true}]]  
      });

      var visibleRangePlugin = viewer.getPlugin(PhotoSphereViewer.VisibleRangePlugin);
      visibleRangePlugin.setRangesFromPanoData();

});

var cclick = ($element) => {
    console.log("AAAA", $element);

    target = $element.target;
    id = target.id;
    console.log(id);

    let styleTag = document.getElementById("hTag");
    console.log(styleTag);

    styleTag.innerHTML = `
        #${id} {
            stroke: #c96046;
        }
    `;
    
    let url = `./panos/${id}.jpg`;
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

    var visibleRangePlugin = viewer.getPlugin(PhotoSphereViewer.VisibleRangePlugin);
    visibleRangePlugin.setRangesFromPanoData();


}