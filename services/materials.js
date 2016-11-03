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
      MaterialModel.getMaterialsByUser(udata.id)
      .then(function(mat) {
        console.info(mat);
        if (mat.rows.length > 0) {
          res.json(mat.rows[0].value);
        } else {
          MaterialModel.createUserLibrary(udata.id)
          .then(function(mat) {
            // trigger material lib creator lambda
            BotFiles.buildMaterialLib(mat);
            // return data
            res.json(mat);
          });
        }
      })
      .catch(function(err) {
        console.info(err);
        return res.sendStatus(400);
      });
    })
    .catch(function(err) {
      // error
      console.info(err);
      return res.sendStatus(400);
    });
  });

  app.get('/api/materials/lib', function(req,res) {

    if (!req.query.t || !req.query.code)
      return res.sendStatus(400);

    checkAuth.verifyJwt(req.query.t).then(function(udata) {
      return UserModel.getUser(udata.id);
    }).then(function(udata) {

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
