
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

var solar_panel_width = 1;
var solar_panel_length = 3;
var width_offset = 0.2;


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
      description : "<button onclick=\"myFunction()\">Click me</button>",
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

function myFunction() {
    console.log("hello");
}


var west = -117.845185;
var east = -117.845115;
var north = 33.646008;
var south = 33.645948;

var geodesic1 = new Cesium.EllipsoidGeodesic(Cesium.Cartographic.fromDegrees(west, north, 0), Cesium.Cartographic.fromDegrees(east, north, 0));
var length = geodesic1.surfaceDistance;
console.log(length);

var geodesic2 = new Cesium.EllipsoidGeodesic(Cesium.Cartographic.fromDegrees(west, north, 0), Cesium.Cartographic.fromDegrees(west, south, 0));
var width = geodesic2.surfaceDistance;
console.log(width);

var rows = parseInt(width / (solar_panel_width+width_offset),10);

var north_sourth_diff = north - south;
var step = north_sourth_diff/rows;
var temp_north = north;

for (var i = 0; i < rows; i++){

    var temp_south = temp_north - (step*(solar_panel_width / (solar_panel_width+width_offset)));

    viewer.entities.add({
    rectangle : {
        coordinates : Cesium.Rectangle.fromDegrees(west, temp_south, east, temp_north),
        material : new Cesium.GridMaterialProperty({
              color : Cesium.Color.BLUE,
              cellAlpha : 0.4,
              lineCount : new Cesium.Cartesian2(8, 1),
              lineThickness : new Cesium.Cartesian2(2.0, 2.0)
        })
    }
    });

    temp_north = temp_south - (step*(width_offset / (solar_panel_width+width_offset)));

}



viewer.zoomTo(viewer.entities);
