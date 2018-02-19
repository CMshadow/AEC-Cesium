//Seed随机数
Cesium.Math.setRandomNumberSeed(0);


//太阳能板参数
var solar_panel_width = 1.94;
var solar_panel_length = 1;
var width_offset = 0.3;
var length_offset = 0.1;
var top_down_offset = 0;

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
        material : new Cesium.ColorMaterialProperty({
            color : Cesium.Color.GHOSTWHITE,
            alpha : 0.7
        })
      }
    });
    vecList = [];
  }


  rotateaxis(building_points,30);
  //var node_sequence = leave_setback(building_points, 1);

  //var test_sequence = [];
  //  for(var m = 0; m < node_sequence.length; m++){
  //      test_sequence.push(node_sequence[m][0]);
  //      test_sequence.push(node_sequence[m][1]);
  //      test_sequence.push(10);
  //  }

  //console.log(test_sequence)

  //entities.add({
  //    name : 'Building',
  //    description : "<button onclick=\"myFunction()\">Click me</button>",
  //    polygon : {
  //      hierarchy : new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArrayHeights(test_sequence)),
  //      perPositionHeight : true,
  //      extrudedHeight : 0.0,
  //      outline : true,
  //      outlineColor : Cesium.Color.BLUE,
  //      outlineWidth : 8,
  //      material : Cesium.Color.fromRandom({alpha: 0.8})
  //    }
  //  });

  //console.log(node_sequence);
  //console.log(building_points);
  //draw_solar_panels(node_sequence, solar_panel_width, solar_panel_length, width_offset, length_offset, top_down_offset);
  building_points = [];

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

//calculate the intersection coordinate of two lines for setback function
function lines_intersection_coordinates_setback(baseline,line2){
    var x = (line2[1]-baseline[1])/(baseline[0]-line2[0]);
    var y = baseline[0]*x+baseline[1];
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



//根据setback将坐标缩小
function leave_setback(points_sequence, setback){

    //将点转换为数学线段公式
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

    //获得东西南北经纬度
    var wnes = generate_bounding_wnes(points_sequence);
    var west = wnes[0];
    var east = wnes[1];
    var north = wnes[2];
    var south = wnes[3];

    var cut_line_a;
    var vector_x;
    var vector_y;

    var point_A;
    var point_B;

    var horizental_cor_A_B;
    var vertical_cor_A_B;

    var horizental_distance_A_B;
    var vertical_distance_A_B;
    var distance_A_B;

    var ratio;
    var ratio_horizental_cor_A_B;
    var ratio_vertical_cor_A_B;

    var cut_line_A_lat;
    var cut_line_B_lat;
    var cut_line_A_lon;
    var cut_line_B_lon;

    var parallel_line;

    var start_index;
    var sequence = Array.apply(null, new Array(rooftop_lines.length)).map(Number.prototype.valueOf,0);
    var line_check = Array.apply(null, new Array(rooftop_lines.length)).map(Number.prototype.valueOf,0);


    for(p = 0; p < rooftop_lines.length; p++){
        //从毗邻北点的线开始

        //切线斜率
        cut_line_a = (-1/rooftop_lines[p][0]);

        //x、y轴向量
        vector_x = rooftop_lines[p][3][0] - rooftop_lines[p][2][0];
        vector_y = rooftop_lines[p][3][1] - rooftop_lines[p][2][1];

        //Cesium格式点A、B
        point_A = Cesium.Cartesian3.fromDegrees(rooftop_lines[p][2][0],rooftop_lines[p][2][1]);
        point_B = Cesium.Cartesian3.fromDegrees(rooftop_lines[p][3][0],rooftop_lines[p][3][1]);

        //水平垂直经度 纬度差绝对值
        horizental_cor_A_B = Math.abs(rooftop_lines[p][3][0] - rooftop_lines[p][2][0]);
        vertical_cor_A_B = Math.abs(rooftop_lines[p][3][1] - rooftop_lines[p][2][1]);

        //计算两点间直线距离，单位米
        horizental_distance_A_B = horizental_distance(point_A, point_B);
        vertical_distance_A_B = vertical_distance(point_A, point_B);
        distance_A_B = Math.sqrt(Math.pow(horizental_distance_A_B, 2) + Math.pow(vertical_distance_A_B,2));

        //屋檐长度和直线距离比
        ratio = setback/distance_A_B;

        //水平垂直经度 纬度差取比值
        ratio_horizental_cor_A_B = ratio * horizental_cor_A_B;
        ratio_vertical_cor_A_B = ratio * vertical_cor_A_B;
        console.log(Math.sqrt(Math.pow(ratio_horizental_cor_A_B, 2) + Math.pow(ratio_vertical_cor_A_B,2)))

        //根据x轴向量决定纬度平移方向
        if(vector_x < 0){
            cut_line_A_lat = rooftop_lines[p][2][1] - ratio_vertical_cor_A_B;
            cut_line_B_lat = rooftop_lines[p][3][1] - ratio_vertical_cor_A_B;
        }else{
            cut_line_A_lat = rooftop_lines[p][2][1] + ratio_vertical_cor_A_B;
            cut_line_B_lat = rooftop_lines[p][3][1] + ratio_vertical_cor_A_B;
        }

        //根据y轴向量决定经度平移方向
        if(vector_y < 0){
            cut_line_A_lon = rooftop_lines[p][2][0] + ratio_horizental_cor_A_B;
            cut_line_B_lon = rooftop_lines[p][3][0] + ratio_horizental_cor_A_B;
        }else{
            cut_line_A_lon = rooftop_lines[p][2][0] - ratio_horizental_cor_A_B;
            cut_line_B_lon = rooftop_lines[p][3][0] - ratio_horizental_cor_A_B;
        }

        parallel_line = math_make_a_line(cut_line_A_lon, cut_line_A_lat, cut_line_B_lon, cut_line_B_lat);

        sequence[p] = parallel_line;
        line_check[p] = 1;
        start_index = p;

    }

    //console.log(line_check);
    //console.log(sequence);




    var node_sequence = [];
    var inter;

    for(p = 0; p < sequence.length; p++){
        if(p !== (sequence.length - 1)){
            inter = lines_intersection_coordinates_setback(sequence[p],sequence[p+1]);
            node_sequence.push(inter);
        }
        else{
            inter = lines_intersection_coordinates_setback(sequence[p],sequence[0]);
            node_sequence.push(inter);
        }
    }

    return node_sequence;
}




//在给定点范围内生成太阳能板
function draw_solar_panels(points_sequence, panel_width, panel_length, width_offset, length_offset, rooftop_offset){


    var boundings = generate_bounding_wnes(points_sequence);
    var west = boundings[0];
    var east = boundings[1];
    var north = boundings[2];
    var south = boundings[3];


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
    var actual_vertical_dist = max_vertical_dist;
    var row_check = actual_vertical_dist-panel_width;
    var rows = 0;
    if(row_check >= 0){
        rows = parseInt(row_check/(panel_width+width_offset),10)+1;
    }

    // 南北坐标差
    var north_south_diff = north - south;

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
            if(cor_north_line !== undefined){
                cor_north_list.push(cor_north_line);
            }
        }


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
            temp_south = temp_north - (north_south_diff*panel_width/actual_vertical_dist);

            var temp_line_south = math_make_a_line(west, temp_south, east, temp_south);

            //南-南线交点坐标
            var cor_south_list = [];

            for(l = 0; l < rooftop_lines.length; l ++){
                var cor_south_line = lines_intersection_coordinates(temp_line_south, rooftop_lines[l]);
                if(cor_south_line !== undefined){
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
                    var actual_horizental_dist = max_horizental_dist;

                    //检查该列空间是否够放板，够放几列板
                    var col_check = actual_horizental_dist-panel_length;
                    var cols = 0;
                    if(col_check >= 0){
                        cols = parseInt(col_check/(panel_length+length_offset),10)+1;
                    }

                    //每一行东西距离差
                    var west_east_diff = row_right - row_left;

                    //临时最西面坐标
                    var temp_west = row_left;

                    for(var j = 0; j < cols; j++){
                        var temp_east = temp_west + (west_east_diff*panel_length/actual_horizental_dist);

                        viewer.entities.add({
                          polygon : {
                            hierarchy : new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArrayHeights([temp_west,temp_south,10,temp_east,temp_south,10,temp_east,temp_north,10.5,temp_west,temp_north,10.5])),
                            perPositionHeight : true,
                            outline : true,
                            material : Cesium.Color.ROYALBLUE,
                          }
                        });

                        temp_west = temp_east + (west_east_diff*length_offset/actual_horizental_dist);
                    }
                }
            }
        }

        temp_north = temp_south - (north_south_diff*width_offset/actual_vertical_dist);
    }



}



//在旋转坐标系中的点位置
function rotateaxis(points_sequence,angle){
    var cos = Math.cos(angle * Math.PI / 180.0);
    var sin = Math.sin(angle * Math.PI / 180.0);
    var new_points_sequence = [];
    var temp = [];
    for(var i = 0; i < points_sequence.length; i ++){
        var x = points_sequence[i][0];
        var y = points_sequence[i][1];
        temp.push(x*cos+y*sin);
        temp.push(-x*sin+y*cos);
        new_points_sequence.push(temp);
        temp = [];
    }
    return new_points_sequence;
}


viewer.zoomTo(viewer.entities);
