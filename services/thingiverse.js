var db = require('../config/database')
  , exec = require('child_process').exec
  , AWS = require('aws-sdk')
  , hat = require('hat')
  , fs = require('fs')
  , ac = require('../config/aws')
  , apiKeys = require('../config/api_keys')
  , checkAuth = require('../util/check_authorization')
  , temp = '/tmp/'
  , _ = require('underscore')
  , UserModel = require('../models/user_model')
  , Promise = require('bluebird')
  , FileRepo = require('../util/file_repo')
  , ImageTools = require('../util/image_tools')
  , MessageQueue = require('../util/message_queue')
  , MeshTools = require('../util/mesh_tools')
  , BotFiles = require('../util/bot_files')
  , qs = require('querystring')
  , rp = require('request-promise')

module.exports = function(app) {

  app.get('/callback/thingiverse', function(req,res) {

    if (!req.query.t || !req.query.code)
      return res.sendStatus(400);

    checkAuth.verifyJwt(req.query.t).then(function(udata) {
      return UserModel.getUser(udata.id);
    }).then(function(user) {
      // get oauth token

      var code = req.query.code;
      var options = {
        url: 'https://www.thingiverse.com/login/oauth/access_token',
        method: 'POST',
        form: {
          client_id:apiKeys.thingiverse.client_id,
          client_secret:apiKeys.thingiverse.client_secret,
          code: req.query.code
        }
      }

      rp(options).then(function(b) {
        console.info("Thingiverse > ", b)
        var q = qs.parse(b);

        console.info("parsed: ".red, q);

        user.thingiverse_token = q.access_token;
        return user;
      })
      .then(function(user) {

        // try to fetch user profile from thingiverse
        var options = {
          url: 'https://api.thingiverse.com/users/me',
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + user.thingiverse_token
          }
        }

        rp(options).then(function(b) {
          var parsed = JSON.parse(b);
          user.thingiverse = parsed;
          UserModel.update(user)
          .then(function(u) {
            res.redirect('/#thingiverse');
          })
        })
      })
      .catch(function(err) {
        res.send("Unable to authorize thingiverse api, <a href='/#thingiverse'>click here to try again </a>");
      });

      /*
      user.thingiverse_token = req.query.code;
      */
    })

    /*
    .then(function(user) {
      return UserModel.update(user)
    })
    .then(function(u) {
      res.json(u);
    })
    */
    .catch(function(err) {
      // error
      console.info("IN ERROR".red);
      var stack = new Error().stack
      console.log( stack )
      console.info(err);
      return res.sendStatus(400);
    });

  });



}
