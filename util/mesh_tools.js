var Jimp = require('jimp')
  , exec = require('child_process').exec
  , Promise = require('bluebird')
  , AWS = require('aws-sdk')
  , ac = require('../config/aws')

module.exports.fixStl = function(file_path)
{
  return new Promise(function(resolve, reject) {
    var cmd = 'admesh ./'+file_path+' -b ./'+file_path;
    console.info(cmd);
    exec(cmd, function callback(err, stdout, stderr) {

      if (err) {
        console.info("ERROR IN ADMESH", err)
        reject(err);
        // allow it still to upload
      }
      else if (stderr) {
        reject(err);
        console.info("stdERROR IN ADMESH", stderr)
      }

      // parse out object size
      var out = stdout.split('============== Size ==============')[1];
      out = out.split("===")[0];
      var m = out.match(/\S+/g);

      var minx = parseFloat(m[3])
        , maxx = parseFloat(m[7])
        , miny = parseFloat(m[11])
        , maxy = parseFloat(m[15])
        , minz = parseFloat(m[19])
        , maxz = parseFloat(m[23])
        , lx = maxx - minx
        , ly = maxy - miny
        , lz = maxz - minz

      resolve([file_path, lx, ly, lz]);
    });
  })
}

module.exports.applyTransformations = function(ldata) {
  return new Promise(function(resolve, reject) {
    var lambda = new AWS.Lambda({
        region: ac.region
    });
    console.info("LDATA:", ldata);
    lambda.invoke({
      FunctionName: 'transformer-dev-transform',
      Payload: JSON.stringify(ldata)
    }, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        reject(err);
      }
      else {
        console.info("Done with transformation lambda");
        console.info(data);
        var output = JSON.parse(data.Payload);
        if (output && output.hasOwnProperty("errorMessage")) {
          console.log("ERROR:");
          console.log(output.errorMessage);
          reject(output.errorMessage);
        }
        resolve(output);
      }
    });
  });
}
