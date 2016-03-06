var async = require('async');
var decoders = require('./decoders');
var postprocess = require('./postprocess');
var path = require('path');
var fs = require("fs");
var config = require('../config.json');
var filesprocessed = 0;

var defaultqueue = async.queue(function (task, cb) {
    var decoder;
    switch (task.type.typename) {
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
        console.log("using default queue");
        decoder(task.media_id, task.file, task.type).then(function () {
            handleorig(task);
            cb();
        }).catch(function (e) {
            console.error(e);
            cb();
        });
    } else {
        cb();
    }
}, 3);


var imagequeue = async.queue(function (task, cb) {
    if (task.type.typename == "image") {
        console.log("using image queue");
        decoders.imageDecode(task.media_id, task.file, task.type).then(function () {
            handleorig(task);
            cb();
        }).catch(function (e) {
            console.error(e);
            cb();
        });
    } else {
        cb();
    }
}, 6);

function handleorig(task) {
    var origto = `${config.mediafolder}done/${task.type.typename}/orig/${path.parse(task.file).base}`;
    fs.rename(task.file, origto, function (err) {
        if (err) console.error(err);
        filesprocessed = filesprocessed + 1;
        postprocess(task.media_id, origto, task.type.typename, {name: 'orig'})
    });
}

var loadindex = function () {
    return {imagequeue: imagequeue.length(), defaultqueue: defaultqueue.length(), filesprocessed: filesprocessed};
};

var logload = function () {
    setInterval(function () {
        console.log(loadindex());
    }, 2000);
};

module.exports = {
    logload: logload,
    defaultqueue: defaultqueue,
    imagequeue: imagequeue
};