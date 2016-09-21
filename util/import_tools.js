var Promise = require('bluebird')
  , fs = Promise.promisifyAll(require("fs"))
  , colors = require('colors')
  , binary = require('binary')
  , _ = require('underscore')
  , http = require('bluebird').promisifyAll(require('http'), {multiArgs: true})
  , hat = require('hat')
  , AWS = require('aws-sdk')
  , ac = require('../config/aws')

var importProjectPreview = function(project, preview_url) {
  console.info("RUN LAMDA HERE");

  return new Promise(function(resolve, reject) {

    if (!project || !preview_url) reject("please provide project and preview url");
    var lambda = new AWS.Lambda({
      region: ac.region
    });
    console.info(JSON.stringify({project: project, preview_url: preview_url}));
    lambda.invoke({
      FunctionName: 'project-dev-importpreview',
      Payload: JSON.stringify({project: project, preview_url: preview_url})
    }, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        reject(err);
      }
      else {
        console.info("Done with preview import lambda");
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

module.exports = {
  importProjectPreview: importProjectPreview
}
