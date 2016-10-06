var AWS = require('aws-sdk')
  , ac = require('./config/aws')
  , db = require('./config/database')
  , channel = null
  , ImageTools = require('./util/image_tools')
  , ProjectModel = require('./models/project_model')
  , MessageQueue = require('./util/message_queue')
  , colors = require('colors')

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
    console.info("RECEIVED RENDER COMPLETED MESSAGE".red);
    // check if we got any messages
    if (data.Messages) {
      var message = data.Messages[0];
      var file_info = JSON.parse(message.Body);
      // fetch the file from db
      ProjectModel.getItem(file_info.id)
      .then(function(item) {
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
  }
}

module.exports.startPooling = function(c) {
  channel = c;
  poolMessages();
}
