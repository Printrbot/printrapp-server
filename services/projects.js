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

/*
  app.get('/api/project/:id/:jwt/index', function(req, res)
  {
    checkAuth.verifyJwt(req.params.jwt)
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

      console.info(project);
      console.info("GOT TO STREAM STUFF")
      BotFiles.streamProjectIndex(res, project);
    })
    .catch(function(err) {
      // error
      console.info(err);
      return res.sendStatus(400);
    });
  });
*/
  app.post('/api/project', function(req, res)
  {
    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      // verify required params
      var b = req.body;
      if (!b.name)
        return res.sendStatus(400);

      // insert project
      var data = {
        "user": udata.id,
        "name": b.name,
        "description": b.description,
        "idx": hat(32, 16)
      };
      if (b.repo_src) data.repo_src = b.repo_src;
      if (b.repo_name) data.repo_name = b.repo_name;
      //if (b.preview) data.preview = b.preview;

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
      if (!project['idx']) {
        project['idx'] = hat(32, 16);
      }
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

  app.put('/api/project/:pid/item/:iid', function(req, res)
  {
    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      return ProjectModel.getProjectItemByIdAndUser(req.params.iid, udata.id)
    })
    .then(function(item) {
      console.info(item);
      var sliceit = false;
      var reindex = false;
      if (req.body.hasOwnProperty("resolution")
        && req.body.resolution != item.resolution)
          sliceit = true;
      if (req.body.hasOwnProperty("support")
        && req.body.support != item.support)
          sliceit = true;
      if (req.body.hasOwnProperty("brim")
        && req.body.brim != item.brim)
          sliceit = true;
      if (req.body.hasOwnProperty("infill")
        && req.body.infill != item.infill)
          sliceit = true;

      if (req.body.hasOwnProperty("name")
        && req.body.name != item.name)
          reindex = true;

      _.each(req.body, function(v,k,l) {
        if (!_.contains(['id','_id','_rev','user'], k))
          item[k] = v;
      });

      return ProjectModel.updateItem(item)
      .then(function(item) {
        return [item, sliceit, reindex]
      });
    })
    .spread(function(item, sliceit, reindex) {
      // call lambda slicer
      // (only if stuff changed)
      if (sliceit) {
        BotFiles.slice(item[0])
      }

      if (reindex) {
        ProjectModel.getProjectByIdAndUser(item[0].project, item[0].user)
        .then(function(project) {
          return ProjectModel.getProjectItems(item[0].project)
          .then(function(items) {
            project.items = items;
            return project;
          })
        })
        .then(function(projectWithItems) {
          BotFiles.reindex(projectWithItems)
        })
      }
    })
    .catch(function(err) {
      // error
      console.log("ERROR:")
      console.log(err);
    });

    res.json({status: "success"});
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
            return FileRepo.uploadToS3(j[0], 'img/png', s3uploadpath+_f)
            .then(function(preview) {
              return [j, preview];
            })
          })
          .spread(function(j, preview) {
            var _f = j[1].split("/").pop();
            return FileRepo.uploadToS3(j[1], 'img/png', s3uploadpath+_f)
            .then(function(thumb) {
              return [j, preview, thumb];
            })
          })
          .spread(function(j, preview, thumb) {
            var _f = j[2].split("/").pop();
            return FileRepo.uploadToS3(j[2], 'img/png', s3uploadpath+_f)
            .then(function(raw) {
              return [j, preview, thumb, raw];
            })
          })
          .spread(function(j, preview, thumb, raw ) {
            // save to db
            project.preview = preview.Location;
            project.thumbnail = thumb.Location;
            project.rawimage = raw.Location;
            return ProjectModel.update(project).then(function(r) {
              return project;
            })
          })
        }
      })
      .then(function(project) {
        // reindex
        console.info(project);
        ProjectModel.getProjectItems(project._id)
        .then(function(items) {
          project.items = items;
          return project;
        })
        .then(function(projectWithItems) {
          return BotFiles.reindex(projectWithItems);
        })
        .then(function(output) {
          console.info(output);
          console.info("DONE WITH REINDEX");
        })

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

      var f = req.files.file;
      if (f.extension.toLowerCase() != "stl")
        throw new Error('Invalid file format. Only STL files are supported'.red);

      var pi = {
        "id": hat(),
        "idx": hat(32, 16),
        "ver": 2,
        "sliced": false,
        "name": f.originalname.toLowerCase(),
        "type": "project_item",
        "user": project.user,
        "project": project._id,
        "region": "us-west-2",
        "resolution": "standard",
        "support": false,
        "brim": false,
        "infill": "standard",
        "advanced": [],
        "created_at": new Date().getTime()
      }
      console.info("UPDATING ITEM:".green);
      console.info(pi);
      // fix the uploaded file with admesh
      return MeshTools.fixStl(f.path) // maybe move this to lambda?
      .spread(function(file_path, lx, ly, lz) {
        pi.size = [lx, ly, lz];
        // upload stl to s3
        console.info("UPLOADING TO S3".green)
        var s3uploadpath = 'u/'+project.user+'/i/'+pi.id+'/';
        var _f = f.path.split("/").pop();
        return FileRepo.uploadToS3(file_path, f.mimetype, s3uploadpath+_f)
      })
      .then(function(stl) {
        console.info("UPDATING PROJECT WITH SRC ".green, stl);
        // update item with stl location
        console.info(stl);
        pi.file_path = stl.Key;
        return pi
      })
      .then(function(_pi) {
        console.info("SAVING PROJECT ITEM TO DB".green)
        // save this item in database
        return ProjectModel.createItem(pi);
      })
      .then(function(project_item_res) {
        // send message to render queue
        console.info("HERE".red, project_item_res);
        pi._rev = project_item_res.rev;
        console.info("SENDING RENDER MSG ".green, pi)
        return MessageQueue.sendRenderMessage(pi)
        .then(function(q) {
          return [project, pi];
        })
      })
    })
    .spread(function(project, item) {
      // slice it
      BotFiles.slice(item)
      .then(function(out) {
        console.info("SLICING DONE, UPDATE ITEM HERE WITH SLICING STATUS".green);
        console.info("ITEM: ".green, item);
        item.sliced = true;
        ProjectModel.updateItem(item)
        .spread(function(_data, _item) {
          console.info("PROJECT ITEM UPDATED WITH SLICED:TRUE".green);
          console.info("SENDING MESSAGE TO BROWSER TO UPDATE SLICING STATUS".green);
          //return channel.emit('render.completed', item);
          console.info(_item);
          item._rev = _item.rev;
          app.channel.emit('slicing.completed', item);
        })
      })
      .catch(function(err) {
        console.info("SLICING FAILED!!!".red);
        // fetch the item from db, since it may have been updated
        // and version may have changed
        ProjectModel.getItem(item._id)
        .then(function(item) {
          item.sliced = "error";
          return ProjectModel.updateItem(item)
        })
        .spread(function(_data, _item) {
          console.info("PROJECT ITEM UPDATED WITH SLICED:ERROR".red);
          console.info("SENDING MESSAGE TO BROWSER TO UPDATE SLICING STATUS".red);
          //return channel.emit('render.completed', item);
          console.info(_data);
          console.info(_item);
          _data._rev = _item.rev;
          app.channel.emit('slicing.completed', _data);
        })
      });

      // and reindex
      console.info("REINDEXING".green)
      console.info("PROJECT: ".green, project);
      ProjectModel.getProjectItems(project._id)
      .then(function(items) {
        project.items = items;
        return project;
      })
      .then(function(projectWithItems) {
        console.info("PROJECT WITH ITEMS: ".green, projectWithItems)
        return BotFiles.reindex(projectWithItems);
      })
      .then(function(output) {
        console.info(output);
        console.info("DONE WITH REINDEX".green);
      })
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

  app.post('/api/project/modify/:id', function(req, res) {
    checkAuth.verifyHeader(req.headers)
    .then(function(udata) {
      return ProjectModel.getProjectItemByIdAndUser(req.params.id, udata.id);
    })
    .then(function(item) {

      var data = {
        "file_path": item.file_path,
        "user": item.user,
        "rotate": req.body.rotation,
        "scale": req.body.scale,
        "id": req.params.id
      }
      return MeshTools.applyTransformations(data)
      .then(function(r) {
        console.info("TRANSFORMATIONS DONE, SLICING...".blue)
        console.info(r);
        // when we apply transformations, x,y and z size change
        // so update them
        if (r.size) {
          item.size = r.size;
          console.info("updating project item: ", item);
          ProjectModel.updateItem(item)
          .spread(function(_data, _item) {
            console.info("Project item updated!".red);
            console.info(_item);
          })
          .catch(function(err) {
            console.info("could not update project item!".red);
            console.info(err);
          })
        }

        // slice it, don't have to wait
        BotFiles.slice(item)
        .then(function(e) {
          console.info("SLICING FINISHED".green);
        })
        // render preview
        console.info("RENDERING PREVIEW...".pink);
        return MessageQueue.sendRenderMessage(item)
      })
    })
    .then(function(t) {
      console.info("ALL DONE".red);
      res.json(t);
    })
    .catch(function(err) {
      console.error(err);
      res.sendStatus(400);
    });
  });



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

/*
app.get('/api/cleanshit', function(req, res)
{

  db.view("jobs", "byproject", {}, function(err, body) {
    if (err) return res.sendStatus(500);
    else {
      Promise.reduce(body.rows, function(ac, o) {
        var item = o.value;

        db.destroy(item._id, item._rev, function(err, body) {
          if (err) {
            console.info(err);
            return err;
          } else {
            return body;
          }
        });
      })
      .then(function(total) {
        res.json(body);
      })




    }
  })


});
*/


}
