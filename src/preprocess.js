var config = require('../config.json');
var fs = require('fs');

const todofolder = `${config.mediafolder}todo`;
const donefolder = `${config.mediafolder}done`;

var createfolder = function (folder) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
};

//create not existing possible destination folders
createfolder(config.mediafolder);
createfolder("./log/");
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

module.exports = {
    todofolder: todofolder,
    donefolder: donefolder
};