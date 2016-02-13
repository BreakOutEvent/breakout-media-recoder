var watch = require('nodewatch');
var config = require('./config.json');
var async = require('async');
var mime = require('mime');
var path = require('path');
var fs = require('fs');
var decoders = require('./decoders');
var postprocess = require('./postprocess');

const todofolder = `${config.mediafolder}todo`;
const donefolder = `${config.mediafolder}done`;

var createfolder = function (folder) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
};

//create not existing possible destination folders
createfolder(config.mediafolder);
createfolder(todofolder);
createfolder(donefolder);
config.types.forEach(function (type) {
    var possibledesttype = `${donefolder}/${type.typename}/`;
    createfolder(possibledesttype);

    var originalfolder = `${donefolder}/${type.typename}/orig/`;
    createfolder(originalfolder);

    if (type.sizes) {
        type.sizes.forEach(function (size) {
            var possibledest = `${donefolder}/${type.typename}/${size.name}/`;
            createfolder(possibledest);
        });
    }
});
createfolder(`${config.mediafolder}done/audio/waveform/`);


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
watch.add(todofolder).onChange(function (file, prev, curr, action) {

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

