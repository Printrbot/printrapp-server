var db = require('../config/database')
  , sha1 = require('sha1')
  , awsc = require('../config/aws')
  , _ = require('underscore')
  , Promise = require('bluebird');


var _getUser = function(user_id) {
  return new Promise(function(resolve, reject) {
    db.get(user_id, {}, function(err, user) {
      if (err) reject(err);
      else resolve(user);
    });
  });
}

var _getUserByEmail = function(email) {
  return new Promise(function(resolve, reject) {
    db.view("users", "list", {keys: [email]}, function(err, data) {
      if (err) {
        console.info(err.red);
        return reject(err);
      }
      if (data.rows.length>0)
        resolve(data.rows[0].value)
      else {
        resolve(null);
      }
    });
  })
}

var _checkVerification = function(email, token) {
  return new Promise(function(resolve, reject) {
    db.view("users", "list", {keys: [email]}, function(err, data) {
      if (err) {
        console.info(err.red);
        return reject(err);
      }
      console.info("IN FIND BY EMAIL", data)
      resolve(data)
    });
  })
}

var _authenticateUser = function(email, password) {
  console.info(email, password)
  return new Promise(function(resolve, reject) {
    _getUserByEmail(email)
    .then(function(user) {
      // verify password
      if (sha1(password + awsc.secret) == user.password)
        resolve(user)
      else
        reject('Invalid password');
    })
    .catch(function(err) {
      console.info(err)
      reject(err)
    })
  })
}

var _create = function(data) {
  data.type = 'user';
  data.created_at = new Date().getTime();

  return new Promise(function(resolve, reject) {
    db.insert(data, [], function(err, user) {
      if (err) reject(err);
      else resolve(user);
    });
  });
}

var _update = function(data) {
  data.type = 'user';
  data.updated_at = new Date().getTime();

  return new Promise(function(resolve, reject) {
    db.insert(data, [], function(err, user) {
      if (err) reject(err);
      else resolve(user);
    });
  });
}

module.exports = {
  create: _create,
  authenticateUser: _authenticateUser,
  checkVerification: _checkVerification,
  getUserByEmail: _getUserByEmail,
  getUser: _getUser,
  update: _update
}
