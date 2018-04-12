/*eslint-env node*/
'use strict';
(function() {
    var express = require('express');
    var compression = require('compression');
    var fs = require('fs');
    var url = require('url');
    var request = require('request');
	var bodyParser = require('body-parser');

    var gzipHeader = Buffer.from('1F8B08', 'hex');

    var yargs = require('yargs').options({
        'port' : {
            'default' : 8080,
            'description' : 'Port to listen on.'
        },
        'public' : {
            'type' : 'boolean',
            'description' : 'Run a public server that listens on all interfaces.'
        },
        'upstream-proxy' : {
            'description' : 'A standard proxy server that will be used to retrieve data.  Specify a URL including port, e.g. "http://proxy:8000".'
        },
        'bypass-upstream-proxy-hosts' : {
            'description' : 'A comma separated list of hosts that will bypass the specified upstream_proxy, e.g. "lanhost1,lanhost2"'
        },
        'help' : {
            'alias' : 'h',
            'type' : 'boolean',
            'description' : 'Show this help.'
        }
    });
    var argv = yargs.argv;

    if (argv.help) {
        return yargs.showHelp();
    }

    // eventually this mime type configuration will need to change
    // https://github.com/visionmedia/send/commit/d2cb54658ce65948b0ed6e5fb5de69d022bef941
    // *NOTE* Any changes you make here must be mirrored in web.config.
    var mime = express.static.mime;
    mime.define({
        'application/json' : ['czml', 'json', 'geojson', 'topojson'],
        'image/crn' : ['crn'],
        'image/ktx' : ['ktx'],
        'model/gltf+json' : ['gltf'],
        'model/gltf-binary' : ['bgltf', 'glb'],
        'application/octet-stream' : ['b3dm', 'pnts', 'i3dm', 'cmpt', 'geom', 'vctr'],
        'text/plain' : ['glsl']
    }, true);

    var app = express();
    app.use(compression());
    app.use(function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });
	//urlencoded
	app.use(bodyParser.json({limit: '1mb'}));
	app.use(bodyParser.urlencoded({    
		extended: true
	}));

    function checkGzipAndNext(req, res, next) {
		console.log("first");
        var reqUrl = url.parse(req.url, true);
        var filePath = reqUrl.pathname.substring(1);

        var readStream = fs.createReadStream(filePath, { start: 0, end: 2 });
        readStream.on('error', function(err) {
            next();
        });

        readStream.on('data', function(chunk) {
            if (chunk.equals(gzipHeader)) {
                res.header('Content-Encoding', 'gzip');
            }
            next();
        });
    }

    var knownTilesetFormats = [/\.b3dm/, /\.pnts/, /\.i3dm/, /\.cmpt/, /\.glb/, /\.geom/, /\.vctr/, /tileset.*\.json$/];
    app.get(knownTilesetFormats, checkGzipAndNext);

    app.use(express.static(__dirname));

    function getRemoteUrlFromParam(req) {
        var remoteUrl = req.params[0];
        if (remoteUrl) {
            // add http:// to the URL if no protocol is present
            if (!/^https?:\/\//.test(remoteUrl)) {
                remoteUrl = 'http://' + remoteUrl;
            }
            remoteUrl = url.parse(remoteUrl);
            // copy query string
            remoteUrl.search = url.parse(req.url).search;
        }
        return remoteUrl;
    }

    var dontProxyHeaderRegex = /^(?:Host|Proxy-Connection|Connection|Keep-Alive|Transfer-Encoding|TE|Trailer|Proxy-Authorization|Proxy-Authenticate|Upgrade)$/i;

    function filterHeaders(req, headers) {
        var result = {};
        // filter out headers that are listed in the regex above
        Object.keys(headers).forEach(function(name) {
            if (!dontProxyHeaderRegex.test(name)) {
                result[name] = headers[name];
            }
        });
        return result;
    }
    var upstreamProxy = argv['upstream-proxy'];
    var bypassUpstreamProxyHosts = {};
    if (argv['bypass-upstream-proxy-hosts']) {
        argv['bypass-upstream-proxy-hosts'].split(',').forEach(function(host) {
            bypassUpstreamProxyHosts[host.toLowerCase()] = true;
        });
    }
	
	//test post
	app.post('/Apps/Sandcastle/', function (req, res) {
	//BUG!! BUG!! index out of range
		var temp = req.body.slice(1,req.body.length);
		/*
		for(var i = 0;i< req.body.length;i++)
		{
			console.log(req.body[i]);
		}
		*/
		console.log(req.body[0]);
		fs.writeFile('./Apps/Sandcastle/saves/'+String(req.body[0])+".txt", JSON.stringify(temp, null, 4),function(err){
			if(err) console.log('写文件操作失败');
			else console.log('写文件操作成功');
		});
		fs.readFile('./Apps/Sandcastle/saves/test1.txt','utf-8',function(err,data){
			if(err){
				console.error(err);
			}else{
				console.log(data);
				
			}
		})
		res.end();
	});	
	
	app.get('/Apps/Sandcastle/*', function (req, res) {
		res.writeHead(200,{'Content-Type': 'text/html'});
		var segments = "";
		fs.readFile('./Apps/Sandcastle/saves/test1.txt','utf-8',function(err,data){
			if(err){
				console.error(err);
			}else{
				segments = data;
			}
		})
		fs.readFile('./Apps/Sandcastle/saves/ref.html','utf-8',function(err,data){
			if(err){
				console.error(err);
				res.writeHead(404);
			}else{
				//console.log(data.indexOf("var seg_collection = [];"));
				data = data.replace("var seg_collection = [];","var seg_collection = " + String(segments) + ";");
				data = data.replace("var drawLoadedSign;","drawLoadedSeg()");
				res.write(String(data));
			}
			res.end();
		})
		console.log("successful get request!");
		console.log(req.query.file);
	});
	
    app.get('/proxy/*', function(req, res, next) {
		console.log("proxy");
        // look for request like http://localhost:8080/proxy/http://example.com/file?query=1
        var remoteUrl = getRemoteUrlFromParam(req);
        if (!remoteUrl) {
            // look for request like http://localhost:8080/proxy/?http%3A%2F%2Fexample.com%2Ffile%3Fquery%3D1
            remoteUrl = Object.keys(req.query)[0];
            if (remoteUrl) {
                remoteUrl = url.parse(remoteUrl);
            }
        }

        if (!remoteUrl) {
            return res.status(400).send('No url specified.');
        }

        if (!remoteUrl.protocol) {
            remoteUrl.protocol = 'http:';
        }

        var proxy;
        if (upstreamProxy && !(remoteUrl.host in bypassUpstreamProxyHosts)) {
            proxy = upstreamProxy;
        }

        // encoding : null means "body" passed to the callback will be raw bytes

        request.get({
            url : url.format(remoteUrl),
            headers : filterHeaders(req, req.headers),
            encoding : null,
            proxy : proxy
        }, function(error, response, body) {
            var code = 500;

            if (response) {
                code = response.statusCode;
                res.header(filterHeaders(req, response.headers));
            }
			
            res.status(code).send(body);
        });
    });

    var server = app.listen(argv.port, argv.public ? undefined : 'localhost', function() {
        if (argv.public) {
            console.log('Cesium development server running publicly.  Connect to http://localhost:%d/', server.address().port);
        } else {
            console.log('Cesium development server running locally.  Connect to http://localhost:%d/', server.address().port);
        }
    });

    server.on('error', function (e) {
        if (e.code === 'EADDRINUSE') {
            console.log('Error: Port %d is already in use, select a different port.', argv.port);
            console.log('Example: node server.js --port %d', argv.port + 1);
        } else if (e.code === 'EACCES') {
            console.log('Error: This process does not have permission to listen on port %d.', argv.port);
            if (argv.port < 1024) {
                console.log('Try a port number higher than 1024.');
            }
        }
        console.log(e);
        process.exit(1);
    });

    server.on('close', function() {
        console.log('Cesium development server stopped.');
    });

    var isFirstSig = true;
    process.on('SIGINT', function() {
        if (isFirstSig) {
            console.log('Cesium development server shutting down.');
            server.close(function() {
              process.exit(0);
            });
            isFirstSig = false;
        } else {
            console.log('Cesium development server force kill.');
            process.exit(1);
        }
    });

})();
