var db = require('../config/database')
  , exec = require('child_process').exec
  , AWS = require('aws-sdk')
  , hat = require('hat')
  , fs = require('fs')
  , ac = require('../config/aws')
  , checkAuth = require('../util/check_authorization')
  , _ = require('underscore')
  , sserver = require('../socket_server')
  , shortid = require('shortid');

AWS.config.update({region: 'us-west-2'});

module.exports = function(app) {
    app.get('/api/jobs', function(req,res) {

        var udata = checkAuth.verifyHeader(req.headers);
        if (!udata) {
            return res.sendStatus(401);
        }

        db.view("jobs", "list", {keys: [udata.id], descending:true}, function(err, body) {
            if (!err) {
                res.json(body);
            } else {
                res.json({error: err});
            }
        });
    });

    app.post('/api/job/:project_id', function(req, res)
    {
        var udata = checkAuth.verifyHeader(req.headers);
        if (!udata) {
            return res.sendStatus(401);
        }

        // grab the project from the db
        db.get(req.params.project_id, {}, verifyProject);

        function verifyProject(err, body)
        {
            if (!err) {
                // verify owner id
                if (body.user != udata.id)
                    return res.sendStatus(401);
                else
                    searchOldJobs(body);
            }
            else
                res.json({"error": "invalid file id"});
        }

        function searchOldJobs(project)
        {
          db.view("jobs", "byproject", {keys: [project._id]}, function(err, body) {
              if (!err) {
                  // check if we already rendered this project before
                  var oldJob = false;
                  _.each(body.rows, function(j) {
                    if (j.value.material == req.body.material &&
                        j.value.quality == req.body.quality &&
                        j.value.support == req.body.support &&
                        j.value.infill == req.body.infill &&
                        j.value.brim == req.body.brim &&
                        j.value.gcode) {
                        oldJob = j;
                    }
                  });
                  // if not do it again
                  if (oldJob) {
                    sendJobToPrinter(udata.id, req.body.printer, oldJob);
                    res.json({"success": oldJob});
                  }
                  else
                    createJob(project);
              } else {
                  createJob(project);
              }
          });
        }

        function createJob(project)
        {
            var data = {
              type: 'job',
              shortid: shortid.generate(),
              user: udata.id,
              status: 'slicing',
              profile: req.body.profile,
              project: project,
              material: req.body.material,
              quality: req.body.quality,
              support: req.body.support,
              infill: req.body.infill,
              brim: req.body.brim,
              created_at: req.body.created_at
            }

            db.insert(data, [], function(err, body) {
               if (err) {
                   console.log(err);
                   return res.sendStatus(500);
               } else {
                   data.id = body.id;
                   data.printer_sn = req.body.printer;
                   console.info("in slice job", data)
                   sliceJob(data)
               }
            });
        }

        function sliceJob(job)
        {
            var sqs = new AWS.SQS();

            var sparams = {
                MessageBody: JSON.stringify(job),
                QueueUrl: ac.sqs_slice,
                DelaySeconds: 0
            };

            sqs.sendMessage(sparams, function(err, data)
            {
                if (err) {
                    console.log(err, err.stack);
                    res.sendStatus(500);
                } else {
                    res.json({"success": job});
                    channel.emit('job.status', {user: udata.id, job: job.shortid, data: "slicing.started"});
                }
            });
        }

        function sendJobToPrinter(uid, sn, job)
        {
          console.info("RECEIVED JOB:");
          console.info("UID: ", uid);
          console.info("SN: ", sn);

          var gcode = (job.value) ? job.value.gcode : job.gcode;
          gcode = gcode.replace("https:","http:");
          var shortid = (job.value) ? job.value.shortid : job.shortid;

          console.info(gcode);
          console.info(shortid);

          //usocket.write('{"m":"download", "gcode":"'+gcode+'", "shortid":"'+shortid+'", "autostart":true}\n');

          // send the message over socketio to browser to tell printer to
          // start downloading the file....

          channel.emit('job.download', {user: uid, job: shortid, location: gcode });
        }
    })

    app.get('/api/job/:id', function(req, res)
    {
        var udata = checkAuth.verifyHeader(req.headers);
        if (!udata) {
            return res.sendStatus(401);
        }

        if (req.params.id) {
            db.get(req.params.id, {}, function(err, body)
            {
                if (!err) {
                    // verify owner id
                    if (body.user != udata.id)
                        return res.sendStatus(401);
                    else
                        res.json(body);
                }
                else
                    res.json({"error": "invalid file id"});
            });
        }
    });

    app.delete('/api/job/:id', function(req, res)
    {
        var udata = checkAuth.verifyHeader(req.headers);
        if (!udata) {
            return res.sendStatus(401);
        }

        if (req.params.id) {
            db.get(req.params.id, {}, function(err, body)
            {
                if (!err) {
                    // verify owner id
                    if (body.user != udata.id)
                        return res.sendStatus(401);
                    else {
                        db.destroy(body._id, body._rev, function(err, body) {
                            if (!err)
                                res.sendStatus(200);
                            else {
                                res.sendStatus(500);
                            }
                        });
                    }
                }
                else
                    res.sendStatus(400);
            });
        }
    });
};
