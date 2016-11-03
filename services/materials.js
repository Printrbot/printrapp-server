var db = require('../config/database')
  , exec = require('child_process').exec
  , AWS = require('aws-sdk')
  , hat = require('hat')
  , fs = require('fs')
  , ac = require('../config/aws')
  , checkAuth = require('../util/check_authorization')
  , temp = '/tmp/'
  , http = require('http')
  , _ = require('underscore')
  , Promise = require('bluebird')
  , FileRepo = require('../util/file_repo')
  , ImageTools = require('../util/image_tools')
  , BotFiles = require('../util/bot_files')
  , MaterialModel = require('../models/material_model')


module.exports = function(app) {

  app.get('/api/materials', function(req,res) {
    checkAuth.verifyHeader(req.headers).then(function(udata) {
      return MaterialModel.getDefault();
    }).then(function(project) {
      return res.json(project);
    }).catch(function(err) {
      // error
      console.info(err);
      return res.sendStatus(400);
    });
  });

}
