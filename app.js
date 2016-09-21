var express = require('express')
  , session = require('express-session')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , path = require('path')
  , fs = require('fs')
  , db = require('./config/database')
  , ac = require('./config/aws')
  , bodyParser = require('body-parser')
  , multer = require('multer')
  , renderMonitor = require('./render_monitor')
  , slicerMonitor = require('./slicer_monitor')
  , io = require('socket.io')()
  , EventEmitter = require("events").EventEmitter
  , channel = new EventEmitter()
  , jwt = require('jsonwebtoken')
  , socketServer = require('./socket_server')
  , colors = require('colors')
  , _ = require('underscore')
  , temp = '/tmp/'
  , pendingJobs = []
  , hat = require('hat');

io.attach(server);
app.io = io;

app.use(multer({ dest: './uploads/'}))

// all environments
app.set('port', 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(session({
  secret: '~pb~',
  resave: false,
  saveUninitialized: true
}))
app.use(bodyParser.urlencoded({extended: true}));

app.use(bodyParser.json({limit:'150mb'}));
//app.use(express.static(path.join(__dirname, 'public-build')));
app.use(express.static(path.join(__dirname, 'public')));

var routes = require('./routes')(app);

app.get('/login',  function (req, res)
{
  res.render('login', { page: 'login', session: req.session.user });
});

app.get('/logout',  function (req, res)
{
    req.session.destroy();
    res.redirect('/');
});


app.get('/', function(req, res, next)
{
//  if (!req.session.user)
//      res.redirect('/login');
//  else {
      res.render('index', {});
//  }
});

// development only
if ('development' == app.get('env')) {
  //app.use(express.errorHandler());
}

// relay internal channel messages to connected browser through socket.io

channel.on('render.completed', function(e) {
  console.info('RENDER COMPLETED, SENDING MSG ON SOCKETIO'.red);
  console.info(e);
    io.to(e.user).emit('message', { "message": "render.completed", "data":e });
});

channel.on('printer.connected', function(e) {
    console.info('in app printer.connected');
    io.to(e.user).emit('message', { "message": "printer.connected", "data":e.printer });
});

channel.on('printer.registered', function(e) {
    console.info('in app printer.registered');
    io.to(e.user).emit('message', { "message": "printer.registered", "data":e.token });
});

channel.on('printer.disconnected', function(e) {
    console.info('in app printer.disconnected');
    io.to(e.user).emit('message', { "message": "printer.disconnected", "data":e.printer });
});

channel.on('printer.message', function(e) {
  io.to(e.user).emit('message', { "message": "printer.message", "printer":e.printer, "data": e.data });
})

channel.on('job.download', function(e) {
  io.to(e.user).emit('message', { "message": "job.download", "job":e.job, "location": e.location });
})

renderMonitor.startPooling(channel);
//slicerMonitor.startPooling(channel);
//socketServer.start(channel);

// socket.io authentication
io.use(function(socket, next) {
  jwt.verify(socket.handshake.query.jwt, ac.secret, function(err, decoded){
      if (err) {
          next(new Error('Authentication error'));
      } else {
          socket.handshake.id = decoded.id;
          console.info('socket authorized');
          next();
      }
  });
});

io.sockets.on('connection', function (socket)
{
    // auto join socket to user room when connected
    
    // if user is logged in join its broadcast room
    socket.join(socket.handshake.id);
    console.info('joining room '.green, socket.handshake.id.red);

    socket.on('message', function(e) {
      console.info('message from socket.io');
    })

    // broadcast message to all users printers
    socket.on('client.broadcast', function(e) {
      console.info('client broadcast', e);
      console.info('handshake', socket.handshake.id);
      socketServer.send(socket.handshake.id, e)
    })


/*
    socket.on('printers.print-job', function(msg)
    {
      console.info("requiesting print job".red, msg);
      var printer_sock = socketServer.getPrinterSocket(socket.handshake.id, msg.id);
      if (printer_sock) {
        console.info("writing to socket ", { message: 'printer.print-job', data: msg.job } );
        printer_sock.write(JSON.stringify({ message: 'printer.print-job', data: msg.job }));
      }
    });
*/

});

module.exports = app;

server.listen(app.get('port'), function(){
  console.log('pbapp server listening on port ' + app.get('port'));
});
