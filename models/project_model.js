var db = require('../config/database')
  , sha1 = require('sha1')
  , awsc = require('../config/aws')
  , _ = require('underscore')
  , Promise = require('bluebird');



// fetch the project and verify access at the same time
module.exports.getProjectByIdAndUser = function(project_id, user_id)
{
  return new Promise(function(resolve, reject) {
    db.get(project_id, {}, function(err, project) {
      if (err) reject(err);
      else if (project.user != user_id)
        reject(new Error('Invalid user id'));
      else resolve(project);
    });
  });
}

module.exports.getProjectsByUser = function(user_id)
{
  return new Promise(function(resolve, reject) {
    db.view("projects", "list", {keys: [user_id], descending:true}, function(err, body) {
      if (err) reject(err);
      else resolve(body);
    });
  });
}

module.exports.getProjectItemByIdAndUser = function(project_id, user_id)
{
  return new Promise(function(resolve, reject) {
    db.get(project_id, {}, function(err, item) {
      if (err) reject(err);
      else if (item.user != user_id)
        reject(new Error('Invalid user id'));
      else resolve(item);
    });
  });
}

module.exports.getProjectItems = function(project_id)
{
  return new Promise(function(resolve, reject) {
    db.view("projects", "items", {key: project_id, descending:true, include_docs: true}, function(err, body) {
      if (err) reject(err);
      else {
        var items = [];
        _.each(body.rows, function(r) {
          items.push(r.doc);
        })
        resolve(items);
      }
    })
  });
}

module.exports.destroy = function(project_id, rev_id)
{
  return new Promise(function(resolve, reject) {
    db.destroy(project_id, rev_id, function(err, body) {
      if (err) reject(err);
      else resolve(body);
    });
  });
}

module.exports.destroyItem = function(item_id, rev_id)
{
  return new Promise(function(resolve, reject) {
    db.destroy(item_id, rev_id, function(err, body) {
      if (err) reject(err);
      else resolve(body);
    });
  });
}

module.exports.create = function(data)
{
  data.type = 'project';
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
  data.type = 'project';
  data.updated_at = new Date().getTime();

  return new Promise(function(resolve, reject) {
    db.insert(data, [], function(err, project) {
      if (err) reject(err);
      else resolve(project);
    });
  });
}

module.exports.getItem = function(item_id)
{
  return new Promise(function(resolve, reject) {
    db.get(item_id, {}, function(err, item) {
      console.info(err);
      console.info(item)
      if (err) reject(err);
      else {
        console.info(item)
        if (item.type == 'project_item')
          resolve(item);
        else {
          reject(new Error('invalid type'));
        }
      }
    });
  });
}

module.exports.createItem = function(data)
{
  return new Promise(function(resolve, reject) {
    data.type = 'project_item';
    data.created_at = new Date().getTime();
    data._id = data.id;
    db.insert(data, [], function(err, item) {
      console.info("INSERTED ", item);
      if (err) reject(err);
      else resolve(item);
    });
  });
}

module.exports.updateItem = function(data)
{
  return new Promise(function(resolve, reject) {
    data.type = 'project_item';
    data.updated_at = new Date().getTime();
    db.insert(data, [], function(err, item) {
      if (err) reject(err);
      else resolve([data, item]);
    });
  });
}
