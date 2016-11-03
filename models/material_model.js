var db = require('../config/database')
  , sha1 = require('sha1')
  , awsc = require('../config/aws')
  , _ = require('underscore')
  , Promise = require('bluebird')
  , colors = require('colors');


module.exports.getDefault = function()
{
  return new Promise(function(resolve, reject) {
    db.get('materials', {}, function(err, materials) {
      if (err) reject(err);
      else resolve(materials);
    });
  });
}

module.exports.getMaterialsByIdAndUser = function(material_id, user_id)
{
  return new Promise(function(resolve, reject) {
    db.get(material_id, {}, function(err, project) {
      if (err) reject(err);
      else if (project.user != user_id)
        reject(new Error('Invalid user id'));
      else resolve(project);
    });
  });
}

module.exports.getMaterialsByUser = function(user_id)
{
  return new Promise(function(resolve, reject) {
    db.view("materials", "list", {keys: [user_id], descending:true}, function(err, body) {
      if (err) reject(err);
      else resolve(body);
    });
  });
}

module.exports.create = function(data)
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


module.exports.update = function(data)
{
  data.type = 'materials';
  data.updated_at = new Date().getTime();

  return new Promise(function(resolve, reject) {
    db.insert(data, [], function(err, project) {
      if (err) reject(err);
      else resolve(project);
    });
  });
}
