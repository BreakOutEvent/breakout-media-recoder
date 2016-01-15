var ffmpeg = require('fluent-ffmpeg');
var im = require('imagemagick');
var path = require('path');

var imageDecode = function (file, type) {
    type.sizes.forEach(function (size) {
        var output = `./media/done/${type.type}/${size.name}/${path.parse(file).name}.jpg`;
        im.resize({
            srcPath: file,
            dstPath: output,
            width: size.side,
            format: 'jpg',
            quality: size.quality
        }, function (err, stdout, stderr) {
            if (err) throw err;
            console.log(`resized ${path.parse(file).base} to fit within ${size.side}px`);
        });
    });
};

module.exports = {
    imageDecode: imageDecode
};