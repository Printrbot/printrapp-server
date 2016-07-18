var db = require('../config/database')
  , sha1 = require('sha1')
  , awsc = require('../config/aws')
  , _ = require('underscore')
  , Promise = require('bluebird');


// fetch the project and verify access at the same time
module.exports.getUser = function(user_id)
{
  return new Promise(function(resolve, reject) {
    db.get(user_id, {}, function(err, user) {
      if (err) reject(err);
      else resolve(user);
    });
  });
}
