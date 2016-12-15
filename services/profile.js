var db = require('../config/database')
  , sha1 = require('sha1')
  , awsc = require('../config/aws')
  , hat = require('hat')
  , checkAuth = require('../util/check_authorization')
  , Promise = require('bluebird')
  , UserModel = require('../models/user_model')

module.exports = function(app)
{
    app.get('/api/profile/:id',  function (req, res)
    {
      checkAuth.verifyHeader(req.headers)
      .then(function(udata) {
        console.info(udata)
        if (udata.id != req.params.id)
          throw new Error('Unauthorized');
        return UserModel.getUser(udata.id);
      })
      .then(function(user) {
        var u = {};
        u.first_name = user.first_name;
        u.last_name = user.last_name;
        u.printers = user.printers;
        u.email = user.email;
        u.thingiverse_token = user.thingiverse_token;
        u.thingiverse = user.thingiverse;
        u.mmfactory = user.mmfactory
        res.json(u);
      })
      .catch(function(err) {
        console.info(err);
        return res.sendStatus(400);
      })
    });

    app.put('/api/profile/:id', function(req, res)
    {
      checkAuth.verifyHeader(req.headers)
      .then(function(udata) {
        return UserModel.getUser(udata.id)
      })
      .then(function(user) {
        // filter here attributes that are updateable
        if (req.body.printers) {
          user.printers = req.body.printers;
          return UserModel.update(user);
        } else {
          throw new Error("Required Parameters missing");
        }
      })
      .then(function(user) {
        res.json(user);
      })
      .catch(function(e) {
        console.info(e);
        return res.sendStatus(400);
      })
    });


};
