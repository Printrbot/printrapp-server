var db = require('../config/database')
  , sha1 = require('sha1')
  , awsc = require('../config/aws')
  , hat = require('hat')
  , color = require('colors')
  , _ = require('underscore')
  , jwt = require('jsonwebtoken')


module.exports = function(app)
{
    app.post('/api/login', function(req, res)
    {
        if (!req.body.email || !req.body.passwd)
            return res.sendStatus(401);

        db.view("users", "list", {keys: [req.body.email]}, function(err, data)
        {
            if (err) {
                return res.sendStatus(401);
            }

            if (data.rows.length > 0) {
              var u = data.rows[0].value;

              if (sha1(req.body.passwd + awsc.secret) == u.password && u.active == true)
              {
                var _user = {
                    email: data.rows[0].value.email,
                    first_name: data.rows[0].value.first_name,
                    last_name: data.rows[0].value.last_name,
                    id: data.rows[0].id
                  }

                  var token = jwt.sign(_user, awsc.secret);
                  res.json({'jwt':token});
              } else {
                  return res.sendStatus(401);
              }
            } else {
                return res.sendStatus(401);
            }
        });
    });

    app.post('/api/register', function(req, res)
    {
        // verify that we have all required fields
        var required = ['first_name', 'last_name', 'email', 'password'];
        var valid = true;
        _.each(required, function(r) {
          if (!req.body[r])
            valid = false;
        }, this)

        if (!valid) {
          return res.sendStatus(400);
        }

        function firstUpper(string) {
          string = string.toLowerCase();
          return string.charAt(0).toUpperCase() + string.slice(1);
        }

        var first_name = firstUpper(req.body.first_name)
          , last_name = firstUpper(req.body.last_name)
          , email = req.body.email.toLowerCase();


        // verify email format and password length
        var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
        if (!re.test(email))
          return res.json({ status: 'error', message: 'Invalid email format' });

        if (req.body.password.length < 4)
          return res.json({ status: 'error', message: 'Password must be at least 4 characters long' });

        // make sure that email is not registered already...
        db.view("users", "list", {keys: [email]}, function(err, data)
        {
          console.info(req.body);
            if (err) {
                console.info(err.red);
                return res.sendStatus(500);
            }

            if (data.rows.length == 0) {
                var ud = {
                  email: email,
                  first_name: first_name,
                  last_name: last_name,
                  password: sha1(req.body.password + awsc.secret),
                  type: 'user',
                  active: true
                }

                // create user
                db.insert(ud, [], function(err, _user) {
                  if (err) {
                    console.info(err.red);
                    return res.sendStatus(500);
                  } else {
                    // success
                    ud.id = _user.id;
                    console.info(ud);
                    return res.json({status:'success'})
                  }
                })

            } else {
                res.json({ status: 'error', message: 'User already registered' });
            }
        });
    });

    app.get('/join', function(req,res)
    {
        res.render('join', {page: 'join'});
    });
};
