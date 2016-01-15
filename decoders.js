var ffmpeg = require('fluent-ffmpeg');
var im = require('imagemagick');
var path = require('path');

var getSize = function (mediainfo, biggerside) {
    var size = {width: 0, height: 0};
    size.width = parseInt(mediainfo.width.replace(/[^0-9]/, ''));
    size.height = parseInt(mediainfo.height.replace(/[^0-9]/, ''));

    console.log("filesize", size);

    var factor = 1;

    if (size.height > size.width) {
        factor = biggerside / size.height;
        size.height = biggerside;
        size.width = parseInt(size.width * factor);
    } else {
        factor = biggerside / size.width;
        size.width = biggerside;
        size.height = parseInt(size.height * factor);
    }

    console.log("filesize", size);

    return size;
};


var imageDecode = function (file, mediainfo, type) {
    type.sizes.forEach(function (size) {
        var output = `./media/done/${type.type}/${size.name}/${path.parse(file).name}.jpg`;

        var destsize = getSize(mediainfo, size.side);

        im.resize({
            srcPath: file,
            dstPath: output,
            width: destsize.width,
            height: destsize.height,
            format: 'jpg',
            quality: size.quality
        }, function (err, stdout, stderr) {
            if (err) console.error(err);
            console.log(`image file "${path.parse(file).base}" resized to fit within ${size.side}px`);
        });
    });
};


var audioDecode = function (file, mediainfo, type) {
    type.sizes.forEach(function (size) {
        var output = `./media/done/${type.type}/${size.name}/${path.parse(file).name}.mp3`;
        var decoder = ffmpeg(file).audioCodec('libmp3lame').audioBitrate(size.bitrate).audioChannels(2).audioFrequency(44100).output(output);

        decoder.on('end', function () {
            console.log(`audio file "${path.parse(file).base}" converted to ${size.bitrate}kbit/s`);
        });

        decoder.on('error', function (err, stdout, stderr) {
            console.error(err);
        });

        decoder.run();

    });
};

var videoDecode = function (file, mediainfo, type) {
    type.sizes.forEach(function (size) {

        var output = `./media/done/${type.type}/${size.name}/${path.parse(file).name}.webm`;
        var decoder = ffmpeg(file).videoCodec('libvpx-vp9').size(`${size.side}x?`).audioCodec('libvorbis').audioBitrate(size.audiobitrate).audioChannels(2).audioFrequency(44100).videoBitrate(size.videobitrate).outputOptions(['-cpu-used 2', '-threads 2']).output(output);

        decoder.on('progress', function (progress) {
            console.log(`video file "${path.parse(file).base}" processing ${size.name} ${parseInt(progress.percent)}'% done`);
        });

        decoder.on('end', function () {
            console.log(`video file "${path.parse(file).base}" converted to ${size.videobitrate}kbit/s`);
        });

        decoder.on('error', function (err, stdout, stderr) {
            console.error(err);
        });

        decoder.run();

    });
};

module.exports = {
    imageDecode: imageDecode,
    audioDecode: audioDecode,
    videoDecode: videoDecode
};