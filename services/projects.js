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
  , ProjectModel = require('../models/project_model')
  , Promise = require('bluebird')
  , FileRepo = require('../util/file_repo')
  , ImageTools = require('../util/image_tools')
  , MessageQueue = require('../util/message_queue')
  , MeshTools = require('../util/mesh_tools')
  , BotFiles = require('../util/bot_files')

module.exports = function(app) {

  app.get('/api/projects', function(req,res) {
    checkAuth.verifyHeader(req.headers).then(function(udata) {
      return ProjectModel.getProjectsByUser(udata.id);
    }).then(function(project) {
      return res.json(project);
    }).catch(function(err) {
      // error
      console.info(err);
      return res.sendStatus(400);
    });
  });

  app.get('/api/project/:id', function(req, res)
  {
    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      // grab the project from couch
      return ProjectModel.getProjectByIdAndUser(req.params.id, udata.id);
    })
    .then(function(project) {
      // find all the project items
      return ProjectModel.getProjectItems(project._id)
      .then(function(items) {
        project.items = items;
        return project;
      })
    })
    .then(function(project) {
      res.json(project);
    })
    .catch(function(err) {
      // error
      console.info(err);
      return res.sendStatus(400);
    });
  });

  app.get('/api/project/:id/raw', function(req, res)
  {
    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      // grab the project from couch
      return ProjectModel.getProjectByIdAndUser(req.params.id, udata.id);
    })
    .then(function(project) {
      // find all the project items
      return ProjectModel.getProjectItems(project._id)
      .then(function(items) {
        project.items = items;
        return project;
      })
    })
    .then(function(project) {
      // build index file for project
      // that printer can download and read
      console.info("GOT TO STREAM STUFF")
      BotFiles.streamProjectIndex(res, project);
    })
    .catch(function(err) {
      // error
      console.info(err);
      return res.sendStatus(400);
    });
  });

  app.post('/api/project', function(req, res)
  {

    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      // verify required params
      if (!req.body.name)
        return res.sendStatus(400);

      // insert project
      var data = {
        "user": udata.id,
        "name": req.body.name,
        "description": req.body.description
      };
      return ProjectModel.create(data);
    })
    .then(function(project) {
      res.json(project);
    })
    .catch(function(err) {
      // error
      console.info(err);
      res.sendStatus(400);
    });
  });

  app.delete('/api/project/:id', function(req, res)
  {
    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      // fetch the project and verify user
      return ProjectModel.getProjectByIdAndUser(req.params.id, udata.id)
    })
    .then(function(project) {
      // delete the project
      return ProjectModel.destroy(project._id, project._rev)
      .then(function(e) {
        // clean up files
        var toclean = [];
        if (project.thumbnail)
          toclean.push({Key: decodeURIComponent(project.thumbnail.split(".com/")[1])});
        if (project.preview)
          toclean.push({Key: decodeURIComponent(project.preview.split(".com/")[1])});

        if (toclean.length > 0) {
          return FileRepo.deleteFiles(toclean)
          .then(function(e) {
            return project;
          });
        } else {
          return project;
        }
      })
    })
    .then(function(project) {
      // all good
      res.json(project);
    })
    .catch(function(err) {
      // error
      console.info(err);
      return res.sendStatus(400);
    });
  });

  app.put('/api/project/:id', function(req, res)
  {
    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      console.info(udata)
      return ProjectModel.getProjectByIdAndUser(req.params.id, udata.id);
    })
    .then(function(project) {
      _.each(req.body, function(v,k,l) {
        if (!_.contains(['id','_id','user']))
          project[k] = v;
      });
      return ProjectModel.update(project);
    })
    .then(function(project) {
      res.json(project);
    })
    .catch(function(err) {
      // error
      console.info(err);
      return res.sendStatus(400);
    });
  });

  app.post('/api/project/:id/uploadpreview', function(req, res) {
    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      return ProjectModel.getProjectByIdAndUser(req.params.id, udata.id)
      .then(function(project) {
        if (!req.files)
          return res.sendStatus(400);
        var f = req.files.file;
        if (!_.contains(['jpg', 'jpeg', 'png'], f.extension.toLowerCase()))
          return res.sendStatus(400);
        else {
          var s3uploadpath = 'u/'+udata.id+'/p/'+req.params.id+'/';
          // create preview, thumbnail and raw image for hub
          return ImageTools.createAllSizes(f)
          .then(function(j) {
            var _f = j[0].split("/").pop();
            return FileRepo.uploadToS3(j[0], f.mimetype, s3uploadpath+_f)
            .then(function(preview) {
              return [j, preview];
            })
          })
          .spread(function(j, preview) {
            var _f = j[1].split("/").pop();
            return FileRepo.uploadToS3(j[1], f.mimetype, s3uploadpath+_f)
            .then(function(thumb) {
              return [j, preview, thumb];
            })
          })
          .spread(function(j, preview, thumb) {
            var _f = j[2].split("/").pop();
            return FileRepo.uploadToS3(j[2], f.mimetype, s3uploadpath+_f)
            .then(function(raw) {
              return [j, preview, thumb, raw];
            })
          })
          .spread(function(j, preview, thumb, raw ) {
            // save to db
            project.preview = preview.Location;
            project.thumbnail = thumb.Location;
            project.rawimage = raw.Location;
            return ProjectModel.update(project);
          })
        }
      })
      .then(function(project) {
        res.json(project);
      })
    })
    .catch(function(err) {
      // error
      console.info(err);
      return res.sendStatus(400);
    });
  }),

  app.post('/api/project/:id/uploaditem', function(req, res)
  {
    console.info('in uploading item');
    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      console.info("FETCHING PROJECT")
      return ProjectModel.getProjectByIdAndUser(req.params.id, udata.id)
    })
    .then(function(project) {
      console.info("GOT THE PROJECT", project);
      var f = req.files.file;
      var pi = {
        "id": hat(),
        "name": f.originalname.toLowerCase(),
        "type": "project_item",
        "user": project.user,
        "created_at": new Date().getTime()
      }
      if (f.extension.toLowerCase() == 'stl') {
        // fix the uploaded file with admesh
        pi.file_type = 'stl';
        pi.mime_type = f.mimetype;
        pi.project = req.params.id;

        return MeshTools.fixStl(f.path)
        .then(function(file_path) {
          // upload stl to s3
          console.info("UPLOADING TO S3")
          var s3uploadpath = 'u/'+project.user+'/i/'+pi.id+'/';
          var _f = f.path.split("/").pop();
          return FileRepo.uploadToS3(file_path, f.mimetype, s3uploadpath+_f)
        })
        .then(function(stl) {
          console.info("UPDATING PROJECT WITH SRC ", stl);
          // update item with stl location
          pi.src = stl.Location;
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
      }
      else if (!_.contains(['jpg', 'jpeg', 'png'], f.extension.toLowerCase())) {
        pi.file_type = 'image';
        pi.mime_type = f.mimetype;
        // upload image item
        // THIS IS NOT DONE!!!
        // TODO ^^^^
      } else {
        throw new Error('invalid format');
      }
    })
    /*
    .spread(function(project, item) {
      // add this item id to project
      console.info("ADDING ITEM TO PROJECT ", item, project)
      var _items = project.items ? project.items : [];
      _items.push(item.id);
      project.items = _items;
      return ProjectModel.update(project);
    })
    */
    .spread(function(project, item) {
      console.info("ALL DONE ", project)
      return res.json(project);
    })
    .catch(function(err) {
      // error
      console.info(err);
      return res.sendStatus(400);
    });
  });

  app.delete('/api/project/:pid/item/:iid', function(req, res)
  {
    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      // fetch the project item and verify user
      return ProjectModel.getProjectItemByIdAndUser(req.params.iid, udata.id)
    })
    .then(function(item) {
      // delete the project item
      return ProjectModel.destroyItem(item._id, item._rev)
      .then(function(e) {
        // clean up files
        var toclean = [];
        if (item.thumbnail)
          toclean.push({Key: decodeURIComponent(item.thumbnail.split(".com/")[1])});
        if (item.preview)
          toclean.push({Key: decodeURIComponent(item.preview.split(".com/")[1])});
        if (item.rawimage)
          toclean.push({Key: decodeURIComponent(item.rawimage.split(".com/")[1])});
        if (item.src)
          toclean.push({Key: decodeURIComponent(item.src.split(".com/")[1])});

        return FileRepo.deleteFiles(toclean)
        .then(function(e) {
          return item;
        });
      })
    })
    .then(function(item) {
      // all good
      res.json(item);
    })
    .catch(function(err) {
      // error
      console.info(err);
      return res.sendStatus(400);
    });
  });

}

    /// -----------------------------------------------------------------------------------

/*
    app.post('/api/project/updatestl', function(req, res)
    {
      //  verify user
      var udata = checkAuth.verifyHeader(req.headers);
      if (!udata)
        return res.sendStatus(401);
      // check if we have project id
      var pid = req.body.id;
      if (!pid)
        return res.sendStatus(401);
      // check if we have new file
      if (!req.files || !req.files.file)
        return res.sendStatus(400);

      var project = null;

      // fetch the project info
      db.get(pid, {}, function(err, body)
      {
        if (!err) {
          // verify it belongs to this user
          if (body.user != udata.id)
            return res.sendStatus(401);
          else {
            project = body;
            req.files.file.name = body.name;
            uploadToS3(req.files.file, pid, udata.id, onUploadCompleted)
          }
        }
        else
          return res.sendStatus(400);
      });

        function onUploadCompleted(e, r) {
          if (e) {
            console.info(e);
            res.sendStatus(400);
          } else {
            // remove old thumb
            project.thumbnail = null;
            db.insert(project, [], function(err, body) {
              if (err) {
                res.sendStatus(400);
                console.info(err);
              } else {
                sendRenderMessage(project, function(e, d) {
                if (e) {
                  res.sendStatus(400);
                } else
                  res.json({"success": d});
                });
              }
            });
          }
        }
    });

    app.post('/api/project/modify/:id', function(req, res)
    {
      var udata = checkAuth.verifyHeader(req.headers);
      if (!udata) {
        return res.sendStatus(401);
      }

      if (udata.id != req.body.user)
        return res.sendStatus(401);

      var data = req.body;
      db.get(req.params.id, {}, function(err, body) {
        if (err)
          res.sendStatus(404);
        else {
         if (err) {
            res.sendStatus(500);
         } else {
           // verify user
           // TODO

           // fetch the file from s3
           var tmpf = temp+body._id+'.stl';
           var stl = fs.createWriteStream(tmpf);

           http.get(body.stl.replace("https://", "http://"), function(response) {
             response.pipe(stl);
             stl.on('finish', function() {
                 console.info('finished downloading file');
                 stl.close(modifyStl);
             });
           }).on('error', function(err) { // Handle errors
             fs.unlink(tmpf, function (err) {
                 if (err) {
                     console.error(err);
                 }
                 console.log('Temp stl Deleted');
             });
             console.info('error, unable to modify the file');
             res.sendStatus(500);
           });

           // run admesh to fix the stl
           var rotations = [];
           function modifyStl()
           {
             console.info(data);
             console.info(data.rotation);
              if (parseFloat(data.rotation.x) != 0)
                rotations.push(['x', parseFloat(data.rotation.x) * (180/Math.PI)]);
              if (data.rotation.y > 0)
                rotations.push(['y', parseFloat(data.rotation.y) * (180/Math.PI)]);
              if (data.rotation.z > 0)
                rotations.push(['z', parseFloat(data.rotation.z) * (180/Math.PI)]);

              if (rotations.length == 0) {
                res.sendStatus(200);
              } else {
                rotateMesh(function(e) {
                  uploadToS3({'path':tmpf, 'name':body.name}, body._id, body.user, onUploaded);
                })
              }
            }

            // when finished with uploading, send message to rendering server to update the preview thumb
            function onUploaded(err, sres)
            {
              if (err) {
                res.sendStatus(500);
              } else {
                sendRenderMessage(body, onRenderComplete);
              }
            }

            // reply with success
            function onRenderComplete(e) {
              res.sendStatus(200);
            }

            function rotateMesh(cb)
            {
              if (rotations.length == 0)
                cb();
              else {
                 var r = rotations.pop();
                 console.info("rotating ",r[0],r[1]);
                 cmd = 'admesh --'+r[0]+'-rotate='+r[1]+' --write-binary-stl='+tmpf+' '+tmpf;
                 exec(cmd, function callback(error, stdout, stderr) {
                    rotateMesh(cb);
                 });
              }
            }
          }
        }
      });
    });








  }



  function sendRenderMessage(project, cb)
  {
    // send message to render queue
    var sqs = new AWS.SQS();
    var rparams = {
        MessageBody: JSON.stringify(project),
        QueueUrl: ac.sqs_render,
        DelaySeconds: 0
    };
    sqs.sendMessage(rparams, cb);
  }
*/
