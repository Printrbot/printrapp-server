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
        if (udata.id != req.params.id)
          throw new Error('Unauthorized');
        return UserModel.getUser(udata.id);
      }).catch(function(err) {
        return res.sendStatus(400);
      })
    });

    app.put('/api/profile/:id', function(req, res)
    {

      /*
      var udata = checkAuth.verifyHeader(req.headers);
      console.info("UDATA", udata);
      if (!udata) {
          return res.sendStatus(401);
      }
      // make sure that user is not setting one id in auth token
      // and trying to update another user id!!!!

      if (udata.id != req.params.id)
        return res.sendStatus(401);

      // ...

      var data = req.body

      if (req.params.id) {
          db.get(req.params.id, {}, function(err, body) {
              if (err)
                  res.sendStatus(404);
              else {
                  // figure this out TODO

                  res.json(body);
              }
          });
      }

      */
    });


};