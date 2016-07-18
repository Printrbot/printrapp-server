
var db = require('../config/database')
  , exec = require('child_process').exec
  , AWS = require('aws-sdk')
  , hat = require('hat')
  , ac = require('../config/aws')
  , temp = '/tmp/'
  , http = require('http')
  , _ = require('underscore')
  , Promise = require('bluebird')
  , fs = Promise.promisifyAll(require("fs"));

AWS.config.update({region: 'us-west-1'});
AWS.config.setPromisesDependency(Promise);

var s3 = new AWS.S3({params: {Bucket: ac.bucket}});
Promise.promisifyAll(Object.getPrototypeOf(s3));

module.exports.deleteFiles = function(files)
{
  return new Promise(function(resolve, reject) {
    var s3 = new AWS.S3();
    var params = {
      "Bucket": ac.bucket,
      "Delete": {
        "Objects": files,
      }
    };
    s3.deleteObjects(params, function(err, data) {
      if (err) reject(err);
      resolve(data);
    });
  });
}

module.exports.uploadToS3 = function(file_path, content_type, s3uploadpath)
{
  return new Promise(function(resolve, reject) {
    fs.readFileAsync(file_path)
    .then(function(data) {
    // upload to s3
      var params = {
        Key: s3uploadpath,
        Body: data,
        ACL: 'public-read',
        ContentType: content_type
      }
      console.info("UPLOADING");
      return s3.uploadAsync(params);
    })
    .then(function(floc) {
      // remove local file
      return fs.unlinkAsync(file_path)
      .then(function () {
        console.info("DONE DELETING");
        return resolve(floc);
      })
    }).catch(function(err) {
      console.info("ERROR:", err);
    })
  });
}

module.exports.downloadFile = function(url, file_path)
{
  return new Promise(function(resolve, reject) {
    var f = fs.createWriteStream(file_path);
    console.info("URL", url);
    console.info("PATH", file_path)
    http.get(url.replace("https://", "http://"), function(res) {
      res.pipe(f);
      f.on('finish', function() {
        console.info('FINISHED DOWNLOADING FILE');
        f.close(resolve(file_path));
      });
    }).on('error', function(err) {
      fs.unlink(file_path, function (err) {
        if (err) {
          console.error(err);
        }
        console.log('Temp stl Deleted');
      });
      reject(err);
    });
  })
}
