var restify = require('restify');
var sprintf = require("sprintf-js").sprintf;

var server = restify.createServer({
  name: 'recogniser',
  version: '1.0.0'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get('/', function (req, res, next) {
  res.send('Recognise');
  return next();
});

var convnetjs = require('convnetjs');
var PNG = require('pngjs').PNG;
var fs = require('fs');
var str = fs.readFileSync(__dirname + "/neuralnet/nnew.json");
var json = JSON.parse(str);
var net = new convnetjs.Net();
net.fromJSON(json);
trainer = new convnetjs.SGDTrainer(net, {method:'adadelta', batch_size:20, l2_decay:0.001});

server.post('/upload', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    var fs = require('fs');
    var newPath = __dirname + "/uploads/x.png";
    console.log(req);
    var match = req.body.toString().replace(/^data:([A-Za-z-+\/]+);base64/, '');
    var imData = new Buffer(match, "base64");
    fs.writeFile(newPath, imData, function (err) {
        if (err)
        {
            var err = new restify.errors.InternalServerError('image file could not be saved');
            res.send(err);
            return next();
        }
        else
        {
            var exec = require('child_process').exec;
            var modPath = __dirname + "/uploads/y.png";
            exec("convert -scale 32x32 " + newPath + " " +  modPath, function(err, stdo, stder) {
                var data = img2Vol(modPath, true);
                net.forward(data);
                var yhat = net.getPrediction();
                console.log('I think this is: "'+yhat+'"');
                res.send(200, yhat);
                return next();
            });
        }
    });
});

server.post('/train/:label', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    var fs = require('fs');
    var newPath = __dirname + "/uploads/x.png";
    var match = req.body.replace(/^data:([A-Za-z-+\/]+);base64/, '');
    var imData = new Buffer(match, "base64");
    fs.writeFile(newPath, imData, function (err) {
        if (err)
        {
            var err = new restify.errors.InternalServerError('image file could not be saved');
            res.send(err);
            return next();
        }
        else
        {
            var exec = require('child_process').exec;
            var modPath = __dirname + "/uploads/y.png";
            exec("convert -scale 28x28 " + newPath + " " +  modPath, function(err, stdo, stder) {
                var data = img2Vol(modPath, true);
                console.log("training to be:", req.params.label);
                var stats = trainer.train(data, req.params.label);
                net.forward(data);
                var yhat = net.getPrediction();
                console.log('I now think this is: "'+yhat+'"');
                res.send(200, yhat);
                return next();
            });
        }
    });
});


server.listen(8080, 'localhost', function () {
  console.log('%s listening at %s', server.name, server.url);
});

function img2Vol(file, showImage) {
    var data = fs.readFileSync(file);
    var png = PNG.sync.read(data);

    var width = png.width;
    var height = png.height;
    var pvU = [];
    var pv = [];

    for (var y = 0; y < height; y++)
    {
        for (var x = 0; x < width; x++)
        {
            var idx = ((width * y) + x) << 2;
            var intensity = png.data[idx] + png.data[idx+1] + png.data[idx+2];
            if (intensity > 0)
                intensity = 0.5;
            else
                intensity = -0.5;
            pvU.push(intensity);
            pv.push(intensity);
        }
    }

    if (showImage)
    {
        var line = "  ";
        for (var y = 0; y < width; y++)
        {
            line += sprintf("%3i", y);
        }
        console.log(line);
        var i = 0;
        for (var x = 0; x < width; x++)
        {
            line = sprintf("%3i", x);
            for (var y = 0; y < height; y++)
            {
                var b = pvU[i++];
                if (b > 0)
                    line += 'XXX';
                    //process.stdout.write('XXX');
                    //process.stdout.write(sprintf("%3i", b.toString()));
                else
                    line += '---';
                    //process.stdout.write('---');
            }
            console.log(line);
        }
        console.log();
    }

    var imageChannels = 1;
    var x = new convnetjs.Vol(width, height, imageChannels, 0.0); //input volume (image)
    x.w = pv;
    return x;
}
