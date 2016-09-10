var Jimp = require('jimp')
  , Promise = require('bluebird')
  , fs = Promise.promisifyAll(require("fs"))
  , FileRepo = require('./file_repo')
  , colors = require('colors')
  , binary = require('binary')
  , _ = require('underscore')
  , http = require('bluebird').promisifyAll(require('http'), {multiArgs: true})
  , hat = require('hat')


var imgToBuf = function(url) {
  return new Promise(function(resolve, reject) {
    var buf = new Buffer((240*270)*2);
    var c = 0;
    Jimp.read(url).then(function (image) {
      image.cover(270,240)
      image.dither565();
      for (var x=0;x<image.bitmap.width;x++) {
        for (var y=0;y<image.bitmap.height;y++) {
          var b = image.getPixelColor(x,y);
          var rgba = Jimp.intToRGBA(b);
          var _p = rgba.r << 8 | rgba.g << 3 | rgba.b >> 3;
          buf.writeUInt16LE(_p, c, 2);
          c+=2;
        }
      }
      resolve(buf);
    });
  });
}

/*
function insertJobBuffer(buf) {
  finalBuffer = Buffer.concat([finalBuffer, buf]);
  _inJobs++;
  if (_inJobs == project.total_items) {
    // done, write the buffer to file
    fs.writeFile('./idx/'+project.idx, finalBuffer);
  }
}
*/

function pipeImageToBuffer(url, buf) {
  return new Promise(function(resolve, reject) {
    http.get(url.replace("https://", "http://"), function(res) {
      var da = [];

      res.on('data', function(d) {
        da.push(d);
      })

      res.on('end', function() {
        buf = Buffer.concat(da);

        resolve(buf);
      })
    }).on('error', function(err) {
      console.info(err);
      reject(err);
    });
  })
}

module.exports.streamProjectIndex = function(res, project)
{
  return new Promise(function(resolve, reject) {

    var finalBuffer = new Buffer(0);

    // write the project file id to temp buffer
    var pb = new Buffer(73);
    pb.write('BCAF406DFF674B11870F0E74B4D44FD4', 0, 32);
    //project name - 256 bits
    pb.write(project.idx, 32, 8);
    pb.write(project.name, 40, 32);
    pb.writeInt8(project.items.length, 72);

    // image buffer
    var b = new Buffer((240*270)*2);
    pipeImageToBuffer(project.rawimage.replace("https://", "http://"), b)
    //pipeImageToBuffer(project.items[0].rawimage.replace("https://", "http://"), b)
    .then(function(_b) {
      // now we have complete project info
      // get the jobs next
      finalBuffer = Buffer.concat([pb, _b]);
      return;
    })
    .then(function() {

      var jtasks = project.items.map(function(item, k) {
        return new Promise(function(resolve, reject) {
          var bs = 8+32+128 // idx + name + url
            , ji = new Buffer(bs);

          ji.write(hat(32, 16), 0, 8); // generate job idx - may change to hard coded value in db
          ji.write(item.name, 8, 32);
          ji.write(item.src, 40, 128);

          pipeImageToBuffer(item.rawimage.replace("https://", "http://"), b)
          .then(function(_b) {
            finalBuffer = Buffer.concat([finalBuffer, ji, _b]);
            resolve()
          })
          .catch(function(err) {
            console.info(err);
            reject(err);
          })
        });
      });

      Promise.all(jtasks).then(function() {
        console.info("ALL DONE");
        // pipe the buffer to
        res.writeHead(200, {
          "Content-Type": "application/octet-stream",
          "Content-Length": finalBuffer.length
        });
        res.write(finalBuffer);
        res.end();
      });


      /*

      _.each(project.items, function(i, k) {
        var bs = 8+32+128 // idx + name + url
          , ji = new Buffer(bs);

        ji.write(i.idx, 0, 8);
        ji.write(i.name, 8, 32);
        ji.write(i.url, 40, 128);

        imgToBuf(i.image)
        .then(function(jib) {
          var tb = Buffer.concat([ji, jib]);
          insertJobBuffer(tb);
          //finalBuffer = tb;
          //console.info(finalBuffer.length);
        });
      })
    */
    })

    /*

    http.get(project.rawimage.replace("https://", "http://"), function(res) {
      .spread(function(res, body) {
        console.info('got here');
        console.info(res);
        var b = new Buffer((240*270)*2);
        res.pipe(res);
        return b;
    })
    .then(function(b) {
      // got the project image buffer, concat it with the rest of the project index
      //finalBuffer = Buffer.concat([pb, b]);
      //resolve(finalBuffer);
      //return;
      resolve(b);
      //res.pipe(b);
      //resolve();
    })
    .catch(function(err) {
      console.info(err);
      reject(err);
    })

    */
/*

    rawImgToBuf(project.rawimage)
    .then(function(imgb) {
      console.info(imgb.length);
      console.info(pb.length);

      finalBuffer = Buffer.concat([pb, imgb]);

      console.info(finalBuffer.length);

      _.each(project.items, function(i, k) {
        var bs = 8+32+128 // idx + name + url
          , ji = new Buffer(bs);

        ji.write(i.idx, 0, 8);
        ji.write(i.name, 8, 32);
        ji.write(i.url, 40, 128);

        imgToBuf(i.image)
        .then(function(jib) {
          var tb = Buffer.concat([ji, jib]);
          insertJobBuffer(tb);
          //finalBuffer = tb;
          //console.info(finalBuffer.length);
        });
      })
    })

*/

    // -------------------------------------------------------------------------

    //res.json(project);
    //resolve();
    //return;

    /*
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
*/
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
