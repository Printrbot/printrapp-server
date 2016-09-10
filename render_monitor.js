var AWS = require('aws-sdk')
  , ac = require('./config/aws')
  , db = require('./config/database')
  , channel = null
  , ImageTools = require('./util/image_tools')
  , ProjectModel = require('./models/project_model')
  , MessageQueue = require('./util/message_queue')

AWS.config.update({region: 'us-west-2'});

var sqs = new AWS.SQS();

var params = {
    QueueUrl: ac.sqs_render_completed,
    MaxNumberOfMessages: 1,
    VisibilityTimeout: 30,
    WaitTimeSeconds: 20
};


function poolMessages() {
  sqs.receiveMessage(params, onReceiveMessage);
}

function onReceiveMessage(err, data)
{
  if (err) {
    console.log(err, err.stack);
    poolMessages();
  }
  else {
    console.info("RECEIVED RENDER MESSAGE", data);
    // check if we got any messages
    if (data.Messages) {
      var message = data.Messages[0];
      var file_info = JSON.parse(message.Body);
      // fetch the file from db
      console.info(file_info);
      console.info(file_info.id)
      ProjectModel.getItem(file_info.id)
      .then(function(item) {
        console.info("GOT THE FILE HERE", item)

        item.thumbnail = file_info.thumbnail;
        item.rawimage = file_info.rawimage;
        item.preview = file_info.preview;
        return ProjectModel.updateItem(item);
      })
      .spread(function(item, r) {
        // emit rendered message
        return channel.emit('render.completed', item);
      })
      .then(function() {
        return MessageQueue.deleteRenderMessage(message.ReceiptHandle)
      })
      .then(function(item) {
        // done, continue pooling
        poolMessages();
      }).catch(function(err) {
        console.info("ERROR");
        console.info(err);
        poolMessages();
      })
    } else {
      // nothing in queue, so continue pooling
      poolMessages();
    }

      //------------------------------------
/*
      // find the file in the db and update rendered attribute
      db.get(file_info._id, {}, function(err, body)
      {
              if (err) {
                  console.info("RENDER MONITOR: error, unable to find the file in db");
                   deleteRenderMessage();
              } else {
                  // update the doc
                  console.info("RENDER MONITOR: updating db file");
                  // resize image here



                  db.insert(body, [], function(err, b) {
                     if (err) {
                         console.info("RENDER MONITOR: error ", err);
                     } else {
                         // all good, notify clients
                         channel.emit('render.completed', body);
                         // delete message
                         deleteRenderMessage();
                     }
                  });
              }
          });

          function deleteRenderMessage()
          {
              var sqs = new AWS.SQS();
              sqs.deleteMessage({
                  QueueUrl: ac.sqs_render_completed,
                  ReceiptHandle: data.Messages[0].ReceiptHandle
              }, onDeleteMessage);
          }

          function onDeleteMessage(err, res) {
            if (err) {
                console.error("RENDER MONITOR: unable to delete message");
            } else {
                console.info("RENDER MONITOR: message deleted");
            }
            // pool for new messages
            poolMessages();
          }

      } else {
          // nothing in queue, so continue pooling
          poolMessages();
      }

      */
  }
}

module.exports.startPooling = function(c) {
  channel = c;
  poolMessages();
}
