var Jimp = require('jimp')
  , exec = require('child_process').exec
  , Promise = require('bluebird')


module.exports.fixStl = function(file_path)
{
  return new Promise(function(resolve, reject) {
    var cmd = 'admesh --write-binary-stl='+file_path+' '+file_path;
    exec(cmd, function callback(err, stdout, stderr) {
      if (err) {
        console.info("ERROR IN ADMESH", err)
        reject(err);
      }
      else if (stderr) {
        console.info("stdERROR IN ADMESH", stderr)
        reject(stderr);
      }
      else resolve(file_path);
    });
  })
}
