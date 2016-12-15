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

  app.post('/api/mmfactory/authenticate', function(req,res) {

    var data = (req.body);

    if (!data.username || !data.password)
      throw new Error("Required parameters missing");

    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      return UserModel.getUser(udata.id);
    })
    .then(function(user) {
      var options = {
        url: 'https://www.myminifactory.com/api/v1/logins',
        method: 'POST',
        headers: {
          'Partner-key': apiKeys.mmfactory.partner_key
        },
        form: {
          username: data.username,
          password: data.password
        }
      }

      rp(options).then(function(b) {
        var mmf_res = JSON.parse(b);
        console.info(mmf_res);
        if (mmf_res.Error) {
          throw new Error("Invalid Login");
        }
        mmf_res.username = data.username;
        user.mmfactory = mmf_res;

        return user;
      })
      .then(function(user) {
        UserModel.update(user)
        .then(function(u) {
          res.json(user.mmfactory);
        })
      })
      .catch(function(err) {
        console.info(err);
        res.sendStatus(401);
      })
    })
    .catch(function(err) {
      // error
      console.info(err.red);
      res.sendStatus(400);
    });
  });


  app.get('/api/mmfactory/collections', function(req, res) {

    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      return UserModel.getUser(udata.id);
    })
    .then(function(user) {

      if (!user.mmfactory)
        throw new Error("User did not connect mmfactory to their profile yet");

      var options = {
        url: 'https://www.myminifactory.com/api/v1/u/'+user.mmfactory.username+'/collections',
        method: 'GET',
        headers: {
          'Partner-key': apiKeys.mmfactory.partner_key,
          'Authorization': 'Bearer ' + user.mmfactory.access_token
        }
      }

      rp(options)
      .then(function(b) {
        var mmf_res = JSON.parse(b);
        if (mmf_res.error) {
          throw new Error("Invalid Login");
        }
        res.json(mmf_res);
      })
      .catch(function(err, r) {
        console.info("E JEBIGA");
        // check if we need to authenticate again, if yes, remove the mmf
        // info from user object
        if (err.error) {
          var e = JSON.parse(err.error);
          if (e && e.error && e.error == 'invalid_grant') {
            res.sendStatus(401);
            /*
            delete user.mmfactory;
            UserModel.update(user)
            .then(function(u) {
              res.sendStatus(401);
            })
            .catch(function(e) {
              res.sendStatus(401);
            })
            */
          }
        }
      })
    })
    .catch(function(err) {
      console.info(err.red);
      res.sendStatus(400);
    });

  });

  app.get('/api/mmfactory/thing/:id', function(req, res) {

    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      return UserModel.getUser(udata.id);
    })
    .then(function(user) {

      if (!user.mmfactory)
        throw new Error("User did not connect mmfactory to their profile yet");

      var options = {
        url: 'https://www.myminifactory.com/api/v1/object/'+req.params.id,
        method: 'GET',
        headers: {
          'Partner-key': apiKeys.mmfactory.partner_key,
          'Authorization': 'Bearer ' + user.mmfactory.access_token
        }
      }

      rp(options)
      .then(function(b) {
        var mmf_res = JSON.parse(b);
        if (mmf_res.error) {
          throw new Error(mmf_res.error);
        }

        res.json(mmf_res[0]);
      })
      .catch(function(err, r) {
        // check if we need to authenticate again, if yes, remove the mmf
        // info from user object
        if (err.error) {
          var e = JSON.parse(err.error);
          if (e && e.error && e.error == 'invalid_grant') {
            res.sendStatus(401);
            /*
            delete user.mmfactory;
            UserModel.update(user)
            .then(function(u) {
              res.sendStatus(401);
            })
            .catch(function(e) {
              res.sendStatus(401);
            })
            */
          }
        }
      })
    })
    .catch(function(err) {
      console.info(err);
      res.sendStatus(400);
    });
  });

  app.get('/api/mmfactory/collection/:mmfuser/:mmfcatslug', function(req, res) {

    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      return UserModel.getUser(udata.id);
    })
    .then(function(user) {

      if (!user.mmfactory)
        throw new Error("User did not connect mmfactory to their profile yet");

      var options = {
        url: 'https://www.myminifactory.com/api/v1/collection/'+req.params.mmfuser+'/'+req.params.mmfcatslug,
        method: 'GET',
        headers: {
          'Partner-key': apiKeys.mmfactory.partner_key,
          'Authorization': 'Bearer ' + user.mmfactory.access_token
        }
      }

      rp(options)
      .then(function(b) {
        var mmf_res = JSON.parse(b);
        if (mmf_res.error) {
          throw new Error(mmf_res.error);
        }

        res.json(mmf_res);
      })
      .catch(function(err, r) {

        // check if we need to authenticate again, if yes, remove the mmf
        // info from user object
        if (err.error) {
          var e = JSON.parse(err.error);
          if (e && e.error && e.error == 'invalid_grant') {
            res.sendStatus(401);
          }
        }
      })
    })
    .catch(function(err) {
      console.info(err);
      res.sendStatus(400);
    });
  });

  app.post('/api/mmfactory/importthing', function(req, res)
  {
    var importData = (req.body);

    if (!importData.thing)
      return res.sendStatus(400);

    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      // verify required params
      if (!importData.thing.title)
        return res.sendStatus(400);

      // insert project
      var data = {
        "user": udata.id,
        "name": importData.thing.title,
        "idx": hat(32, 16),
        "repo_src": "https://myminifactory.com/object/" + importData.thing.url,
        "repo_name": "myminifactory"
      };
      return data;
    })
    .then(function(project) {
      ProjectModel.create(project)
      .then(function(pinfo) {

        _.each(importData.thing.files, function(item) {
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
          return BotFiles.importThing(item.file_url, s3uploadpath)
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
        project.items = importData.thing.files;
        project.ok = true;
        project.id = pinfo.id;
        project.importing = true;
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
