
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

var solar_panel_width = 3;
var solar_panel_length = 3;
var width_offset = 0.5;
var length_offset = 0.3;
var top_down_offset = 0.2;
var left_right_offset = 0.2;


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

//given the coordinates of a starting point and a ending point, generate the mathematical equation
function math_make_a_line(x1,y1,x2,y2){
    var line_a = ((y2-y1)/(x2-x1));
    var line_b = (y1-(line_a*x1));
    return [line_a,line_b];
}

//calculate the intersection coordinate of two lines in mathematical equations
function lines_intersection_coordinates(line1,line2){
    var x = (line2[1]-line1[1])/(line1[0]-line2[0]);
    var y = line1[0]*x+line1[1];
    return [x,y];
}

//calculate the horizental distnce in meters between two Cartesian3 points
function horizental_distance(point1,point2){
    var p1_weidu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point1).longitude);
    var p1_jingdu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point1).latitude);
    var p2_weidu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point2).longitude);

    var deodist = new Cesium.EllipsoidGeodesic(Cesium.Cartographic.fromDegrees(p1_weidu, p1_jingdu),Cesium.Cartographic.fromDegrees(p2_weidu, p1_jingdu));
    var dist = deodist.surfaceDistance;
    return dist;
}

//calculate the vertical distnce in meters between two Cartesian3 points
function vertical_distance(point1,point2){
    var p1_weidu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point1).longitude);
    var p1_jingdu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point1).latitude);
    var p2_jingdu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point2).latitude);

    var deodist = new Cesium.EllipsoidGeodesic(Cesium.Cartographic.fromDegrees(p1_weidu, p1_jingdu),Cesium.Cartographic.fromDegrees(p1_weidu, p2_jingdu));
    var dist = deodist.surfaceDistance;
    return dist;
}

//maximum values of four directions
var west = -117.845616;
var east = -117.845430;
var north = 33.645954;
var south = 33.645843;


var top_left = Cesium.Cartesian3.fromDegrees(-117.845573,north);
var bot_left = Cesium.Cartesian3.fromDegrees(west,south);
var top_right = Cesium.Cartesian3.fromDegrees(east,north);
var bot_right = Cesium.Cartesian3.fromDegrees(-117.845468,south);

var outer_top_left = Cesium.Cartesian3.fromDegrees(west,north);
var outer_bot_left = bot_left;
var outer_top_right = top_right;
var outer_bot_right = Cesium.Cartesian3.fromDegrees(east,south);


// draw bounding lines
var pol = new Cesium.PolylineCollection();
pol.add({
    positions:Cesium.Cartesian3.fromDegreesArray([
        -117.845573,north,west,south]),
    width:1
});
pol.add({
    positions:Cesium.Cartesian3.fromDegreesArray([
        west,south,-117.845468,south]),
    width:1
});
pol.add({
    positions:Cesium.Cartesian3.fromDegreesArray([
        -117.845468,south,east,north]),
    width:1
});
pol.add({
    positions:Cesium.Cartesian3.fromDegreesArray([
        east,north,-117.845573,north]),
    width:1
});
viewer.scene.primitives.add(pol);







// Mathematical equations for bounding lines
var left_line = math_make_a_line(-117.845573,north, west, south);
var top_line = math_make_a_line(-117.845573, north, east, north);
var right_line = math_make_a_line(east, north, -117.845468, south);
var bot_line = math_make_a_line(-117.845468, south, west, south);




// maximum distance of the out-bounding rectangle
var max_vertical_dist = vertical_distance(outer_top_left, outer_bot_left);


// number of rows
var actual_vertical_dist = max_vertical_dist - 2*top_down_offset;
var rows = parseInt(actual_vertical_dist/(solar_panel_width+width_offset),10);

// distance of each step on rows
var north_south_diff = north - south; //纬度差
var row_step = north_south_diff/rows;


var temp_north = north - ((top_down_offset/actual_vertical_dist)*(north-south)); //临时最北面纬度=最北面纬度-（屋檐宽度/南北距离差）*（南北纬度差）

var points = scene.primitives.add(new Cesium.PointPrimitiveCollection());

for(var i = 0; i < rows; i++){
    var temp_line_north = math_make_a_line(west, temp_north, west-10, temp_north);
    var cor_north_left = lines_intersection_coordinates(temp_line_north, left_line);
    var cor_north_right = lines_intersection_coordinates(temp_line_north, right_line);

    var temp_south = temp_north - (row_step*(solar_panel_width / (solar_panel_width+width_offset)));

    var temp_line_south = math_make_a_line(west, temp_south, west-10, temp_south);
    var cor_south_left = lines_intersection_coordinates(temp_line_south, left_line);
    var cor_south_right = lines_intersection_coordinates(temp_line_south, right_line);

    var left_ref_point;
    var row_left;
    if(cor_north_left[0] > cor_south_left[0]){
        left_ref_point = Cesium.Cartesian3.fromDegrees(cor_north_left[0],cor_north_left[1]);
        row_left = cor_north_left[0];
    }else{
        left_ref_point = Cesium.Cartesian3.fromDegrees(cor_south_left[0],cor_south_left[1]);
        row_left = cor_south_left[0];
    }

    var right_ref_point;
    var row_right;
    if(cor_north_right[0] < cor_south_right[0]){
        right_ref_point = Cesium.Cartesian3.fromDegrees(cor_north_right[0],cor_north_right[1]);
        row_right = cor_north_right[0];
    }else{
        right_ref_point = Cesium.Cartesian3.fromDegrees(cor_south_right[0],cor_south_right[1]);
        row_right = cor_south_right[0];
    }

    var max_horizental_dist = horizental_distance(left_ref_point, right_ref_point);
    var actual_horizental_dist = max_horizental_dist - 2*left_right_offset;
    var cols = parseInt(actual_horizental_dist/(solar_panel_length+length_offset),10);

    var west_east_diff = row_right - row_left; //每一行经度差
    var col_step = west_east_diff/cols;

    var temp_west = row_left + ((left_right_offset/actual_horizental_dist)*(row_right-row_left)); //临时最西面纬度=最西面纬度+（屋檐宽度/东西距离差）*（东西纬度差）

    for(var j = 0; j < cols; j++){
        var temp_east = temp_west + (col_step*(solar_panel_length / (solar_panel_length+length_offset)));

        viewer.entities.add({
        rectangle : {
            coordinates : Cesium.Rectangle.fromDegrees(temp_west, temp_south, temp_east, temp_north),
            material : new Cesium.GridMaterialProperty({
                color : Cesium.Color.BLUE,
                cellAlpha : 0.4,
                lineCount : new Cesium.Cartesian2(1, 1),
                lineThickness : new Cesium.Cartesian2(2.0, 2.0)
            })
        }
        });
        temp_west = temp_east + (col_step*(length_offset / (solar_panel_length+length_offset)));
    }

    temp_north = temp_south - (row_step*(width_offset / (solar_panel_width+width_offset)));
}





//var geodesic1 = new Cesium.EllipsoidGeodesic(Cesium.Cartographic.fromDegrees(west, north, 0), Cesium.Cartographic.fromDegrees(east, north, 0));
//var length = geodesic1.surfaceDistance;

//var geodesic2 = new Cesium.EllipsoidGeodesic(Cesium.Cartographic.fromDegrees(west, north, 0), Cesium.Cartographic.fromDegrees(west, south, 0));
//var width = geodesic2.surfaceDistance;

//var rows = parseInt(width / (solar_panel_width+width_offset),10);
//var cols = parseInt(length / (solar_panel_length+length_offset),10);


//var north_sourth_diff = north - south;
//var west_east_diff = east - west;

//var row_step = north_sourth_diff/rows;
//var col_step = west_east_diff/cols;

//var temp_north = north;

//for (var i = 0; i < rows; i++){

//    var temp_west = west;

//    var temp_south = temp_north - (row_step*(solar_panel_width / (solar_panel_width+width_offset)));

//    for (var j = 0; j < cols; j++){
//        var temp_east = temp_west + (col_step*(solar_panel_length / (solar_panel_length+length_offset)));

//        viewer.entities.add({
//        rectangle : {
//            coordinates : Cesium.Rectangle.fromDegrees(temp_west, temp_south, temp_east, temp_north),
//            material : new Cesium.GridMaterialProperty({
//                color : Cesium.Color.BLUE,
//                cellAlpha : 0.4,
//                lineCount : new Cesium.Cartesian2(1, 1),
//                lineThickness : new Cesium.Cartesian2(2.0, 2.0)
//            })
//        }
//        });
//        temp_west = temp_east + (col_step*(length_offset / (solar_panel_length+length_offset)));
//    }
//    temp_north = temp_south - (row_step*(width_offset / (solar_panel_width+width_offset)));

//}



viewer.zoomTo(viewer.entities);
