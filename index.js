var watch = require('nodewatch');
var mediainfo = require("mediainfo-q");
var config = require('./config');
var fs = require('fs');
var todofolder = "./media/todo";
const donefolder = "./media/done";

//create not existing possible destination folders
config.types.forEach(function (type) {

    var possibledesttype = `${donefolder}/${type.type}/`;

    if (!fs.existsSync(possibledesttype)) {
        fs.mkdirSync(possibledesttype);
    }

    if (type.sizes) {
        type.sizes.forEach(function (size) {
            var possibledest = `${donefolder}/${type.type}/${size.name}/`;

            if (!fs.existsSync(possibledest)) {
                fs.mkdirSync(possibledest);
            }
        });
    }
});

watch.add(todofolder).onChange(function (file, prev, curr, action) {


    console.log(action, file);
    mediainfo(file).then(function (res) {

        //if type is known
        if (res[0].tracks[0].type) {
            var filetype = res[0].tracks[0].type.toLowerCase();

            config.types.forEach(function (type) {
                if (type.type === filetype) {
                    type.decoder(file, type);
                }
            });

        } else {
            console.error("type unknown")
        }

        //ffmpeg(file).videoCodec('libx264').videoBitrate(8000).fps(30).output(`./media/done/${path.parse(file).name}.avi`).run();
    });
});