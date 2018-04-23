Cesium.Math.setRandomNumberSeed(0);

var viewer=new Cesium.Viewer("cesiumContainer",{
    animation:!1,
    timeline:!1,
    fullscreenButton:!1,
    vrButton:!1,
    sceneModePicker:!1,
    homeButton:!0,
    navigationHelpButton:!1,
    baseLayerPicker:!0,
});
viewer.cesiumWidget.creditContainer.style.display="none";
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
viewer.scene.globe.depthTestAgainstTerrain = false;
var entities = viewer.entities;

var pointsList = [];//中间点list
var start_pos = 0;
var scene = viewer.scene;
var handler;
var point = '';
var existPointsList = [];//线段判定
var temp_height = 10;
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
            //console.log("lon: "+test.longitude+" la "+test.latitude);
            //console.log(Cesium.Math.toDegrees(test.latitude));
            existPointsList.push(new Cesium.Cartesian2(parseFloat(Cesium.Math.toDegrees(test.longitude).toFixed(12)), parseFloat(Cesium.Math.toDegrees(test.latitude).toFixed(12))));
            //pickedObjects.id.point.color = Cesium.Color.RED;
        }
    }

    if(existPointsList.length===2){
        var dict_key = Object.keys(connect_dict);
        if(dict_key.includes(String(existPointsList[0]))){
            connect_dict[existPointsList[0]].push(existPointsList[1]);
        }
        else{
            connect_dict[existPointsList[0]] = [];
            connect_dict[existPointsList[0]].push(existPointsList[1]);
        }
    if((pointsList.toString().includes(String(existPointsList[0])))&&(pointsList.toString().includes(String(existPointsList[1])))){
      connect_dict[existPointsList[1]] = [];
      connect_dict[existPointsList[1]].push(existPointsList[0]);
    }
        //console.log(existPointsList);
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
        console.log("!!!!!!!!!! "+Cesium.Cartesian3.fromDegrees(longitudeString,latitudeString))
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
    if(vecList.length>=2){
      var polylines = new Cesium.PolylineCollection();
      var keepout_tempArray = [];
      vecList.forEach(function(element){
        keepout_tempArray.push(element.x);
        keepout_tempArray.push(element.y);
      });

      polylines.add({
        positions : Cesium.Cartesian3.fromDegreesArray(keepout_tempArray),
        width : 1,
      });
      viewer.scene.primitives.add(polylines);
    }
}, Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.SHIFT);

handler.setInputAction(function(movement){
  var count=0;
  var length = vecList.length;
  var dict_key = Object.keys(connect_dict);
  var dict_value = Object.values(connect_dict);
  var vecDict = {};
  //console.log("key: " + dict_key);
  //console.log("value: "+ dict_value);
  for(;count<length;count++){
      for(var i = 0;i<dict_key.length;i++){
          if((vecList[count].x === convertStringtoPosition(dict_key[i])[0])&&
             (vecList[count].y === convertStringtoPosition(dict_key[i])[1])){
              //console.log("yes");
              vecDict[vecList[count]] = connect_dict[dict_key[i]];
          }
      }
  }
  count = 0;
  for(;count<length-1;count++){
    var path = [];
    var start_point = vecList[count];
    //console.log(start_point);
    var end_point = connect_dict[start_point][0];
    //console.log(start_point);
    //console.log(typeof end_point);
    var adjacentPointList = [];
    if(count === 0){
        adjacentPointList.push(vecList[count+1]);
        adjacentPointList.push(vecList[length-1]);
    }

    else{
        adjacentPointList.push(vecList[count-1]);
        adjacentPointList.push(vecList[count+1]);
    }
    //console.log(adjacentPointList);
    for(var x = 0; x<adjacentPointList.length;x++){
       path.push(start_point);
       path.push(adjacentPointList[x]);
       var nextPoints = connect_dict[adjacentPointList[x]][0];
       while(!Cesium.Cartesian2.equals(nextPoints,end_point)){
           path.push(nextPoints);
           nextPoints = connect_dict[nextPoints];
           for(var y = 0;y<nextPoints.length;y++){
               if(Cesium.Cartesian2.equals(nextPoints[y],end_point)){
                    nextPoints = nextPoints[y];
                    break;
               }

           }
       }
       path.push(end_point);
       //console.log("path "+path);
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
      //生成板
      draw_solar_panels_on_roof(outsidePoint,innerPoint);

      path = [];
    }
    break;
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
    // entities.add({
    //   name : 'Building',
    //   polygon : {
    //     hierarchy : new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArrayHeights(tempList)),
    //     perPositionHeight : true,
    //     extrudedHeight : 0.0,
    //     outline : true,
    //     outlineColor : Cesium.Color.BLACK,
    //     outlineWidth : 4,
    //     material : Cesium.Color.fromRandom({alpha : 0.5})
    //   }
    // });
    vecList = [];

  }
  connect_dict= {};

}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);


function convertStringtoPosition(t){
 // console.log(t);
  var items = t.replace(/^\(|\)$/g, "").split("),(");
  items.forEach(function(val, index, array) {
     array[index] = val.split(",").map(Number);
  });
  var position = [parseFloat(items[0][0]),parseFloat(items[0][1])];
  return position;
}

//given the coordinates of a starting point and a ending point, generate the mathematical equation
function math_make_a_line(x1,y1,x2,y2){
  var line_a = ((y2-y1)/(x2-x1));
  var line_b = (y1-(line_a*x1));
  return [line_a,line_b,[x1,y1],[x2,y2]];
}

function draw_solar_panels_on_roof(outsidePoint,innerPoint){
    /////////////////////////构建solar panel////////////////////////////////////////
    ///baseLine = [斜率，偏移，【一点坐标】，【二点坐标]】

    var baseLine = math_make_a_line(outsidePoint[0].x,outsidePoint[0].y,outsidePoint[1].x,outsidePoint[1].y);
    //console.log("bl"+baseLine)
    var tan;
    var cos;
    var sin;

    if(baseLine[0]>0){
        tan = Math.abs(baseLine[0]);
        cos = Math.sqrt(1/(tan*tan+1));
        sin = Math.sqrt(1-cos*cos);
    }
    else{
        tan = -Math.abs(baseLine[0]);
        cos = Math.sqrt(1/(tan*tan+1));
        sin = -Math.sqrt(1-cos*cos);
    }

    for(var n = 0;n<innerPoint.length;n++){
        var tempXIN = innerPoint[n].x;
        var tempYIN = innerPoint[n].y;
        innerPoint[n][0] = tempXIN*cos+tempYIN*sin;
        innerPoint[n][1] = (-tempXIN)*sin+tempYIN*cos;
    }
    for(n = 0;n<outsidePoint.length;n++){
        var tempXOUT = outsidePoint[n].x;
        var tempYOUT = outsidePoint[n].y;
        outsidePoint[n][0] = tempXOUT*cos+tempYOUT*sin;
        outsidePoint[n][1] = (-tempXOUT)*sin+tempYOUT*cos;
    }

    var points_sequence = [];
    var temp = [];
    for(n = 0;n<outsidePoint.length;n++){
        temp.push(outsidePoint[n][0]);
        temp.push(outsidePoint[n][1]);
        points_sequence.push(temp);
        temp = [];
    }
    for(n = 0;n<innerPoint.length;n++){
        temp.push(innerPoint[n][0]);
        temp.push(innerPoint[n][1]);
        points_sequence.push(temp);
        temp = [];
    }
    //console.log("path "+path);
    //console.log("ps "+points_sequence);
    var panel_width = 1.94;
    var panel_length = 1;
    var width_offset = 0.3;
    var length_offset = 0.2;
    roof_solar_panels(points_sequence, 5, panel_width, panel_length, width_offset, length_offset, sin, cos);
}


function roof_solar_panels(points_sequence, height, panel_width, panel_length, width_offset, length_offset, sin, cos){
    console.log("sin"+sin)
    console.log("cos"+cos)
    console.log("tan"+(sin/cos))

    console.log('\npoints_sequence')
    console.log(points_sequence)

    var new_cos = cos;
    var new_sin = -sin;

    var result = [];

    var boundings = generate_bounding_wnes(points_sequence);
    var west = boundings[0];
    var east = boundings[1];
    var north = boundings[2];
    var south = boundings[3];


    var test_color = Cesium.Color.fromRandom()
    viewer.entities.add({
      position : new Cesium.CallbackProperty(function() {
        return Cesium.Cartesian3.fromDegrees(west*new_cos+north*new_sin,-west*new_sin+north*new_cos);
        }, false),
      point : {
        pixelSize : 10,
        color : test_color
      }
    });
    viewer.entities.add({
      position : new Cesium.CallbackProperty(function() {
        return Cesium.Cartesian3.fromDegrees(west*new_cos+south*new_sin,-west*new_sin+south*new_cos);
        }, false),
      point : {
        pixelSize : 10,
        color : test_color
      }
    });
    viewer.entities.add({
      position : new Cesium.CallbackProperty(function() {
        return Cesium.Cartesian3.fromDegrees(east*new_cos+north*new_sin,-east*new_sin+north*new_cos);
        }, false),
      point : {
        pixelSize : 10,
        color : test_color
      }
    });
    viewer.entities.add({
      position : new Cesium.CallbackProperty(function() {
        return Cesium.Cartesian3.fromDegrees(east*new_cos+south*new_sin,-east*new_sin+south*new_cos);
        }, false),
      point : {
        pixelSize : 10,
        color : test_color
      }
    });
    var polylines = new Cesium.PolylineCollection();
    var tempArray = [];
    polylines.add({
      positions : Cesium.Cartesian3.fromDegreesArray([
        west*new_cos+north*new_sin,-west*new_sin+north*new_cos,
        west*new_cos+south*new_sin,-west*new_sin+south*new_cos,
        east*new_cos+south*new_sin,-east*new_sin+south*new_cos,
        east*new_cos+north*new_sin,-east*new_sin+north*new_cos,
        west*new_cos+north*new_sin,-west*new_sin+north*new_cos
      ]),
      width : 1,
      color: Cesium.Color.BLUE
    });
    viewer.scene.primitives.add(polylines);

    // console.log("\n")
    // for(var h = 0 ; h < points_sequence.length; h++){
    //   console.log(points_sequence[h])
    // }

    // console.log("west north"+west+ " " + north)
    // console.log("test"+((west*new_cos+north*new_sin)*cos+(-west*new_sin+north*new_cos)*sin) +" "+ (-(west*new_cos+north*new_sin)*sin+(-west*new_sin+north*new_cos)*cos))
    // console.log("west south"+west+ " " + south)
    // console.log("test"+((west*new_cos+south*new_sin)*cos+(-west*new_sin+south*new_cos)*sin) +" "+ (-(west*new_cos+south*new_sin)*sin+(-west*new_sin+south*new_cos)*cos))
    // console.log("east north"+east+ " " + north)
    // console.log("test"+((east*new_cos+north*new_sin)*cos+(-east*new_sin+north*new_cos)*sin) +" "+ (-(east*new_cos+north*new_sin)*sin+(-east*new_sin+north*new_cos)*cos))
    // console.log("east south"+east+ " " + south)
    // console.log("test"+((east*new_cos+south*new_sin)*cos+(-east*new_sin+south*new_cos)*sin) +" "+ (-(east*new_cos+south*new_sin)*sin+(-east*new_sin+south*new_cos)*cos))



    var direct = true;
    if(points_sequence[0][1]!== south && points_sequence[1][1]!== south){
      direct = false;
    }
    console.log("direct "+direct);

    //外围矩形点
    var outer_top_left = Cesium.Cartesian3.fromDegrees(west*new_cos+north*new_sin,-west*new_sin+north*new_cos);
    var outer_bot_left = Cesium.Cartesian3.fromDegrees(west*new_cos+south*new_sin,-west*new_sin+south*new_cos);
    var outer_top_right = Cesium.Cartesian3.fromDegrees(east*new_cos+north*new_sin,-east*new_sin+north*new_cos);
    var outer_bot_right = Cesium.Cartesian3.fromDegrees(east*new_cos+south*new_sin,-east*new_sin+south*new_cos);
    // console.log("outer_top_left "+outer_top_left)
    // console.log("outer_bot_left "+outer_bot_left)
    // console.log("outer_top_right "+outer_top_right)
    // console.log("outer_bot_right "+outer_bot_right)
    // console.log("\n")
    // console.log("vertical_distance"+(vertical_distance(Cesium.Cartesian3.fromDegrees(west,north),Cesium.Cartesian3.fromDegrees(west,south))))
    // console.log("horizental_distance"+(horizental_distance(Cesium.Cartesian3.fromDegrees(west,north),Cesium.Cartesian3.fromDegrees(west,south))))
    // console.log("distance"+(distance(Cesium.Cartesian3.fromDegrees(west,north),Cesium.Cartesian3.fromDegrees(west,south))))
    // console.log("vertical_distance"+(vertical_distance(Cesium.Cartesian3.fromDegrees(west,north),Cesium.Cartesian3.fromDegrees(east,north))))
    // console.log("horizental_distance"+(horizental_distance(Cesium.Cartesian3.fromDegrees(west,north),Cesium.Cartesian3.fromDegrees(east,north))))
    // console.log("distance"+(distance(Cesium.Cartesian3.fromDegrees(west,north),Cesium.Cartesian3.fromDegrees(east,north))))

    // Mathematical equations for bounding lines

    var rooftop_lines = [];

    for(var p = 0; p < points_sequence.length; p++){
        if(p !== (points_sequence.length - 1)){
            var line1 = math_make_a_line(points_sequence[p][0],points_sequence[p][1],points_sequence[p+1][0],points_sequence[p+1][1]);
            rooftop_lines.push(line1);
        }
        else{
            var line2 = math_make_a_line(points_sequence[p][0],points_sequence[p][1],points_sequence[0][0],points_sequence[0][1]);
            rooftop_lines.push(line2);
        }
    }


    // maximum distance of the out-bounding rectangle
    var max_vertical_dist = distance(Cesium.Cartesian3.fromDegrees(west*new_cos+north*new_sin,-west*new_sin+north*new_cos),Cesium.Cartesian3.fromDegrees(west*new_cos+south*new_sin,-west*new_sin+south*new_cos));


    var actual_vertical_dist = max_vertical_dist;

    //算太阳能板tan, cos
    var panel_tan = height/actual_vertical_dist;
    var panel_cos = Math.sqrt(1/(panel_tan*panel_tan+1));

    // number of rows
    var row_check = actual_vertical_dist-(panel_width*panel_cos);
    var rows = 0;
    if(row_check >= 0){
        rows = parseInt(row_check/(panel_width+width_offset)*panel_cos,10)+1;
    }
    //console.log('rows')
    //console.log(rows)
    console.log(actual_vertical_dist)
    console.log(rows)

    // 南北坐标差
    var north_south_diff = north - south;
    console.log(north)
    console.log(south)

    //北端起点
    var temp_north = north;


    var points = scene.primitives.add(new Cesium.PointPrimitiveCollection());


    for(var i = 0; i < rows; i++){

        //北-计算所有外框与北线的交点坐标 cor_list
        var temp_line_north = math_make_a_line(west, temp_north, east, temp_north);

        //北-北线交点坐标
        var cor_north_list = [];


        for(var l = 0; l < rooftop_lines.length; l ++){
            var cor_north_line = lines_intersection_coordinates(temp_line_north, rooftop_lines[l]);
            if(cor_north_line !== undefined && !isNaN(cor_north_line[0]) && !isNaN(cor_north_line[1])){
                cor_north_list.push(cor_north_line);
            }
        }

        console.log("cor_north_list: ",cor_north_list)

        cor_north_list.sort(Comparator);

        var temp_south = temp_north - (north_south_diff*panel_width/actual_vertical_dist);
        if(cor_north_list.length === 1){
            temp_north = temp_south - (north_south_diff*width_offset/actual_vertical_dist);
            continue;
        }

        for(var e = 0; e < cor_north_list.length; e+=2){

            //北-查找西交点 cor_north_left
            var cor_north_left = cor_north_list[e];

            //北-查找东交点 cor_north_right
            var cor_north_right = cor_north_list[e+1];

            //南-计算所有外框与南线的交点坐标 cor_list
            temp_south = temp_north - (north_south_diff*panel_width*panel_cos/actual_vertical_dist);

            var temp_line_south = math_make_a_line(west, temp_south, east, temp_south);

            //南-南线交点坐标
            var cor_south_list = [];

            for(l = 0; l < rooftop_lines.length; l ++){
                var cor_south_line = lines_intersection_coordinates(temp_line_south, rooftop_lines[l]);
                if(cor_south_line !== undefined && !isNaN(cor_south_line[0]) && !isNaN(cor_south_line[1])){
                    cor_south_list.push(cor_south_line);
                }
            }

            cor_south_list.sort(Comparator);

            for(var f = 0; f < cor_south_list.length; f+=2){

                //南-查找西交点 cor_north_left
                var cor_south_left = cor_south_list[f];


                //南-查找东交点 cor_north_right
                var cor_south_right = cor_south_list[f+1];


                if((cor_south_left[0] > cor_north_right[0]) || (cor_south_right[0] < cor_north_left[0])){
                    continue;
                }

                else{
                    //西-南北比较西侧最靠里的点
                    var left_ref_point;
                    var row_left;
                    if(cor_north_left[0] > cor_south_left[0]){
                        left_ref_point = Cesium.Cartesian3.fromDegrees(cor_north_left[0]*new_cos+cor_north_left[1]*new_sin,-cor_north_left[0]*new_sin+cor_north_left[1]*new_cos);
                        row_left = cor_north_left[0];
                    }else{
                        left_ref_point = Cesium.Cartesian3.fromDegrees(cor_south_left[0]*new_cos+cor_south_left[1]*new_sin,-cor_south_left[0]*new_sin+cor_south_left[1]*new_cos);
                        row_left = cor_south_left[0];
                    }

                    //东-南北比较东侧最靠里的点
                    var right_ref_point;
                    var row_right;
                    if(cor_north_right[0] < cor_south_right[0]){
                        right_ref_point = Cesium.Cartesian3.fromDegrees(cor_north_right[0]*new_cos+cor_north_right[1]*new_sin,-cor_north_right[0]*new_sin+cor_north_right[1]*new_cos);
                        row_right = cor_north_right[0];
                    }else{
                        right_ref_point = Cesium.Cartesian3.fromDegrees(cor_south_right[0]*new_cos+cor_south_right[1]*new_sin,-cor_south_right[0]*new_sin+cor_south_right[1]*new_cos);
                        row_right = cor_south_right[0];
                    }

                    //每一行最大东西距离
                    var max_horizental_dist = distance(left_ref_point, right_ref_point);
                    //每一行实际东西距离（扣除offset）
                    var actual_horizental_dist = max_horizental_dist;

                    //检查该列空间是否够放板，够放几列板
                    var col_check = actual_horizental_dist-panel_length;
                    var cols = 0;
                    if(col_check >= 0){
                        cols = parseInt(col_check/(panel_length+length_offset),10)+1;
                    }
                    //console.log('cols')
                    //console.log(cols)

                    //每一行东西距离差
                    var west_east_diff = row_right - row_left;

                    //临时最西面坐标
                    var temp_west = row_left;

                    for(var j = 0; j < cols; j++){

                        var temp_east = temp_west + (west_east_diff*panel_length/actual_horizental_dist);

                        var deodist1;
                        var deodist2;
                        var deodist3;
                        var deodist4;
                        var dist1;
                        var dist2;
                        var dist3;
                        var dist4;

                        if(direct === true){
                            deodist1 = new Cesium.EllipsoidGeodesic(
                                Cesium.Cartographic.fromDegrees(temp_west*new_cos+temp_south*new_sin,-temp_west*new_sin+temp_south*new_cos),
                                Cesium.Cartographic.fromDegrees(temp_west*new_cos+south*new_sin, -temp_west*new_sin+south*new_cos));
                            dist1 = deodist1.surfaceDistance;

                            deodist2 = new Cesium.EllipsoidGeodesic(
                                Cesium.Cartographic.fromDegrees(temp_east*new_cos+temp_south*new_sin,-temp_east*new_sin+temp_south*new_cos),
                                Cesium.Cartographic.fromDegrees(temp_east*new_cos+south*new_sin,-temp_east*new_sin+south*new_cos));
                            dist2 = deodist2.surfaceDistance;

                            deodist3 = new Cesium.EllipsoidGeodesic(
                                Cesium.Cartographic.fromDegrees(temp_east*new_cos+temp_north*new_sin,-temp_east*new_sin+temp_north*new_cos),
                                Cesium.Cartographic.fromDegrees(temp_east*new_cos+south*new_sin, -temp_east*new_sin+south*new_cos));
                            dist3 = deodist3.surfaceDistance;

                            deodist4 = new Cesium.EllipsoidGeodesic(
                                Cesium.Cartographic.fromDegrees(temp_west*new_cos+temp_north*new_sin,-temp_west*new_sin+temp_north*new_cos),
                                Cesium.Cartographic.fromDegrees(temp_west*new_cos+south*new_sin, -temp_west*new_sin+south*new_cos));
                            dist4 = deodist4.surfaceDistance;
                        }else{
                          deodist1 = new Cesium.EllipsoidGeodesic(
                              Cesium.Cartographic.fromDegrees(temp_west*new_cos+temp_south*new_sin,-temp_west*new_sin+temp_south*new_cos),
                              Cesium.Cartographic.fromDegrees(temp_west*new_cos+north*new_sin, -temp_west*new_sin+north*new_cos));
                          dist1 = deodist1.surfaceDistance;

                          deodist2 = new Cesium.EllipsoidGeodesic(
                              Cesium.Cartographic.fromDegrees(temp_east*new_cos+temp_south*new_sin,-temp_east*new_sin+temp_south*new_cos),
                              Cesium.Cartographic.fromDegrees(temp_east*new_cos+north*new_sin,-temp_east*new_sin+north*new_cos));
                          dist2 = deodist2.surfaceDistance;

                          deodist3 = new Cesium.EllipsoidGeodesic(
                              Cesium.Cartographic.fromDegrees(temp_east*new_cos+temp_north*new_sin,-temp_east*new_sin+temp_north*new_cos),
                              Cesium.Cartographic.fromDegrees(temp_east*new_cos+north*new_sin, -temp_east*new_sin+north*new_cos));
                          dist3 = deodist3.surfaceDistance;

                          deodist4 = new Cesium.EllipsoidGeodesic(
                              Cesium.Cartographic.fromDegrees(temp_west*new_cos+temp_north*new_sin,-temp_west*new_sin+temp_north*new_cos),
                              Cesium.Cartographic.fromDegrees(temp_west*new_cos+north*new_sin, -temp_west*new_sin+north*new_cos));
                          dist4 = deodist4.surfaceDistance;
                        }


                        viewer.entities.add({
                          name : "PV",
                          polygon : {
                            hierarchy : Cesium.Cartesian3.fromDegreesArray([
                                temp_west*new_cos+temp_south*new_sin,-temp_west*new_sin+temp_south*new_cos,
                                temp_east*new_cos+temp_south*new_sin,-temp_east*new_sin+temp_south*new_cos,
                                temp_east*new_cos+temp_north*new_sin,-temp_east*new_sin+temp_north*new_cos,
                                temp_west*new_cos+temp_north*new_sin,-temp_west*new_sin+temp_north*new_cos,]),
                            // hierarchy : Cesium.Cartesian3.fromDegreesArrayHeights([
                            //     temp_west*new_cos+temp_south*new_sin,-temp_west*new_sin+temp_south*new_cos,10.1+(dist1*panel_tan),
                            //     temp_east*new_cos+temp_south*new_sin,-temp_east*new_sin+temp_south*new_cos,10.1+(dist2*panel_tan),
                            //     temp_east*new_cos+temp_north*new_sin,-temp_east*new_sin+temp_north*new_cos,10.1+(dist3*panel_tan),
                            //     temp_west*new_cos+temp_north*new_sin,-temp_west*new_sin+temp_north*new_cos,10.1+(dist4*panel_tan)]),
                            perPositionHeight : true,
                            outline : true,
                            material : Cesium.Color.ROYALBLUE,
                          }
                        });
                        //result.push([temp_west,temp_south,10,temp_east,temp_south,10,temp_east,temp_north,10.5,temp_west,temp_north,10.5]);

                        temp_west = temp_east + (west_east_diff*length_offset/actual_horizental_dist);
                    }
                }
            }
        }
        temp_north = temp_south - (north_south_diff*width_offset*panel_cos/actual_vertical_dist);
    }
    //console.log(result.length)
    //return result;
}


//calculate the intersection coordinate of two lines in mathematical equations
function lines_intersection_coordinates(baseline,line2){
    var x = (line2[1]-baseline[1])/(baseline[0]-line2[0]);
    var y = baseline[0]*x+baseline[1];
    if((x<line2[2][0] && x<line2[3][0]) || (x>line2[2][0] && x>line2[3][0]) || (y<line2[2][1] && y<line2[3][1]) || (y>line2[2][1] && y>line2[3][1])){
        return undefined;
    }
    return [x,y];
}

function lines_intersection_coordinates_keepout(baseline,line2){
    var x = (line2[1]-baseline[1])/(baseline[0]-line2[0]);
    var y = baseline[0]*x+baseline[1];
    if((x<line2[2][0] && x<line2[3][0]) || (x>line2[2][0] && x>line2[3][0]) || (y<line2[2][1] && y<line2[3][1]) || (y>line2[2][1] && y>line2[3][1]) || (x<baseline[2][0] && x<baseline[3][0]) || (x>baseline[2][0] && x>baseline[3][0]) || (y<baseline[2][1] && y<baseline[3][1]) || (y>baseline[2][1] && y>baseline[3][1])){
        return undefined;
    }
    return [x,y];
}

//calculate the intersection coordinate of two lines for setback function
function lines_intersection_coordinates_setback(baseline,line2){
    var x = (line2[1]-baseline[1])/(baseline[0]-line2[0]);
    var y = baseline[0]*x+baseline[1];
    return [x,y];
}

//calculate the horizental distnce in meters between two Cartesian3 points
function vertical_distance(point1,point2){
    var p1_weidu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point1).longitude);
    var p1_jingdu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point1).latitude);
    var p2_weidu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point2).longitude);

    var deodist = new Cesium.EllipsoidGeodesic(Cesium.Cartographic.fromDegrees(p1_weidu, p1_jingdu),Cesium.Cartographic.fromDegrees(p2_weidu, p1_jingdu));
    var dist = deodist.surfaceDistance;
    return dist;
}

function distance(point1, point2){
    var p1_weidu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point1).longitude);
    var p1_jingdu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point1).latitude);
    var p2_weidu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point2).longitude);
    var p2_jingdu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point2).latitude);

    var deodist = new Cesium.EllipsoidGeodesic(Cesium.Cartographic.fromDegrees(p1_weidu, p1_jingdu),Cesium.Cartographic.fromDegrees(p2_weidu, p2_jingdu));
    var dist = deodist.surfaceDistance;
    return dist;
}

//calculate the vertical distnce in meters between two Cartesian3 points
function horizental_distance(point1,point2){
    var p1_weidu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point1).longitude);
    var p1_jingdu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point1).latitude);
    var p2_jingdu = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(point2).latitude);

    var deodist = new Cesium.EllipsoidGeodesic(Cesium.Cartographic.fromDegrees(p1_weidu, p1_jingdu),Cesium.Cartographic.fromDegrees(p1_weidu, p2_jingdu));
    var dist = deodist.surfaceDistance;
    return dist;
}


//list排序辅助
function Comparator(a, b) {
   return (a[0] > b[0]);
 }

function generate_bounding_wnes(points_sequence){
     //points_sequence中分类东西南北坐标
     var lons = [];
     var lats = [];
     for (var i = 0; i < points_sequence.length; i++) {
         lons.push(points_sequence[i][0]);
         lats.push(points_sequence[i][1]);
     }


     //东南西北极值
     var west = Math.min.apply(null,lons);
     var east = Math.max.apply(null,lons);
     var north = Math.max.apply(null,lats);
     var south = Math.min.apply(null,lats);
     return [west,east,north,south];
 }

function roof_panel_cors_rotate_back(solar_panels_sequence,sin, cos){
    var new_cos = cos;
    var new_sin = -sin;
    var new_solar_panels_sequence = [];
    var temp = [];
    for(var i = 0; i < solar_panels_sequence.length; i ++){

        for(var j = 0; j < solar_panels_sequence[i].length; j+=3){
            var x = solar_panels_sequence[i][j];
            var y = solar_panels_sequence[i][j+1];
            temp.push(x*new_cos+y*new_sin);
            temp.push(-x*new_sin+y*new_cos);
            temp.push(solar_panels_sequence[i][j+2]);
        }
        new_solar_panels_sequence.push(temp);
        temp = [];
    }
    //console.log(new_solar_panels_sequence.length)
    return new_solar_panels_sequence;
}

// 画旋转太阳能板
function draw_ratoate_solar_panels(solar_panels_sequence){
    for(var i = 0; i < solar_panels_sequence.length; i++){
        //console.log(solar_panels_sequence[i])
        viewer.entities.add({
          name : "PV",
          polygon : {
            hierarchy : Cesium.Cartesian3.fromDegreesArrayHeights(solar_panels_sequence[i]),
            perPositionHeight : true,
            outline : true,
            material : Cesium.Color.ROYALBLUE,
          }
        });
    }
}


//=================================Keepout=====================================//
handler.setInputAction(function(movement){
    var pickedEntities = new Cesium.EntityCollection();
    var pickedObjects = scene.pick(movement.position);
    if(pickedObjects !== undefined && pickedObjects.id.name === "PV"){
      viewer.entities.remove(pickedObjects.id);
    }
    else{
      console.log("no picked entity");
    }

}, Cesium.ScreenSpaceEventType.LEFT_CLICK, Cesium.KeyboardEventModifier.ALT);


var keepout_points = [];
var keepoutList = [];
//画房子外形函数
handler.setInputAction(function(movement){
  var cartesian = viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);

  if (cartesian){
    var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    var this_point = [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];
    keepout_points.push(this_point);
    var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
    var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);

    keepoutList.push(new Cesium.Cartesian2(longitudeString,latitudeString));

    //初始化起始点
    if(start_pos === 0){
      start_pos = new Cesium.Cartesian2(longitudeString,latitudeString);
    }

    //节点处生成黄点
    var point = viewer.entities.add({
        position : new Cesium.CallbackProperty(function() {
          return Cesium.Cartesian3.fromDegrees(longitudeString, latitudeString);
          }, false),
        point : {
          pixelSize : 8,
          color : Cesium.Color.GREEN
        }
    });

    //如果vecList有两点及以上开始画线
    if(keepoutList.length>=2){
      var polylines = new Cesium.PolylineCollection();
      var tempArray = [];
      keepoutList.forEach(function(element){
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
}, Cesium.ScreenSpaceEventType.RIGHT_CLICK, Cesium.KeyboardEventModifier.ALT);



//双击闭合房子外沿函数
handler.setInputAction(function(movement){
  if(keepoutList.length !== 0){
    var tempList = [];
    keepoutList.forEach(function(element){
      tempList.push(element.x);
      tempList.push(element.y);
      tempList.push(15);
    });

    entities.add({
      name : 'Keepout',
      description : "<button onclick=\"myFunction()\">Click me</button>",
      polygon : {
        hierarchy : Cesium.Cartesian3.fromDegreesArrayHeights(tempList),
        perPositionHeight : true,
        extrudedHeight : 0.0,
        outline : true,
        outlineColor : Cesium.Color.BLACK,
        outlineWidth : 4,
        material : new Cesium.ColorMaterialProperty({
            color : Cesium.Color.GREEN,
            alpha : 0.7
        })
      }
    });
    keepoutList = [];
  }

  Keepout_Delete_Panel(keepout_points);
  //var new_keepout_points = rotateaxis(keepout_points,0);
  //var solar_panels = rotate_solar_panels_cors(new_keepout_points, solar_panel_width, solar_panel_length, width_offset, length_offset, top_down_offset,0);
  //var new_solar_panels = rotatebackaxis(solar_panels,0);
  //draw_ratoate_solar_panelsS(new_solar_panels);
  keepout_points = [];

}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK, Cesium.KeyboardEventModifier.ALT);



function Intersect_Keepout(PV_entities, keepout_points){
  console.log(PV_entities[0].polygon.hierarchy.getValue().length)
  console.log(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(PV_entities[0].polygon.hierarchy.getValue()[0]).longitude));
  console.log(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(PV_entities[0].polygon.hierarchy.getValue()[0]).latitude));
  console.log(keepout_points.length)

  var boundings = generate_bounding_wnes(keepout_points);
  var west = boundings[0];
  var east = boundings[1];
  var north = boundings[2];
  var south = boundings[3];






  var polylines = new Cesium.PolylineCollection();
  polylines.add({
    positions : Cesium.Cartesian3.fromDegreesArray([
      west,north,
      west,south,
      east,south,
      east,north,
      west,north
    ]),
    width : 1,
    color: Cesium.Color.BLUE
  });
  viewer.scene.primitives.add(polylines);






  var filtered_PV_entities = [];
  var remove_PV_entities = [];

  for(var p=0; p < PV_entities.length; p++){
    var all_points_exclusive = false;
    var exclusive_counter = 0;

    for(var q=0; q < PV_entities[p].polygon.hierarchy.getValue().length; q++){
      var longitude = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(PV_entities[p].polygon.hierarchy.getValue()[q]).longitude)
      var latitude = Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(PV_entities[p].polygon.hierarchy.getValue()[q]).latitude)
      if((longitude < west || longitude > east) || (latitude < south || latitude > north)){
        exclusive_counter += 1;
      }
    }

    if(exclusive_counter === 4){
      all_points_exclusive = true;
    }

    if(all_points_exclusive === false){
      filtered_PV_entities.push(PV_entities[p]);
    }
  }

  console.log("filtered_PV_entities")
  console.log(filtered_PV_entities.length)
  console.log("============================")

  for(p = 0; p < PV_entities.length; p++){
    for(q = 0; q < 4; q++){

      var longitude1 = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(PV_entities[p].polygon.hierarchy.getValue()[q]).longitude).toFixed(12));
      var latitude1 = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(PV_entities[p].polygon.hierarchy.getValue()[q]).latitude).toFixed(12));

      if(q !== 3){
        var longitude2 = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(PV_entities[p].polygon.hierarchy.getValue()[q+1]).longitude).toFixed(12));
        var latitude2 = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(PV_entities[p].polygon.hierarchy.getValue()[q+1]).latitude).toFixed(12));
        // keepout_edges.push(base_line1);
      }
      else{
        var longitude2 = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(PV_entities[p].polygon.hierarchy.getValue()[0]).longitude).toFixed(12));
        var latitude2 = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(PV_entities[p].polygon.hierarchy.getValue()[0]).latitude).toFixed(12));
        // keepout_edges.push(base_line2);
      }

      var temp_line = math_make_a_line(longitude1,latitude1,longitude2,latitude2);
      var west_north_south_line = math_make_a_line(west,north,west,south);
      var east_north_south_line = math_make_a_line(east,north,east,south);
      var north_west_east_line = math_make_a_line(west,north,east,north);
      var south_west_east_line = math_make_a_line(west,south,east,south);

      // polylines.add({
      //     positions : Cesium.Cartesian3.fromDegreesArray([longitude1,latitude1,longitude2,latitude2]),
      //     width : 1,
      // });
      // viewer.scene.primitives.add(polylines);

      var intersection_coordinate_1 = lines_intersection_coordinates_keepout(temp_line,west_north_south_line);
      var intersection_coordinate_2 = lines_intersection_coordinates_keepout(temp_line,east_north_south_line);
      var intersection_coordinate_3 = lines_intersection_coordinates_keepout(temp_line,north_west_east_line);
      var intersection_coordinate_4 = lines_intersection_coordinates_keepout(temp_line,south_west_east_line);

      if(intersection_coordinate_1 !==undefined || intersection_coordinate_2 !==undefined || intersection_coordinate_3 !==undefined || intersection_coordinate_4 !==undefined){
        if(!filtered_PV_entities.includes(PV_entities[p])){
          filtered_PV_entities.push(PV_entities[p])
        }
      }

      // console.log("intersection_list")
      // console.log(intersection_list.length)
      //if(already_intersected === true){
        //break;
      //}

    }
    // console.log("======================")
  }

  // for(var p = 0; p < filtered_PV_entities.length; p++){
  //   for(var q=0; q < filtered_PV_entities[p].polygon.hierarchy.getValue().length; q++){
  //     polylines.add({
  //       positions : Cesium.Cartesian3.fromDegreesArray([
  //         Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(filtered_PV_entities[p].polygon.hierarchy.getValue()[q]).longitude),
  //         Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(filtered_PV_entities[p].polygon.hierarchy.getValue()[q]).latitude),
  //         Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(filtered_PV_entities[p].polygon.hierarchy.getValue()[q]).longitude)-10,
  //         Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(filtered_PV_entities[p].polygon.hierarchy.getValue()[q]).latitude)]),
  //       width : 1,
  //     });
  //     viewer.scene.primitives.add(polylines);
  //   }
  // }

  console.log("filtered_PV_entities")
  console.log(filtered_PV_entities.length)
  console.log("============================")

  for(p = 0; p < filtered_PV_entities.length; p++){
    for(q = 0; q < filtered_PV_entities[p].polygon.hierarchy.getValue().length; q++){
      var longitude = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(filtered_PV_entities[p].polygon.hierarchy.getValue()[q]).longitude).toFixed(12));
      var latitude = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(filtered_PV_entities[p].polygon.hierarchy.getValue()[q]).latitude).toFixed(12));

      for(var o = 0; o < keepout_points.length; o++){
        if(longitude === parseFloat(keepout_points[o][0].toFixed(12)) && latitude === parseFloat(keepout_points[o][0].toFixed(12))){
          if(!remove_PV_entities.includes(filtered_PV_entities[p])){
            remove_PV_entities.push(filtered_PV_entities[p]);
          }
        }
      }

      var temp_lines_a_and_b = [];
      for(o = 0; o < keepout_points.length; o++){
        var temp_line = math_make_a_line(longitude, latitude, keepout_points[o][0],keepout_points[o][1]);
        if(temp_lines_a_and_b.includes([temp_line[0],temp_line[1]])){
          if(!remove_PV_entities.includes(filtered_PV_entities[p])){
            remove_PV_entities.push(filtered_PV_entities[p]);
          }
        }
        temp_lines_a_and_b.push([temp_line[0],temp_line[1]]);
      }
    }
    //console.log("remove_PV_entities")
    //console.log(remove_PV_entities.length)
  }

  var keepout_edges = [];

  for(p = 0; p < keepout_points.length; p++){
      if(p !== (keepout_points.length - 1)){
          var base_line1 = math_make_a_line(keepout_points[p][0],keepout_points[p][1],keepout_points[p+1][0],keepout_points[p+1][1]);
          keepout_edges.push(base_line1);
      }
      else{
          var base_line2 = math_make_a_line(keepout_points[p][0],keepout_points[p][1],keepout_points[0][0],keepout_points[0][1]);
          keepout_edges.push(base_line2);
      }
  }

  for(p = 0; p < filtered_PV_entities.length; p++){
    for(q = 0; q < 4; q++){
      var longitude = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(filtered_PV_entities[p].polygon.hierarchy.getValue()[q]).longitude).toFixed(12));
      var latitude = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(filtered_PV_entities[p].polygon.hierarchy.getValue()[q]).latitude).toFixed(12));
      var temp_line = math_make_a_line(longitude,latitude,longitude-10,latitude);

      // polylines.add({
      //     positions : Cesium.Cartesian3.fromDegreesArray([longitude,latitude,longitude-10,latitude]),
      //     width : 1,
      // });
      // viewer.scene.primitives.add(polylines);

      var intersection_list = [];
      for(o = 0; o <keepout_edges.length; o++){
        var intersection_coordinate = lines_intersection_coordinates_keepout(temp_line,keepout_edges[o]);

        if(intersection_coordinate !==undefined){
          // console.log(intersection_coordinate)
        }

        if(intersection_coordinate !==undefined && !isNaN(intersection_coordinate[0]) && !isNaN(intersection_coordinate[1]) && !intersection_list.includes(intersection_coordinate)){
          intersection_list.push(intersection_coordinate)
        }
      }
      // console.log("intersection_list")
      // console.log(intersection_list.length)
      if(intersection_list.length % 2 === 1){
        if(!remove_PV_entities.includes(filtered_PV_entities[p])){
          remove_PV_entities.push(filtered_PV_entities[p]);
        }
      }

    }
    // console.log("======================")
  }
  // console.log("remove_PV_entities")
  // console.log(remove_PV_entities.length)
  for(p = 0; p < filtered_PV_entities.length; p++){
    for(q = 0; q < 4; q++){

      var longitude1 = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(filtered_PV_entities[p].polygon.hierarchy.getValue()[q]).longitude).toFixed(12));
      var latitude1 = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(filtered_PV_entities[p].polygon.hierarchy.getValue()[q]).latitude).toFixed(12));

      if(q !== 3){
        var longitude2 = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(filtered_PV_entities[p].polygon.hierarchy.getValue()[q+1]).longitude).toFixed(12));
        var latitude2 = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(filtered_PV_entities[p].polygon.hierarchy.getValue()[q+1]).latitude).toFixed(12));
        // keepout_edges.push(base_line1);
      }
      else{
        var longitude2 = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(filtered_PV_entities[p].polygon.hierarchy.getValue()[0]).longitude).toFixed(12));
        var latitude2 = parseFloat(Cesium.Math.toDegrees(Cesium.Cartographic.fromCartesian(filtered_PV_entities[p].polygon.hierarchy.getValue()[0]).latitude).toFixed(12));
        // keepout_edges.push(base_line2);
      }

      var temp_line = math_make_a_line(longitude1,latitude1,longitude2,latitude2);

      // polylines.add({
      //     positions : Cesium.Cartesian3.fromDegreesArray([longitude1,latitude1,longitude2,latitude2]),
      //     width : 1,
      // });
      // viewer.scene.primitives.add(polylines);

      var already_intersected = false;
      var intersection_list = [];
      for(o = 0; o <keepout_edges.length; o++){
        var intersection_coordinate = lines_intersection_coordinates_keepout(temp_line,keepout_edges[o]);
        //console.log(intersection_coordinate)

        if(intersection_coordinate !==undefined && !isNaN(intersection_coordinate[0]) && !isNaN(intersection_coordinate[1]) && !remove_PV_entities.includes(filtered_PV_entities[p])){
          remove_PV_entities.push(filtered_PV_entities[p])
          already_intersected = true;
          //break;
        }
      }
      //console.log("===============================")
      // console.log("intersection_list")
      // console.log(intersection_list.length)
      //if(already_intersected === true){
        //break;
      //}

    }
    // console.log("======================")
  }

  return remove_PV_entities;
}

function Keepout_Delete_Panel(keepout_points){
  var PV_entities = [];
  for(var i=0; i < viewer.entities.values.length; i++){
    if(viewer.entities.values[i].name === "PV"){
      PV_entities.push(viewer.entities.values[i]);
      //var test = viewer.entities.values[i].polygon.hierarchy.getValue(viewer.clock.currentTime)
      //console.log(test)
    }
  }

  var remove_PV_entities = Intersect_Keepout(PV_entities, keepout_points);

  for(var p = 0; p < remove_PV_entities.length; p++){
    // console.log(remove_PV_entities[p].id)
    // remove_PV_entities[p].polygon.material=Cesium.Color.GREEN;
    viewer.entities.remove(remove_PV_entities[p]);
  }
}
