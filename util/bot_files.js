var Jimp = require('jimp')
  , Promise = require('bluebird')
  , fs = Promise.promisifyAll(require("fs"))
  , FileRepo = require('./file_repo')
  , colors = require('colors')
  , binary = require('binary')
  , _ = require('underscore')
  , request = require('request')

module.exports.streamProjectIndex = function(res, project)
{
  return new Promise(function(resolve, reject) {

    console.info("STARTING STREAM");

    // format:
    // - magic number (32 bytes)
    //

    // insert magic number
    var m = new Buffer(32);
    m.write("1FE91732E5204EB5895B7169ED70BE02", 'utf8');
    res.write(m);
    // project id
    var id = new Buffer(32);
    id.write(project._id, 'utf8');
    res.write(id);
    // project name
    var t = new Buffer(32);
    t.write(project.name, 'utf8');
    res.write(t);
    // preview image

    var stream = request(project.rawimage).pipe(res);
    stream.on('finish', function () {
      console.info("DONE");
      res.end();
    });

//res.send(m.toString());
/*
    binary.parse(m)
    .word32bs('magic')
    .tap(function(vars) {
      res.json(vars);
    })
*/
    //res.send(m);

    //
  });

}
