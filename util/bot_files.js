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

module.exports.buildMaterialLib = function(materials)
{
  return new Promise(function(resolve, reject) {

    if (!materials) reject("please provide material object");
    var lambda = new AWS.Lambda({
        region: ac.region
    });

    lambda.invoke({
      FunctionName: 'materials-dev-buildindex',
      Payload: JSON.stringify(materials)
    }, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        reject(err);
      }
      else {
        console.info("Done with material lambda");
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

module.exports.slice = function(item) {
  return new Promise(function(resolve, reject) {
    var lambda = new AWS.Lambda({
      region: ac.region
    });

    console.info("RESLICING:".red);

    lambda.invoke({
      FunctionName: 'slice-prod-slice',
      Payload: JSON.stringify(item)
    }, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        reject(err);
      }
      else {
        console.info("SLICING COMPLETED".green);
        var output = JSON.parse(data.Payload);
        if (output && output.hasOwnProperty("errorMessage")) {
          console.log("ERROR:");
          console.log(output.errorMessage);
          reject(output.errorMessage);
        }
        console.info(output);
        resolve(output);
      }
    });
  })
}

module.exports.importThing = function(url, s3Path) {
  return new Promise(function(resolve, reject) {
    var lambda = new AWS.Lambda({
      region: ac.region
    });
    console.info("IMPORTING:".red);
    lambda.invoke({
      FunctionName: 'importer-dev-importThingiverse',
      Payload: JSON.stringify({url: url, key: s3Path})
    }, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        reject(err);
      }
      else {
        console.info("IMPORT COMPLETED".green);
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
