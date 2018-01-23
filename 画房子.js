
Cesium.Math.setRandomNumberSeed(0);

var viewer = new Cesium.Viewer('cesiumContainer');
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

var entities = viewer.entities;

var stripeMaterial = new Cesium.StripeMaterialProperty({
    evenColor : Cesium.Color.WHITE.withAlpha(0.5),
    oddColor : Cesium.Color.BLUE.withAlpha(0.5),
    repeat : 5.0
});


var vecList = [];
var start_pos = 0;
var scene = viewer.scene;
var handler;


handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

handler.setInputAction(function(movement){
  var cartesian = viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);

  if (cartesian){
    var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
    var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);

    vecList.push(new Cesium.Cartesian2(longitudeString,latitudeString));


    if(start_pos == 0){
      start_pos = new Cesium.Cartesian2(longitudeString,latitudeString);
    }

    var point = viewer.entities.add({
        position : new Cesium.CallbackProperty(function() {
          return Cesium.Cartesian3.fromDegrees(longitudeString, latitudeString);
          }, false),
        point : {
          pixelSize : 8,
          color : Cesium.Color.YELLOW
        }
    });


    if(vecList.length>=2){
      var polylines = new Cesium.PolylineCollection();
      var tempArray = [];
      vecList.forEach(function(element){
        tempArray.push(element.x);
        tempArray.push(element.y);
      });

      polylines.add({
        positions : Cesium.Cartesian3.fromDegreesArray(tempArray),
        width : 1,
      });
      viewer.scene.primitives.add(polylines);
    }
  }
}, Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.SHIFT);




handler.setInputAction(function(movement){
  if(vecList.length != 0){
    var tempList = [];
    vecList.forEach(function(element){
      tempList.push(element.x);
      tempList.push(element.y);
      tempList.push(30);
    });

    entities.add({
      name : 'Building',
      description : "<button>Open Dialog</button>",
      polygon : {
        hierarchy : new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArrayHeights(tempList)),
        perPositionHeight : true,
        extrudedHeight : 0.0,
        outline : true,
        outlineColor : Cesium.Color.BLACK,
        outlineWidth : 4,
        material : Cesium.Color.fromRandom({alpha : 0.5})
      }
    });
    vecList = [];
  }
}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
