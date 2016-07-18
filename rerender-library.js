var db = require('./config/database')
  , exec = require('child_process').exec
  , AWS = require('aws-sdk')
  , ac = require('./config/aws')
  , http = require('http')
  , _ = require('underscore');

AWS.config.update({region: 'us-west-1'});


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

var projects = [];

function sendNextProject()
{
  if (projects.length > 0) {
    console.info("sending next project, left: ", projects.length);
    sendRenderMessage(projects.pop(), sendNextProject);
  }
}

db.view("projects", "list", {}, function(err, body) {
    if (!err) {
        projects = body.rows;
        sendNextProject();
    } else {
      res.json({error: err});
    }
});
