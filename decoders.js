var ffmpeg = require('fluent-ffmpeg');
var im = require('imagemagick');
var path = require('path');
var mediainfo = require("mediainfo-q");

var getSize = function (file) {
    return new Promise(function (resolve, reject) {
        mediainfo(file).then(function (res) {
            var size = {width: 0, height: 0};
            size.width = parseInt(res[0].tracks[0].width.replace(/[^0-9]/, ''));
            size.height = parseInt(res[0].tracks[0].height.replace(/[^0-9]/, ''));
            console.log(size);
            resolve(size);
        }).catch(function (e) {
            reject(e);
        });
    });
};

var getSizeCalc = function (size, biggerside) {
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
    return size;
};


var imageDecode = function (file, type) {

    return new Promise(function (resolve, reject) {
        getSize(file).then(function (thissize) {
            var promises = [];

            type.sizes.forEach(function (size) {
                promises.push(new Promise(function (resolve, reject) {
                    var output = `./media/done/${type.type}/${size.name}/${path.parse(file).name}.jpg`;
                    var destsize = getSizeCalc(thissize, size.side);

                    im.resize({
                        srcPath: file,
                        dstPath: output,
                        width: destsize.width,
                        height: destsize.height,
                        format: 'jpg',
                        quality: size.quality
                    }, function (err, stdout, stderr) {
                        if (err) {
                            console.error(err);
                            reject();
                        }
                        console.log(`image file "${path.parse(file).base}" resized to fit within ${size.side}px`);
                        resolve();
                    });
                }));
            });

            Promise.all(promises).then(function () {
                resolve();
            }).catch(function (e) {
                reject(e);
            });
        }).catch(function (e) {
            reject(e);
        });
    });

};


var audioDecode = function (file, type) {
    var promises = [];

    type.sizes.forEach(function (size) {

        promises.push(new Promise(function (resolve, reject) {

            var output = `./media/done/${type.type}/${size.name}/${path.parse(file).name}.mp3`;
            var decoder = ffmpeg(file).audioCodec('libmp3lame').audioBitrate(size.bitrate).audioChannels(2).audioFrequency(44100).output(output);

            decoder.on('end', function () {
                console.log(`audio file "${path.parse(file).base}" converted to ${size.bitrate}kbit/s`);
                resolve();
            });

            decoder.on('error', function (err, stdout, stderr) {
                console.error(err);
                reject();
            });

            decoder.run();

        }));
    });

    return Promise.all(promises);
};

var videoDecode = function (file, type) {
    return new Promise(function (resolve, reject) {
        getSize(file).then(function (thissize) {
            var promises = [];


            type.sizes.forEach(function (size) {
                promises.push(new Promise(function (resolve, reject) {
                    if (thissize.width >= size.side) {

                        var output = `./media/done/${type.type}/${size.name}/${path.parse(file).name}.webm`;
                        var decoder = ffmpeg(file).videoCodec('libvpx-vp9').size(`${size.side}x?`).audioCodec('libvorbis').audioBitrate(size.audiobitrate).audioChannels(2).audioFrequency(44100).videoBitrate(size.videobitrate).outputOptions(['-cpu-used 2', '-threads 2']).output(output);

                        var hadprogress = 0;

                        decoder.on('progress', function (progress) {
                            var progress = parseInt(progress.percent);
                            if (progress != hadprogress) {
                                console.log(`video file "${path.parse(file).base}" processing ${size.name} ${progress}'% done`);
                                hadprogress = progress;
                            }
                        });

                        decoder.on('end', function () {
                            console.log(`video file "${path.parse(file).base}" converted to ${size.videobitrate}kbit/s`);
                            resolve();
                        });

                        decoder.on('error', function (err, stdout, stderr) {
                            console.error(err);
                            reject();
                        });

                        decoder.run();


                    } else {
                        console.log(`skipping "${path.parse(file).base}": ${size.name}`)
                        resolve();
                    }
                }));
            });
            Promise.all(promises).then(function () {
                resolve();
            }).catch(function (e) {
                reject(e);
            });
        }).catch(function (e) {
            reject(e);
        });
    });
};

module.exports = {
    imageDecode: imageDecode,
    audioDecode: audioDecode,
    videoDecode: videoDecode
};