window.addEventListener("load", function(){

    if (!window.location.hash) {
        alert("No hash!");
        return;
    }

    var hash = window.location.hash;
    hash = hash.substr(1);
    let regex = /^[A-Za-z0-9_]+$/
    if (!regex.test(hash)) {
        alert("Invalid hash found");
        return;
    }

    let url = `./panos/${hash}.jpg`
    
    var viewer = new PhotoSphereViewer.Viewer({
        panorama: url,
        container: 'photosphere',
        // caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
        loadingImg: './loading.png',
        //defaultLat: 0.3,
        touchmoveTwoFingers: false,
        mousewheelCtrlKey: false,
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
        },
        canvasBackground: "#B2B2B2",
        fisheye: -0.1,
        navbar: false,
        plugins: [
          [PhotoSphereViewer.VisibleRangePlugin, {usePanoData: true}]
        ]  
      });
      
      var visibleRangePlugin = viewer.getPlugin(PhotoSphereViewer.VisibleRangePlugin);
      visibleRangePlugin.setRangesFromPanoData();
    
    
    
});

/*

  
});
*/

