var net = require('net')
  , port = 8080
  , db = require('./config/database')
  , ac = require('./config/aws')
  , jwt = require('jsonwebtoken')
  //, hat = require('hat')
  , colors = require('colors')
  , server = null
  , _ = require('underscore')
  , hat = require('hat')
  , printers = []
  , register_tokens = []
  , ping_timeout_ms = 120000 // 2 min
  , wait_timeout_ms = 120000
  , ping_timeout
  , wait_timeout
  , shortid = require('shortid')
  , min_fw_version = 0.2;

exports.getPrintersByUser = function(id)
{
  var usocks = _.filter(printers, function(s) {
    return s.data.uid == id;
  })

  var uprinters = _.map(usocks, function(s) {
    return s.data;
  })
  return uprinters;
}

exports.sendPrinterMessage = function(uid, sn, data)
{
  var usocket = _.find(printers, function(s) {
    return s.data.uid == uid && s.data.sn == sn;
  })

  if (!usocket)
    return false;

  usocket.write(JSON.stringify(data));
  return true;
}

exports.requestRegisterToken = function(uid) {
  var rt = _.find(register_tokens, function(s) {
    return s.uid == uid;
  })

  if (!rt) {
    rt = {uid: uid, token: hat(32,16)};
    register_tokens.push(rt);
  }

  console.info(rt);

  return rt.token;
}

exports.sendJobToPrinter = function(uid, sn, job)
{
  console.info("RECEIVED JOB:");
  console.info("UID: ", uid);
  console.info("SN: ", sn);

  var usocket = _.find(printers, function(s) {
    return s.data.uid == uid && s.data.sn == sn;
  })

  if (!usocket) {
    console.info("ERROR: could not find printer!".red);
    return false;
  }

  var gcode = (job.value) ? job.value.gcode : job.gcode;
  gcode = gcode.replace("https:","http:");
  var shortid = (job.value) ? job.value.shortid : job.shortid;
  console.info(gcode);
  console.info(shortid);

  usocket.write('{"m":"download", "gcode":"'+gcode+'", "shortid":"'+shortid+'", "autostart":true}\n');
  channel.emit('job.status', {user: usocket.data.uid, job: shortid, data: "sent"});

  /*
  _.each(printers, function(s) {
    if (s.data.uid == user_id) {
      s.write('{"m":"download", "gcode":"'+gcode+'", "shortid":"'+shortid+'", "autostart":true}\n');
    }
  })
  */
}

exports.getPrinterSocket = function(user_id, printer_id)
{
  return;
  var c = clients.get(user_id)
  if (c)
    return c.socket;
}

function processBuffer(b,sock) {

  if (b[0] != '{')
    return;

  try {
     d = JSON.parse(b);
  } catch(e) {
     // not a json, ignore it
     console.info("invalid json received... ignoring");
     console.info(">", b.red, "<");
     return;
  }

  if (d.m == 'auth') {
      console.info(b);
      // verify the token
      var decoded = jwt.verify(d.d, ac.secret, function(err, decoded) {
          console.info(decoded);
          if (err) {
              // send error back and disconnect the socket
              sock.write('{"error": "unauthorized"}');
              console.info("unauthorized");
              sock.destroy();
              //sock.authorized = false;
          } else {
            // send success message and add user id to socket.
            // next message we expect from printer is $info in order to
            // add it to the hashtable of online printers
            sock.data = {
              uid: decoded.id,
            };
            sock.authorized = true;

            sock.write('{"m":"auth", "d":true}\n');
            console.info("CLIENT CONNECTED ".green);
            console.info("Checking firmware version".blue);
            if (d.v < min_fw_version) {
              console.info("OLD FIRMWARE DETECTED, REQUIRE UPDATE".red);
              sock.write('{"m":"fwupdate", "d":"http://192.168.1.135:3000/printrclient.bin"}\n');
            } else {
              console.info("FIRMWARE OK".green);
            }
          }
      });
  }
  else if (d.m == 'register') {
    // check the register token
    var token = d.d;
    var found = _.find(register_tokens, function(t) {
      return t.token == token;
    })
    if (found) {
      // token found, grab the user info from the db and
      // generate jwt
      db.get(found.uid, {}, function(err, udata) {
          if (err) {
            // user not found... should never happen
            sock.write('{error: "Invalid registration token"}');
            sock.destroy();
          } else {
              var _user = {
                email: udata.email,
                first_name: udata.first_name,
                last_name: udata.last_name,
                id: udata.id
              }
              var jwtoken = jwt.sign(_user, ac.secret);
              sock.write('{"m":"register", "d":"'+jwtoken+'"}');
              console.info(jwt);

              // remove token from register tokens array
              register_tokens = _.reject(register_tokens, function(t) { return t.token == token});

              // broadcast message to connected browser
              channel.emit('printer.registered', {user: udata.uid, token: token});

              // let the connected printer send auth request with the jwt to connect
          }
      });

    }


  } else {
    // disconnect sockets that are not authrized and are trying
    // to call function other then 'auth'
    if (!sock.authorized) {
    	console.info('{error: "unauthorized"}');
        sock.write('{error: "unauthorized"}\n');
        //sock.destroy();
    } else {
        if (d.m != "stat")
          console.info(">: ".green, d)
        // if we received $info message from the client
        // add it to the clients online printer in hashtable
        if (d.m == '$info') {
          sock.data.sn = d.d.sn;
          sock.data.model = d.d.model;
          sock.data.ver = d.d.ver;

          // check if there is socket already registered with
          // same sn and id
          printers = _.reject(printers, function(p) { return p.data.uid == sock.data.uid && p.data.sn == sock.data.sn});
          printers.push(sock);

          console.info("added printer to socket data");
          // emit message on sock.io to connected web clients
          channel.emit('printer.connected', {user: sock.data.uid, printer: sock.data });
        }
        else if (d.m == 'M109') {
          channel.emit('printer.message', {user: sock.data.uid, printer: sock.data, data: d});
        }
    }
  }
}

exports.start = function(c)
{
    channel = c;
    server = net.createServer();
    server.listen(port);
    server.on('connection', function(sock)
    {
      console.info("theres a connection ");
      var message = "";
      sock.on('end', function() {
        console.info("SOCKET END");
        processBuffer(message, sock);
        message = "";
      });

      sock.on('data', function(data)
      {
        data = data.toString();
        //console.info("MESSAGE FROM CLIENT: ", data);

        clearTimeout(wait_timeout);
        clearTimeout(ping_timeout);

        _.each(data, function(d) {
          if (d == '\n') {
            processBuffer(message, sock);
            message = "";
          } else {
            message += d;
          }
        }, this);

        wait_timeout = setTimeout(function() {
          sock.write('{"m":"stat"}'); // ping
          ping_timeout = setTimeout(function() {
            console.info("timeout detected");
            sock.destroy(); // or stream.end();
          }, ping_timeout_ms);
        }, wait_timeout_ms);
      });

      sock.on('error', function(e) {
        console.log("ERROR:");
        console.log(e);
      });

      sock.on('close', function(data) {
          // if this is authroized socket, remove it from the hashtable
          console.log('CLOSED tcp socket with client '.red);
          console.log(data);
          console.log(sock.data);
          if (sock.data && sock.data.sn) {
            console.info("sending printer.disconnected on channel");
            printers = _.reject(printers, function(p) { return p.data.uid == sock.data.uid && p.data.sn == sock.data.sn});
            channel.emit('printer.disconnected', {user: sock.data.uid, printer: sock.data });
          }
      });
    });
}
