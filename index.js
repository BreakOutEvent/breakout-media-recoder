var watch = require('nodewatch');
var async = require('async');
var mime = require('mime');
var path = require('path');
var fs = require('fs');
var preprocess = require('./preprocess');
var config = require('./config.json');
var decoders = require('./decoders');
var postprocess = require('./postprocess');

var q = async.queue(function (task, cb) {
    var decoder;
    switch (task.type.typename) {
        case "image":
            decoder = decoders.imageDecode;
            break;

        case "video":
            decoder = decoders.videoDecode;
            break;

        case "audio":
            decoder = decoders.audioDecode;
            break;

        default:
            console.error("Typename not known");
            break
    }

    if (decoder) {
        decoder(task.media_id, task.file, task.type).then(function () {
            var origto = `${config.mediafolder}done/${task.type.typename}/orig/${path.parse(task.file).base}`;
            fs.rename(task.file, origto, function (err) {
                if (err) console.error(err);
                postprocess(task.media_id, origto, task.type.typename, {name: 'orig'})
            });
            cb();
        }).catch(function (e) {
            console.error(e);
            cb();
        });
    } else {
        cb();
    }
}, 4);


//start folder watcher
watch.add(preprocess.todofolder).onChange(function (file, prev, curr, action) {

    console.log(action, file);

    var mediaid = parseInt(path.parse(file).name.split('###')[0]);

    if (action === "new") {
        if (!isNaN(mediaid)) {
            //if type is known
            var filetype = mime.lookup(file).split('/')[0];

            config.types.forEach(function (type) {
                if (type.typename === filetype) {
                    q.push({type: type, file: file, media_id: mediaid}, function (err) {
                        if (err) console.error(err);
                    });
                }
            });
        } else {
            console.error("Media-ID not found: id###filename")
        }
    }
});

console.log(`Media-recoder is now watching ${preprocess.todofolder}`);

