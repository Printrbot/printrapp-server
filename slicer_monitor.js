var AWS = require('aws-sdk')
  , ac = require('./config/aws')
  , db = require('./config/database')
  , channel = null
  , sserver = require('./socket_server');

AWS.config.update({region: 'us-west-2'});

var sqs = new AWS.SQS();

var params = {
    QueueUrl: ac.sqs_slice_completed,
    MaxNumberOfMessages: 1,
    VisibilityTimeout: 30,
    WaitTimeSeconds: 20
};

function poolMessages() {
    //console.info("RENDER MONITOR: pooling rendered completed queueue...");
    sqs.receiveMessage(params, onReceiveMessage);
}

function onReceiveMessage(err, data)
{
  if (err) {
      console.log(err, err.stack);
      poolMessages();
  }
  else {
      // check if we got any messages
      if (data.Messages) {
          var msg = JSON.parse(data.Messages[0].Body);
          // find the file in the db and update rendered attribute
          db.get(msg.id, {}, function(err, job)
          {
              if (err) {
                  console.info("SLICE MONITOR: error, unable to find the file in db");
                  deleteSlicingMessage();
              } else {
                  // update the doc
                  console.info("SLICE MONITOR: updating db file");

                  job.status = 'ready';
                  job.gcode = job.project.stl.replace(".stl", ".gcode");

                  db.insert(job, [], function(err, b) {
                     if (err) {
                         console.info("SLICE MONITOR: error ", err);
                     } else {
                         // delete message
                         deleteSlicingMessage();
                         //  notify clients
                         channel.emit('job.status', {user: job.user, job: job.shortid, data: "slicing.completed"});
                         // send job to printer
                         sserver.sendJobToPrinter(job.user, job.printer_sn, job);
                     }
                  });
              }
          });

          function deleteSlicingMessage()
          {
              var sqs = new AWS.SQS();
              sqs.deleteMessage({
                  QueueUrl: ac.sqs_slice_completed,
                  ReceiptHandle: data.Messages[0].ReceiptHandle
              }, onDeleteMessage);
          }

          function onDeleteMessage(err, res) {
            if (err) {
                console.error("SLICE MONITOR: unable to delete message");
            } else {
                console.info("SLICE MONITOR: message deleted");
            }
            // pool for new messages
            poolMessages();
          }

      } else {
          // nothing in queue, so continue pooling
          poolMessages();
      }
  }
}

exports.startPooling = function(c) {
    channel = c;
    poolMessages();
}
