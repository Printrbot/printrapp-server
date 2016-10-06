var Jimp = require('jimp')
  , exec = require('child_process').exec
  , Promise = require('bluebird')
  , AWS = require('aws-sdk')
  , ac = require('../config/aws')

module.exports.fixStl = function(file_path)
{
  return new Promise(function(resolve, reject) {
    var cmd = 'admesh --write-binary-stl=./'+file_path+' ./'+file_path;
    exec(cmd, function callback(err, stdout, stderr) {
      console.info(stdout);
      console.info(stderr);
      if (err) {
        console.info("ERROR IN ADMESH", err)
        // allow it still to upload
      }
      else if (stderr) {
        console.info("stdERROR IN ADMESH", stderr)
      }
      resolve(file_path);
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
