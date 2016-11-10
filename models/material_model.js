var db = require('../config/database')
  , sha1 = require('sha1')
  , awsc = require('../config/aws')
  , _ = require('underscore')
  , Promise = require('bluebird')
  , colors = require('colors');


var getDefault = function()
{
  return new Promise(function(resolve, reject) {
    db.get('materials', {}, function(err, materials) {
      if (err) reject(err);
      else resolve(materials);
    });
  });
}


var create = function(data)
{
  data.type = 'materials';
  data.created_at = new Date().getTime();

  return new Promise(function(resolve, reject) {
    db.insert(data, [], function(err, project) {
      if (err) reject(err);
      else resolve(project);
    });
  });
}

module.exports.createUserLibrary = function(user_id)
{
  return new Promise(function(resolve, reject) {
    // grab default
    getDefault()
    .then(function(mat) {
      delete (mat._id);
      delete (mat._rev);
      mat.user = user_id;
      // create user library
      create(mat)
      .then(function(d) {
        mat._id = d.id;
        mat._rev = d.rev;
        resolve(mat);
      })
    })
    .catch(function(err) {
      reject(err);
    })
  });
}

module.exports.getMaterialsByUser = function(user_id)
{
  return new Promise(function(resolve, reject) {
    db.view("materials", "list", {keys: [user_id], descending:true}, function(err, body) {
      if (err) reject(err);
      if (body.rows.length == 0) resolve(null);
      else resolve(body.rows[0].value);
    });
  });
}


module.exports.update = function(data)
{

  data.type = 'materials';
  data.updated_at = new Date().getTime();

  console.info(data);

  return new Promise(function(resolve, reject) {
    db.insert(data, [], function(err, materials) {
      if (err) reject(err);
      else resolve(materials);
    });
  });
}
