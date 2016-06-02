var watch = require('nodewatch');
var mime = require('mime');
var path = require('path');
var fs = require('fs');
var preprocess = require('./preprocess');
var config = require('../config.json');
var queues = require('./queues');

//start folder watcher
watch.add(preprocess.todofolder).onChange(function (file, prev, curr, action) {

    console.log(action, file);

    var mediaid = parseInt(path.parse(file).name.split('###')[0]);

    if (action === "new") {
        if (!isNaN(mediaid)) {
            //if type is known
            var filetype = mime.lookup(file).split('/')[0];

            if (filetype == "application") filetype = "document";

            config.types.forEach(function (type) {
                if (type.typename === filetype) {
                    if (type.typename == "image") {
                        queues.imagequeue.push({ type: type, file: file, media_id: mediaid }, function (err) {
                            if (err) console.error(err);
                        });
                    } else {
                        queues.defaultqueue.push({ type: type, file: file, media_id: mediaid }, function (err) {
                            if (err) console.error(err);
                        });
                    }
                }
            });
        } else {
            console.error("Media-ID not found: id###filename")
        }
    }
});

queues.logload();

console.log(`Media-recoder is now watching ${preprocess.todofolder}`);
