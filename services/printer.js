var db = require('../config/database')
  , sha1 = require('sha1')
  , awsc = require('../config/aws')
  , hat = require('hat')
  , checkAuth = require('../util/check_authorization')
  , sserver = require('../socket_server')
  , _ = require('underscore');

module.exports = function(app)
{
    app.get('/api/printers',  function (req, res)
    {
      var udata = checkAuth.verifyHeader(req.headers);
      if (!udata) {
          return res.sendStatus(401);
      }

      var printers = sserver.getPrintersByUser(udata.id);
      res.json(printers ? printers : []);
    });


    app.post('/api/printer/:id/:sn',  function (req, res)
    {
      var udata = checkAuth.verifyHeader(req.headers);
      var data = req.body;

      console.info(udata);
      console.info(data);

      if (!udata) {
        return res.sendStatus(401);
      }
      // verify owner id
      if (req.params.id != udata.id)
        return res.sendStatus(401);

      // all good,send message to printer if available
      var success = sserver.sendPrinterMessage(req.params.id, req.params.sn, data);

      return res.sendStatus((success ? 200 : 500));
    });

    app.get('/api/printer/register-token', function(req,res) {
      var udata = checkAuth.verifyHeader(req.headers);
      if (!udata) {
          return res.sendStatus(401);
      }

      // request register-token from socket server
      var token = sserver.requestRegisterToken();

      console.info(udata);

      return res.send(token);

    })

};
