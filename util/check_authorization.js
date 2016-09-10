var jwt = require('jsonwebtoken')
  , ac = require('../config/aws')
  , Promise = require('bluebird');

function verifyHeader(headers) {
  return new Promise(function(resolve, reject) {
    var e = new Error('Invalid authentication');
    if (headers && headers.authorization) {
      var ah = headers.authorization.split(' ');
      if (ah.length == 2) {
        var token = ah[1];
        var ud = jwt.verify(token, ac.secret);
        if (ud) resolve(ud);
        else reject(e)
      } else {
        reject(e);
      }
    } else {
      reject(e);
    }

  });
}

function verifyJwt(token) {
  return new Promise(function(resolve, reject) {
    var e = new Error('Invalid authentication');
    if (token) {
        var ud = jwt.verify(token, ac.secret);
        if (ud) resolve(ud);
        else reject(e)
    } else {
      reject(e);
    }
  });
}

module.exports = {
  verifyHeader: verifyHeader,
  verifyJwt: verifyJwt
}
