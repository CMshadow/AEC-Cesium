Cesium.Math.setRandomNumberSeed(0);

var viewer=new Cesium.Viewer("cesiumContainer",
{
    animation:!1,
    timeline:!1,
    fullscreenButton:!1,
    vrButton:!1,
    sceneModePicker:!1,
    homeButton:!0,
    navigationHelpButton:1,
    baseLayerPicker:!0,
});
viewer.cesiumWidget.creditContainer.style.display="none";
var scene = viewer.scene;
var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
var entities = viewer.entities;
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
viewer.scene.globe.depthTestAgainstTerrain = false;


var stripeMaterial = new Cesium.StripeMaterialProperty({
    evenColor : Cesium.Color.WHITE.withAlpha(0.5),
    oddColor : Cesium.Color.BLUE.withAlpha(0.5),
    repeat : 5.0
});


////////////variable/////////////////////
var innerPointsList = []; //内点树list
var start_pos = 0;
var point = '';
var pointsList = [];//内点
var existPointsList = [];

//////////////////////////////////////

handler.setInputAction(function(movement){
    
    var pickedEntities = new Cesium.EntityCollection();
    var pickedObjects = scene.pick(movement.position);
    //画点
    if(pickedObjects === undefined){
        var cartesian = viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var longitudeString = parseFloat(Cesium.Math.toDegrees(cartographic.longitude).toFixed(12));
        var latitudeString = parseFloat(Cesium.Math.toDegrees(cartographic.latitude).toFixed(12));
        var newEdgeTree = new Tree();
        newEdgeTree.add(new Cesium.Cartesian2(longitudeString,latitudeString));
        innerPointsList.push(newEdgeTree);
        pointsList.push(new Cesium.Cartesian2(longitudeString,latitudeString));
        existPointsList.push(new Cesium.Cartesian2(longitudeString,latitudeString));
        
        if(start_pos === 0){
          start_pos = new Cesium.Cartesian2(longitudeString,latitudeString);
        }
        point = viewer.entities.add({
            position : new Cesium.CallbackProperty(function() {
              return Cesium.Cartesian3.fromDegrees(longitudeString,latitudeString);
              }, false),
            point : {
              pixelSize : 15,
              color : Cesium.Color.YELLOW.withAlpha(0.7)
            }
        });

    }
    //
    else{
        var test;
        if (Cesium.defined(pickedObjects) && (pickedObjects.id)) {
            test = Cesium.Cartographic.fromCartesian(pickedObjects.id.position.getValue());
            existPointsList.push(new Cesium.Cartesian2(parseFloat(Cesium.Math.toDegrees(test.longitude).toFixed(12)), parseFloat(Cesium.Math.toDegrees(test.latitude).toFixed(12))));
        }
    }
    
    if(existPointsList.length===2){
        //construct connection among inner points
        if(contain(pointsList,existPointsList[0])&&contain(pointsList,existPointsList[1])){//两点均为内点
            for(var i = 0;i<innerPointsList.length;i++){
                //console.log(typeof innerPointsList[i].root.data);
                //console.log(typeof existPointsList[0]);
                //console.log(String(innerPointsList[i].root.data) === String(existPointsList[0]));
                if(String(innerPointsList[i].root.data) === String(existPointsList[0])){
                    innerPointsList[i].add(existPointsList[1],existPointsList[0]);
                }
                if(String(innerPointsList[i].root.data) === String(existPointsList[1])){
                    innerPointsList[i].add(existPointsList[0],existPointsList[1]);
                }
            }
        }
        
        if(contain(pointsList,existPointsList[0])&&contain(vecList,existPointsList[1])){//一内点，一外点
            for(var j = 0;j<innerPointsList.length;j++){
                if(String(innerPointsList[j].root.data) === String(existPointsList[0])){
                    innerPointsList[j].add(existPointsList[1],existPointsList[0]);
                }
            }
            for(var k = 0;k<edgePointsList.length;k++){
                if(String(edgePointsList[k].root.data) === String(existPointsList[1])){
                    edgePointsList[k].add(existPointsList[0],existPointsList[1]);
                }
            }
        }
        if(contain(pointsList,existPointsList[1])&&contain(vecList,existPointsList[0])){//一内点，一外点
            for(var jj = 0;jj<innerPointsList.length;jj++){
                if(String(innerPointsList[jj].root.data) === String(existPointsList[1])){
                    innerPointsList[jj].add(existPointsList[0],existPointsList[1]);
                }
            }
            for(var kk = 0;kk<edgePointsList.length;kk++){
                if(String(edgePointsList[kk].root.data) === String(existPointsList[0])){
                    edgePointsList[kk].add(existPointsList[1],existPointsList[0]);
                }
            }
        
        }   

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

/////地基 variable////////////////////////////////////////////////////
var vecList = [];//边缘外点list
var existEdgePoints = [];
var base_start_position = 0;
var edgePointsList = [];//外点树list
/////地基/////////////////////////////////////////////////////////////
handler.setInputAction(function(movement){
    var pickedEntities = new Cesium.EntityCollection();
    var pickedObjects = scene.pick(movement.position);
    if(pickedObjects === undefined){
        var cartesian = viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var longitudeString = parseFloat(Cesium.Math.toDegrees(cartographic.longitude).toFixed(12));
        var latitudeString = parseFloat(Cesium.Math.toDegrees(cartographic.latitude).toFixed(12));
        vecList.push(new Cesium.Cartesian2(longitudeString,latitudeString));
        existEdgePoints.push(new Cesium.Cartesian2(longitudeString,latitudeString));
        var newEdgeTree = new Tree();
        newEdgeTree.add(new Cesium.Cartesian2(longitudeString,latitudeString));
        edgePointsList.push(newEdgeTree);
        
        if(start_pos === 0){
          start_pos = new Cesium.Cartesian2(longitudeString,latitudeString);
        }
        point = viewer.entities.add({
            position : new Cesium.CallbackProperty(function() {
              return Cesium.Cartesian3.fromDegrees(longitudeString,latitudeString);
              }, false),
            point : {
              pixelSize : 15,
              color : Cesium.Color.YELLOW.withAlpha(0.7)
            }
        });
    }
    else{
      var exist;
        if (Cesium.defined(pickedObjects) && (pickedObjects.id)) {
            exist = Cesium.Cartographic.fromCartesian(pickedObjects.id.position.getValue());
            existEdgePoints.push(new Cesium.Cartesian2(parseFloat(Cesium.Math.toDegrees(exist.longitude).toFixed(12)), parseFloat(Cesium.Math.toDegrees(exist.latitude).toFixed(12))));
        }
    }
    if(existEdgePoints.length>=2){
      var polylines = new Cesium.PolylineCollection();
      var tempArray = [];
      var lastOne =  existEdgePoints[existEdgePoints.length-1];
      var penultimate = existEdgePoints[existEdgePoints.length-2];
      tempArray.push(lastOne.x);
      tempArray.push(lastOne.y);
      tempArray.push(penultimate.x);
      tempArray.push(penultimate.y);
      for(var i = 0; i<edgePointsList.length; i++){
        //console.log("edge "+edgePointsList[i].root.data);
        //console.log("dd "+lastOne);
        //console.log("dd2 "+ penultimate);
        if(String(edgePointsList[i].root.data) === String(penultimate)){
          edgePointsList[i].add(existEdgePoints[existEdgePoints.length-1],existEdgePoints[existEdgePoints.length-2]);
        }
        if(String(edgePointsList[i].root.data) === String(lastOne)){
          edgePointsList[i].add(existEdgePoints[existEdgePoints.length-2],existEdgePoints[existEdgePoints.length-1]);
        }
      }

      polylines.add({
        positions : Cesium.Cartesian3.fromDegreesArray(tempArray),
        width : 1,
      });
      tempArray = [];
      viewer.scene.primitives.add(polylines);
    }
    
}, Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.SHIFT);


////////////////constructing Building//////////////////
///variable///
var temp_height = 10;
///////////////////////////////////////////////////////
handler.setInputAction(function(movement){
    console.log("内点");
    for(var i = 0;i<innerPointsList.length;i++){
        //console.log("inner"+innerPointsList);
        innerPointsList[i].print();            
    }
    console.log("外点");
    for(var j = 0;j<edgePointsList.length;j++){
        //console.log("edge"+edgePointsList);
        edgePointsList[j].print();            
    }
    
    for(var count = 0; count < edgePointsList.length-1; count++){
      var path = [];
      var adjacentPointList = [];
      var startPoint = edgePointsList[count].root.data;
      var endPoint = null;
      edgePointsList[count].root.children.forEach(function(element){
        //console.log("1 "+element);
        if(contain(pointsList,element.data)){
          endPoint = element.data;
        }
        else{
          adjacentPointList.push(element.data);
        }
      })
      //console.log("end: "+endPoint);
      //console.log("adjacent"+adjacentPointList);
      for(var x = 0; x<adjacentPointList.length;x++){
        path.push(startPoint);
        path.push(adjacentPointList[x]);
        var nextPoint = null;
        var children = searchChildren(edgePointsList,adjacentPointList[x]);
        //console.log(children);
        nextPoint = findNextInnerPoint(children);
        //console.log(nextPoint);
        while(!Cesium.Cartesian2.equals(nextPoint,endPoint)){
          path.push(nextPoint);
          nextPoint = searchChildren(innerPointsList,nextPoint);
          console.log("log "+nextPoint);
          for(var y = 0;y<nextPoint.length;y++){
             if(Cesium.Cartesian2.equals(nextPoint[y].data,endPoint)){
               nextPoint = nextPoint[y].data;
               break;
             }
          }
        }
        path.push(endPoint);
        //console.log(path);
        var tempRoof = [];
        var innerPoint = [];
        var outsidePoint = [];
        for(var k = 0;k<path.length;k++){
            tempRoof.push(path[k].x);
            tempRoof.push(path[k].y);
            if(pointsList.toString().includes(String(path[k]))){
                tempRoof.push(temp_height+5);
                innerPoint.push(path[k]);

            }
            else{
                tempRoof.push(temp_height);
                outsidePoint.push(path[k]);
            }
       }
       //console.log("temp "+tempRoof);
       entities.add({
          name : 'Roof',
          polygon : {
            hierarchy : Cesium.Cartesian3.fromDegreesArrayHeights(tempRoof),
            perPositionHeight : true,
            //extrudedHeight : 0.0,
            outline : true,
            outlineColor : Cesium.Color.BLACK,
            outlineWidth : 4,
            material : Cesium.Color.fromAlpha(Cesium.Color.WHITE, 0.5)
          }
        });
        path = [];
      }
    }
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
          pixelSize : 15,
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
    existEdgePoints = [];
  }
  edgePointsList = [];//外树清空
  innerPointsList = [];//内树清空

    
},  Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);


////////helper////////////////////////////////////////////////////////
function contain(list, data){
    for(var i = 0;i<list.length;i++){
        if((list[i].x === data.x)&&(list[i].y === data.y)){
            return true;
        }
    }
    return false;
}

function searchChildren(list,root){
  for(var i = 0;i<list.length;i++){
      if(Cesium.Cartesian2.equals(list[i].root.data ,root)){
        return list[i].root.children;
      }
  }
}
function findNextInnerPoint(children){
  for(var i = 0; i<children.length;i++){
    if(contain(pointsList,children[i].data)){
      return children[i].data;
    }
  }
}

///////////tree///////////////////////////////////////////////////////
function Node(data) {
  this.data = data;
  this.children = [];

}

function Tree() {
  this.root = null;
}

Tree.prototype.getRoot = function(){
    return this.root;
};

Tree.prototype.add = function(data, toNodeData) {
  var node = new Node(data);
  var parent = toNodeData ? this.findBFS(toNodeData) : null;
  if(parent) {
    parent.children.push(node);
  } 
  else {
    if(!this.root) {
      this.root = node;
    } else {
      return 'Root node is already assigned';
    }
  }
};
Tree.prototype.remove = function(data) {
  if(this.root.data === data) {
    this.root = null;
  }

  var queue = [this.root];
  while(queue.length) {
    var node = queue.shift();
    for(var i = 0; i < node.children.length; i++) {
      if(node.children[i].data === data) {
        node.children.splice(i, 1);
      } else {
        queue.push(node.children[i]);
      }
    }
  }
};
Tree.prototype.contains = function(data) {
  return this.findBFS(data) ? true : false;
};
Tree.prototype.findBFS = function(data) {
  var queue = [this.root];
  while(queue.length) { 
    var node = queue.shift();
    if(String(node.data) === String(data)) {
      return node;
    }
    for(var i = 0; i < node.children.length; i++) {
      queue.push(node.children[i]);
    }
  }
  return null;
};
Tree.prototype._preOrder = function(node, fn) {
  if(node) {
    if(fn) {
      fn(node);
    }
    for(var i = 0; i < node.children.length; i++) {
      this._preOrder(node.children[i], fn);
    }
  }
};
Tree.prototype._postOrder = function(node, fn) {
  if(node) {
    for(var i = 0; i < node.children.length; i++) {
      this._postOrder(node.children[i], fn);
    }
    if(fn) {
      fn(node);
    }
  }
};
Tree.prototype.traverseDFS = function(fn, method) {
  var current = this.root;
  if(method) {
    this['_' + method](current, fn);
  } else {
    this._preOrder(current, fn);
  }
};
Tree.prototype.traverseBFS = function(fn) {
  var queue = [this.root];
  while(queue.length) {
    var node = queue.shift();
    if(fn) {
      fn(node);
    }
    for(var i = 0; i < node.children.length; i++) {
      queue.push(node.children[i]);
    }
  }
};
Tree.prototype.print = function() {
  if(!this.root) {
    return console.log('No root node found');
  }
  var newline = new Node('|');
  var queue = [this.root, newline];
  var string = '';
  while(queue.length) {
    var node = queue.shift();
    string += node.data.toString() + ' ';
    if(node === newline && queue.length) {
      queue.push(newline);
    }
    for(var i = 0; i < node.children.length; i++) {
      queue.push(node.children[i]);
    }
  }
  console.log(string.slice(0, -2).trim());
};
Tree.prototype.printByLevel = function() {
  if(!this.root) {
    return console.log('No root node found');
  }
  var newline = new Node('\n');
  var queue = [this.root, newline];
  var string = '';
  while(queue.length) {
    var node = queue.shift();
    string += node.data.toString() + (node.data !== '\n' ? ' ' : '');
    if(node === newline && queue.length) {
      queue.push(newline);
    }
    for(var i = 0; i < node.children.length; i++) {
      queue.push(node.children[i]);
    }
  }
  console.log(string.trim());
};
///////////////////////////////////////////////////////////
