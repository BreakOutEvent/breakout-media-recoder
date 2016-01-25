var watch = require('nodewatch');
var config = require('./config');
var async = require('async');
var mime = require('mime');
var path = require('path');
var fs = require('fs');
var s3 = require('./s3client')(config);

const todofolder = "./media/todo";
const donefolder = "./media/done";

var createfolder = function (folder) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
};

//create not existing possible destination folders
createfolder(todofolder);
createfolder(donefolder);
config.types.forEach(function (type) {
    var possibledesttype = `${donefolder}/${type.type}/`;
    createfolder(possibledesttype);

    var originalfolder = `${donefolder}/${type.type}/orig/`;
    createfolder(originalfolder);

    if (type.sizes) {
        type.sizes.forEach(function (size) {
            var possibledest = `${donefolder}/${type.type}/${size.name}/`;
            createfolder(possibledest);
        });
    }
});
createfolder(`./media/done/audio/waveform/`);


var q = async.queue(function (task, cb) {
    task.type.decoder(task.media_id, task.file, task.type, s3).then(function () {
        var origto = `./media/done/${task.type.type}/orig/${path.parse(task.file).base}`;
        fs.rename(task.file, origto, function (err) {
            if (err) console.error(err);
            s3.uploadFile(origto).then(function (url) {
                //TODO DB update
                console.log(task.media_id, url);
            });
        });
        cb();
    }).catch(function (e) {
        console.error(e);
        cb();
    });
}, 4);


//start folder watcher
watch.add(todofolder).onChange(function (file, prev, curr, action) {

    console.log(action, file);

    var mediaid = parseInt(path.parse(file).name.split('###')[0]);

    if (!isNaN(mediaid) && action === "new") {
        //if type is known
        var filetype = mime.lookup(file).split('/')[0];

        config.types.forEach(function (type) {
            if (type.type === filetype) {
                q.push({type: type, file: file, media_id: mediaid}, function (err) {
                    if (err) console.error(err);
                });
            }
        });
    }
});

