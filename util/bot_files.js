var Jimp = require('jimp')
  , Promise = require('bluebird')
  , fs = Promise.promisifyAll(require("fs"))
  , FileRepo = require('./file_repo')
  , colors = require('colors')
  , binary = require('binary')
  , _ = require('underscore')
  , http = require('bluebird').promisifyAll(require('http'), {multiArgs: true})
  , hat = require('hat')
  , AWS = require('aws-sdk')
  , ac = require('../config/aws')

module.exports.reindex = function(projectWithItems)
{
  return new Promise(function(resolve, reject) {

    if (!projectWithItems) reject("please provide project with items object");
    var lambda = new AWS.Lambda({
        region: ac.region
    });

    lambda.invoke({
      FunctionName: 'project-dev-buildindex',
      Payload: JSON.stringify(projectWithItems)
    }, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        reject(err);
      }
      else {
        console.info("Done with reindex lambda");
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

module.exports.slice = function(res, item) {
  return new Promise(function(resolve, reject) {
    var lambda = new AWS.Lambda({
      region: ac.region
    });

    lambda.invoke({
      FunctionName: 'slice-dev-testcura',
      Payload: JSON.stringify(item)
    }, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        reject(err);
      }
      else {
        console.info("Done with slicer lambda");
        var output = JSON.parse(data.Payload);
        if (output && output.hasOwnProperty("errorMessage")) {
          console.log("ERROR:");
          console.log(output.errorMessage);
          reject(output.errorMessage);
        }

        resolve(output);
      }
    });
  })

}
