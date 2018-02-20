Cesium.Math.setRandomNumberSeed(0);

var viewer = new Cesium.Viewer('cesiumContainer');
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
viewer.scene.globe.depthTestAgainstTerrain = false;
var entities = viewer.entities;

var stripeMaterial = new Cesium.StripeMaterialProperty({
    evenColor : Cesium.Color.WHITE.withAlpha(0.5),
    oddColor : Cesium.Color.BLUE.withAlpha(0.5),
    repeat : 5.0
});

var pointsList = [];//中间点list
var start_pos = 0;
var scene = viewer.scene;
var handler;
var point = '';
var existPointsList = [];//线段判定
var temp_height = 15;
var connect_dict = {};
handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

handler.setInputAction(function(movement){
    //var pickedEntities = new Cesium.EntityCollection();
    var pickedEntities = new Cesium.EntityCollection();
    var pickedObjects = scene.pick(movement.position);
    //画点
    if(pickedObjects === undefined){
        var cartesian = viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var longitudeString = parseFloat(Cesium.Math.toDegrees(cartographic.longitude).toFixed(12));
        var latitudeString = parseFloat(Cesium.Math.toDegrees(cartographic.latitude).toFixed(12));
        pointsList.push(new Cesium.Cartesian2(longitudeString,latitudeString));
        //console.log(pointsList);
        existPointsList.push(new Cesium.Cartesian2(longitudeString,latitudeString));
        if(start_pos === 0){
          start_pos = new Cesium.Cartesian2(longitudeString,latitudeString);
        }
        point = viewer.entities.add({
            position : new Cesium.CallbackProperty(function() {
              return Cesium.Cartesian3.fromDegrees(longitudeString,latitudeString);
              }, false),
            point : {
              pixelSize : 8,
              color : Cesium.Color.YELLOW.withAlpha(0.7)
            }
        });
    }
    //
    else{
        var test;
        if (Cesium.defined(pickedObjects) && (pickedObjects.id)) {
            test = Cesium.Cartographic.fromCartesian(pickedObjects.id.position.getValue());
            //console.log(Cesium.Math.toDegrees(test.longitude));
            //console.log(Cesium.Math.toDegrees(test.latitude));
            existPointsList.push(new Cesium.Cartesian2(parseFloat(Cesium.Math.toDegrees(test.longitude).toFixed(12)), parseFloat(Cesium.Math.toDegrees(test.latitude).toFixed(12))));
            //pickedObjects.id.point.color = Cesium.Color.RED;
        }
    }
    
    if(existPointsList.length===2){
        var dict_key = Object.keys(connect_dict);
        //console.log(typeof String(existPointsList[0]));
        if(dict_key.includes(String(existPointsList[0]))){
            connect_dict[existPointsList[0]].push(existPointsList[1]);
        }
        else{
            connect_dict[existPointsList[0]] = [];
            connect_dict[existPointsList[0]].push(existPointsList[1]);
        }
    
        //console.log(existPointsList);t    bgbng gtgg
        //console.log(connect_dict[existPointsList[0]]);
        var polylines = new Cesium.PolylineCollection();
        var tempArray = [];
        existPointsList.forEach(function(element){
            tempArray.push(element.x);
            tempArray.push(element.y);
        });

        polylines.add({
            positions : Cesium.Cartesian3.fromDegreesArray(tempArray),
            width : 1,
        });
        viewer.scene.primitives.add(polylines);
        existPointsList = [];
    }                 
    
}, Cesium.ScreenSpaceEventType.LEFT_CLICK, Cesium.KeyboardEventModifier.CTRL);

///////////////////////////////////////////////////////////////////////////////////////
///////地基/////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
var vecList = [];//四边点list
var base_start_position = 0;

handler.setInputAction(function(movement){
    var pickedEntities = new Cesium.EntityCollection();
    var pickedObjects = scene.pick(movement.position);
    if(pickedObjects === undefined){
        var cartesian = viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var longitudeString = parseFloat(Cesium.Math.toDegrees(cartographic.longitude).toFixed(12));
        var latitudeString = parseFloat(Cesium.Math.toDegrees(cartographic.latitude).toFixed(12));
        vecList.push(new Cesium.Cartesian2(longitudeString,latitudeString));
        if(start_pos === 0){
          start_pos = new Cesium.Cartesian2(longitudeString,latitudeString);
        }
        point = viewer.entities.add({
            position : new Cesium.CallbackProperty(function() {
              return Cesium.Cartesian3.fromDegrees(longitudeString,latitudeString);
              }, false),
            point : {
              pixelSize : 8,
              color : Cesium.Color.YELLOW.withAlpha(0.7)
            }
        });
    }
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
}, Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.SHIFT);

handler.setInputAction(function(movement){

    
    
    
//////////////////////////////////////////////////////////////////////    
  if(vecList.length !== 0){
    var tempList = [];
    vecList.forEach(function(element){
      tempList.push(element.x);
      tempList.push(element.y);
      tempList.push(temp_height);
      
      var point = viewer.entities.add({
        position : new Cesium.CallbackProperty(function() {
          return Cesium.Cartesian3.fromDegrees(element.x,element.y,temp_height);
          }, false),
        point : {
          pixelSize : 8,
          color : Cesium.Color.YELLOW
        }
    });  
        
    });
    entities.add({
      name : 'Building',
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

function almostEqual(num1,num2){
  return num1.toFixed(12) === num2.toFixed(12);
}
function convertStringtoPosition(t){
   // console.log(t);
    var items = t.replace(/^\(|\)$/g, "").split("),(");
    items.forEach(function(val, index, array) {
       array[index] = val.split(",").map(Number);
    });
    var position = [parseFloat(items[0][0]),parseFloat(items[0][1])];                       
    return position;  
}
