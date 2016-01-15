var watch = require('nodewatch');
var config = require('./config');
var async = require('async');
var mime = require('mime');
var path = require('path');
var fs = require('fs');

const todofolder = "./media/todo";
const donefolder = "./media/done";

var createfolder = function (folder) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
};

//create not existing possible destination folders
config.types.forEach(function (type) {
    createfolder(todofolder);
    createfolder(donefolder);

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


var q = async.queue(function (task, cb) {
    task.type.decoder(task.file, task.type).then(function () {
        fs.rename(task.file, `./media/done/${task.type.type}/orig/${path.parse(task.file).base}`);
        cb();
    }).catch(function (e) {
        console.error(e);
    });
}, 4);


//start folder watcher
watch.add(todofolder).onChange(function (file, prev, curr, action) {

    console.log(action, file);

    if (action === "new") {
        //if type is known
        var filetype = mime.lookup(file).split('/')[0];

        config.types.forEach(function (type) {
            if (type.type === filetype) {
                q.push({type: type, file: file}, function (err) {
                    if (err) console.error(err);
                });
            }
        });
    }
});

