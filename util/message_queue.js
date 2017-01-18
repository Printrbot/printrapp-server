var db = require('../config/database')
  , exec = require('child_process').exec
  , AWS = require('aws-sdk')
  , hat = require('hat')
  , ac = require('../config/aws')
  , Promise = require('bluebird')


module.exports.sendRenderMessage = function(item)
{
  return new Promise(function(resolve, reject) {
    var sqs = new AWS.SQS();
    var rparams = {
      MessageBody: JSON.stringify(item),
      QueueUrl: ac.sqs_render,
      DelaySeconds: 0
    };
    sqs.sendMessage(rparams, function(err, data) {
      if (err) reject(err);
      else resolve(data);
    });
  })
}

module.exports.sendSliceMessage = function(item)
{
  return new Promise(function(resolve, reject) {
    var sqs = new AWS.SQS();
    var rparams = {
      MessageBody: JSON.stringify(item),
      QueueUrl: ac.sqs_slice,
      DelaySeconds: 0
    };
    sqs.sendMessage(rparams, function(err, data) {
      if (err) reject(err);
      else resolve(data);
    });
  })
}



module.exports.deleteRenderMessage = function(receipt)
{
  return new Promise(function(resolve, reject) {
    console.info("DELETING render request message");
    var sqs = new AWS.SQS();
    sqs.deleteMessage({
      QueueUrl: ac.sqs_render_completed,
      ReceiptHandle: receipt
    }, function(err, res) {
      if (err) return reject(err);
      else return resolve(res);
    });
  });
}
