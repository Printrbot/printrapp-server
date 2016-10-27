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
  , ProjectModel = require('../models/project_model')
  , BotFiles = require('../util/bot_files')

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

  app.post('/api/project/importthing', function(req, res)
  {
    var importData = (req.body);

    if (!importData.project || !importData.items)
      return res.sendStatus(400);

    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      // verify required params
      if (!importData.project.name)
        return res.sendStatus(400);

      // insert project
      var data = {
        "user": udata.id,
        "name": importData.project.name,
        "description": importData.project.description,
        "idx": hat(32, 16),
        "repo_src": importData.project.url,
        "repo_name": "thingiverse",
        "license": importData.project.license
      };
      return data;
    })
    .then(function(project) {
      ProjectModel.create(project)
      .then(function(pinfo) {
        _.each(importData.items, function(item) {
          // create instance of item in db
          var pi = {
            "id": hat(),
            "idx": hat(32, 16),
            "name": item.name.toLowerCase(),
            "type": "project_item",
            "user": project.user,
            "project": pinfo.id,
            "region": "us-west-2",
            "resolution": "standard",
            "support": false,
            "brim": false,
            "infill": "standard",
            "advanced": [],
            "created_at": new Date().getTime()
          }
          var s3uploadpath = 'u/'+project.user+'/i/'+pi.id+'/'+pi.id+'.stl';
          return BotFiles.importThing(item.public_url, s3uploadpath)
          .then(function(lambdaData) {
            console.info("UPDATING PROJECT WITH SRC ", lambdaData);
            // update item with stl location
            pi.file_path = lambdaData.s3.Key;
            pi.size = lambdaData.size;
            return pi
          })
          .then(function(_pi) {
            console.info("SAVING PROJECT ITEM TO DB")
            // save this item in database
            return ProjectModel.createItem(pi);
          })
          .then(function(project_item_res) {
            // send message to render queue
            console.info("SENDING RENDER MSG", pi)
            return MessageQueue.sendRenderMessage(pi)
            .then(function(q) {
              return [project, pi];
            })
          })
          .spread(function(project, item) {
            // slice it
            BotFiles.slice(item);

            // and reindex
            console.info("REINDEXING")
            console.info("PROJECT: ", project);
            ProjectModel.getProjectItems(pinfo.id)
            .then(function(items) {
              project.items = items;
              return project;
            })
            .then(function(projectWithItems) {
              console.info("PROJECT WITH ITEMS: ", projectWithItems)
              return BotFiles.reindex(projectWithItems);
            })
            .then(function(output) {
              console.info(output);
              console.info("DONE WITH REINDEX");
            })
            return project
          })
          .catch(function(err) {
            console.info(err);
          })
        }, this);

        project.ok = true;
        project.id = pinfo.id;
        res.json(project);
      })

    })
    .catch(function(err) {
      // error
      console.info(err);
      res.sendStatus(400);
    });
  });



}
