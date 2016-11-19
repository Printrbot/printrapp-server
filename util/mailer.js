var Promise = require('bluebird')
  , colors = require('colors')
  , _ = require('underscore')
  , hat = require('hat')
  , AWS = require('aws-sdk')
  , ac = require('../config/aws')
  , ses = new AWS.SES();


exports.sendVerificationEmail = function(email, token) {
  return new Promise(function(resolve, reject) {
    var subject = 'Printrbot Account Verification Email';
  	var verificationLink = 'https://printrbot.cloud/user/verify?email=' + encodeURIComponent(email) + '&verify=' + token;
  	ses.sendEmail({
  		Source: "mailman@printrbot.com",
  		Destination: {
  			ToAddresses: [
  				email
  			]
  		},
  		Message: {
  			Subject: {
  				Data: subject
  			},
  			Body: {
  				Html: {
  					Data: '<html><head>'
  					+ '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'
  					+ '<title>' + subject + '</title>'
  					+ '</head><body>'
            + '<div><img src="http://printrbot.cloud/images/printrbotdotcloud.svg"/></div>'
  					+ '<p>Please <a href="' + verificationLink + '">click here to verify your email address</a> or copy & paste the following link in a browser:</p>'
  					+ '<p><a href="' + verificationLink + '">' + verificationLink + '</a></p>'
  					+ '</body></html>'
  				}
  			}
  		}
  	}, function(err, data) {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

exports.sendPasswordResetEmail = function(email, token) {
  return new Promise(function(resolve, reject) {
    var subject = 'Printrbot cloud password reset';
  	var verificationLink = 'https://printrbot.cloud/user/resetpassword?email=' + encodeURIComponent(email) + '&token=' + token;
  	ses.sendEmail({
  		Source: "mailman@printrbot.com",
  		Destination: {
  			ToAddresses: [
  				email
  			]
  		},
  		Message: {
  			Subject: {
  				Data: subject
  			},
  			Body: {
  				Html: {
  					Data: '<html><head>'
  					+ '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'
  					+ '<title>' + subject + '</title>'
  					+ '</head><body>'
            + '<div><img src="http://printrbot.cloud/images/printrbotdotcloud.svg"/></div>'
  					+ '<p>You can reset your password by clicking the link below</p>'
            + '<p>If you did not request password reset, please ignore this email.</p>'
  					+ '<br><br>'
  					+ '<a href="' + verificationLink + '">Reset password</a>'
  					+ '</body></html>'
  				}
  			}
  		}
  	}, function(err, data) {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
