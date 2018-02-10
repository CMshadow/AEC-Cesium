//Seed随机数
Cesium.Math.setRandomNumberSeed(0);


//太阳能板参数
var solar_panel_width = 2;
var solar_panel_length = 1;
var width_offset = 0.3;
var length_offset = 0.2;
var top_down_offset = 1.5;

//房屋点sequence
var building_points = [];

//定义viewer
var viewer = new Cesium.Viewer('cesiumContainer');


//删除默认双击功能
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);


//定义entities
var entities = viewer.entities;



var vecList = [];
var start_pos = 0;
var scene = viewer.scene;
var handler;

//定义handler
handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

//画房子外形函数
handler.setInputAction(function(movement){
  var cartesian = viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);

  if (cartesian){
    var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    var this_point = [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];
    building_points.push(this_point);
    var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
    var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);

    vecList.push(new Cesium.Cartesian2(longitudeString,latitudeString));

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
          color : Cesium.Color.YELLOW
        }
    });

    //如果vecList有两点及以上开始画线
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



//双击闭合房子外沿函数
handler.setInputAction(function(movement){
  if(vecList.length !== 0){
    var tempList = [];
    vecList.forEach(function(element){
      tempList.push(element.x);
      tempList.push(element.y);
      tempList.push(10);
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

  draw_solar_panels(building_points, solar_panel_width, solar_panel_length, width_offset, length_offset, top_down_offset);

}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);


//given the coordinates of a starting point and a ending point, generate the mathematical equation
function math_make_a_line(x1,y1,x2,y2){
    var line_a = ((y2-y1)/(x2-x1));
    var line_b = (y1-(line_a*x1));
    return [line_a,line_b,[x1,y1],[x2,y2]];
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


//在给定点范围内生成太阳能板
function draw_solar_panels(points_sequence, panel_width, panel_length, width_offset, length_offset, rooftop_offset){


    //points_sequence中分类东西南北坐标
    var lons = [];
    var lats = [];
    for (i = 0; i < points_sequence.length; i++) {
        lons.push(points_sequence[i][0]);
        lats.push(points_sequence[i][1]);
    }


    //东南西北极值
    var west = Math.min.apply(null,lons);
    var east = Math.max.apply(null,lons);
    var north = Math.max.apply(null,lats);
    var south = Math.min.apply(null,lats);


    //外围矩形点
    var outer_top_left = Cesium.Cartesian3.fromDegrees(west,north);
    var outer_bot_left = Cesium.Cartesian3.fromDegrees(west,south);
    var outer_top_right = Cesium.Cartesian3.fromDegrees(east,north);
    var outer_bot_right = Cesium.Cartesian3.fromDegrees(east,south);



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
    var max_vertical_dist = vertical_distance(outer_top_left, outer_bot_left);


    // number of rows
    var actual_vertical_dist = max_vertical_dist - 2*rooftop_offset;
    var row_check = actual_vertical_dist-panel_width;
    var rows = 0;
    if(row_check >= 0){
        rows = parseInt(row_check/(panel_width+width_offset),10)+1;
    }

    // 南北坐标差
    var north_south_diff = north - south - 2*rooftop_offset/max_vertical_dist*(north - south);

    //北端起点
    var temp_north = north - ((rooftop_offset/max_vertical_dist)*(north-south));



    var points = scene.primitives.add(new Cesium.PointPrimitiveCollection());


    for(var i = 0; i < rows; i++){

        //北-计算所有外框与北线的交点坐标 cor_list
        var temp_line_north = math_make_a_line(west, temp_north, east, temp_north);

        //北-北线交点坐标
        var cor_north_list = [];

        for(var l = 0; l < rooftop_lines.length; l ++){
            var cor_north_line = lines_intersection_coordinates(temp_line_north, rooftop_lines[l]);
            if(cor_north_line !== undefined){
                cor_north_list.push(cor_north_line);
            }
        }


        //北-过滤在外切矩形空间内的交点坐标 cor_in_range
        //var cor_in_range_north = [];
        //for(var x = 0; x < cor_north_list.length; x++){
        //    if(cor_north_list[x][0] >= west && cor_north_list[x][0] <= east){
        //        cor_in_range_north.push(cor_north_list[x]);
        //    }
        //}

        //北-查找西交点 cor_north_left
        var cor_north_left = cor_north_list[0];
        for(var x = 0; x < cor_north_list.length; x++){
            if(cor_north_list[x][0]< cor_north_left[0]){
                cor_north_left = cor_north_list[x];
            }
        }

        //北-查找东交点 cor_north_right
        var cor_north_right = cor_north_list[0];
        for(x = 0; x < cor_north_list.length; x++){
            if(cor_north_list[x][0]> cor_north_left[0]){
                cor_north_right = cor_north_list[x];
            }
        }


        //南-计算所有外框与南线的交点坐标 cor_list
        var temp_south = temp_north - (north_south_diff*panel_width/actual_vertical_dist);

        var temp_line_south = math_make_a_line(west, temp_south, west-10, temp_south);

        //南-南线交点坐标
        var cor_south_list = [];

        for(l = 0; l < rooftop_lines.length; l ++){
            var cor_south_line = lines_intersection_coordinates(temp_line_south, rooftop_lines[l]);
            if(cor_south_line !== undefined){
                cor_south_list.push(cor_south_line);
            }
        }

        //南-过滤在外切矩形空间内的交点坐标 cor_in_range
        //var cor_in_range_south = [];
        //for(x = 0; x < cor_south_list.length; x++){
        //    if(cor_south_list[x][0] >= west && cor_south_list[x][0] <= east){
        //        cor_in_range_south.push(cor_south_list[x]);
        //    }
        //}

        //南-查找西交点 cor_north_left
        var cor_south_left = cor_south_list[0];
        for(x = 0; x < cor_south_list.length; x++){
            if(cor_south_list[x][0]< cor_south_left[0]){
                cor_south_left = cor_south_list[x];
            }
        }

        //南-查找东交点 cor_north_right
        var cor_south_right = cor_south_list[0];
        for(x = 0; x < cor_south_list.length; x++){
            if(cor_south_list[x][0]> cor_south_left[0]){
                cor_south_right = cor_south_list[x];
            }
        }


        //西-南北比较西侧最靠里的点
        var left_ref_point;
        var row_left;
        if(cor_north_left[0] > cor_south_left[0]){
            left_ref_point = Cesium.Cartesian3.fromDegrees(cor_north_left[0],cor_north_left[1]);
            row_left = cor_north_left[0];
        }else{
            left_ref_point = Cesium.Cartesian3.fromDegrees(cor_south_left[0],cor_south_left[1]);
            row_left = cor_south_left[0];
        }

        //东-南北比较东侧最靠里的点
        var right_ref_point;
        var row_right;
        if(cor_north_right[0] < cor_south_right[0]){
            right_ref_point = Cesium.Cartesian3.fromDegrees(cor_north_right[0],cor_north_right[1]);
            row_right = cor_north_right[0];
        }else{
            right_ref_point = Cesium.Cartesian3.fromDegrees(cor_south_right[0],cor_south_right[1]);
            row_right = cor_south_right[0];
        }

        //每一行最大东西距离
        var max_horizental_dist = horizental_distance(left_ref_point, right_ref_point);
        //每一行实际东西距离（扣除offset）
        var actual_horizental_dist = max_horizental_dist - 2*rooftop_offset;

        //检查该列空间是否够放板，够放几列板
        var col_check = actual_horizental_dist-panel_length;
        var cols = 0;
        if(col_check >= 0){
            cols = parseInt(col_check/(panel_length+length_offset),10)+1;
        }

        //每一行东西距离差
        var west_east_diff = row_right - row_left - 2*rooftop_offset/max_horizental_dist*(row_right - row_left);

        //临时最西面坐标
        var temp_west = row_left + ((rooftop_offset/max_horizental_dist)*(row_right-row_left));

        for(var j = 0; j < cols; j++){
            var temp_east = temp_west + (west_east_diff*panel_length/actual_horizental_dist);

            viewer.entities.add({
            rectangle : {
                coordinates : Cesium.Rectangle.fromDegrees(temp_west, temp_south, temp_east, temp_north),
                height: 10,
                material : new Cesium.GridMaterialProperty({
                    color : Cesium.Color.BLUE,
                    cellAlpha : 0.4,
                    lineCount : new Cesium.Cartesian2(1, 1),
                    lineThickness : new Cesium.Cartesian2(2.0, 2.0)
                })
            }
            });
            temp_west = temp_east + (west_east_diff*length_offset/actual_horizental_dist);
        }

        temp_north = temp_south - (north_south_diff*width_offset/actual_vertical_dist);
    }



}









//测试点
var point1 = Cesium.Cartesian3.fromDegrees(-117.845502,33.645999);
var point2 = Cesium.Cartesian3.fromDegrees(-117.845627,33.645898);
var point3 = Cesium.Cartesian3.fromDegrees(-117.845503,33.645769);
var point4 = Cesium.Cartesian3.fromDegrees(-117.845365,33.645896);
var test_lon_lat = [[-117.845502,33.645999],[-117.845627,33.645898],[-117.845503,33.645769],[-117.845365,33.645896]];

//draw_solar_panels(test_lon_lat, solar_panel_width, solar_panel_length, width_offset, length_offset, top_down_offset);




viewer.zoomTo(viewer.entities);
