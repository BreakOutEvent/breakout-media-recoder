var ffmpeg = require('fluent-ffmpeg');
var im = require('imagemagick');
var path = require('path');
var waveform = require('waveform');
var config = require('../config.json');
var helpers = require('./helpers');
var postprocess = require('./postprocess');

var imageDecode = function (id, file, type) {
    return new Promise(function (resolve, reject) {
        helpers.getSize(file).then(function (thissize) {
            var promises = [];

            type.sizes.forEach(function (size) {
                promises.push(new Promise(function (resolve, reject) {
                    if ((thissize.width * 1.1) >= size.side || (thissize.height * 1.1) >= size.side) {
                        var output = `${config.mediafolder}done/${type.typename}/${size.name}/${path.parse(file).name}.jpg`;
                        var destsize = helpers.getSizeCalc(thissize, size.side);

                        im.resize({
                            srcPath: file,
                            dstPath: output,
                            width: destsize.width,
                            height: destsize.height,
                            format: 'jpg',
                            quality: size.quality,
                            customArgs: ['-auto-orient']
                        }, function (err, stdout, stderr) {
                            if (err) {
                                console.error(err);
                                reject();
                            }
                            console.log(`image file "${path.parse(file).base}" resized to fit within ${size.side}px`);
                            postprocess(id, output, type.typename, size);
                            resolve(output);
                        });
                    } else {
                        console.log(`skipping "${path.parse(file).base}": ${size.name}`);
                        resolve();
                    }
                }));
            });

            Promise.all(promises).then(function (files) {
                resolve(files);
            }).catch(function (e) {
                reject(e);
            });
        }).catch(function (e) {
            reject(e);
        });
    });

};


var audioDecode = function (id, file, type) {
    var promises = [];

    type.sizes.forEach(function (size) {

        promises.push(new Promise(function (resolve, reject) {

            var output = `${config.mediafolder}done/${type.typename}/${size.name}/${path.parse(file).name}.mp3`;
            var decoder = ffmpeg(file).audioCodec(size.audiocodec).audioBitrate(size.bitrate).audioChannels(2).audioFrequency(44100).output(output);

            decoder.on('end', function () {
                console.log(`audio file "${path.parse(file).base}" converted to ${size.bitrate}kbit/s`);

                //waveform from max bitrate
                var maxbitrate = 0;
                type.sizes.forEach(function (size) {
                    if (size.bitrate > maxbitrate) {
                        maxbitrate = size.bitrate;
                    }
                });

                if (size.bitrate == maxbitrate) {
                    audioWaveform(output).then(function (file) {
                        postprocess(id, file, 'image', { name: 'waveform' });
                    });
                }

                postprocess(id, output, type.typename, size);
                resolve(output);
            });

            decoder.on('error', function (err, stdout, stderr) {
                console.error(err);
                reject();
            });

            decoder.run();

        }));
    });

    return Promise.all(promises)
};

var videoDecode = function (id, file, type) {
    return new Promise(function (resolve, reject) {
        helpers.getSize(file).then(function (thissize) {
            var promises = [];

            //create video thumbnail in do-folder
            ffmpeg(file).outputOptions(['-ss 00:00:01.000', '-vframes 1']).output(`${config.mediafolder}todo/${path.parse(file).name}.jpg`).run();

            type.sizes.forEach(function (size) {
                promises.push(new Promise(function (resolve, reject) {
                    if ((thissize.width * 1.1) >= size.side) {

                        var decoder;
                        var output;

                        if (size.videocodec === "libx264") {
                            output = `${config.mediafolder}done/${type.typename}/${size.name}/${path.parse(file).name}.mp4`;
                            decoder = ffmpeg(file).videoCodec(size.videocodec).size(`${size.side}x?`)
                                .audioCodec(size.audiocodec).audioBitrate(size.audiobitrate).audioChannels(2).audioFrequency(44100).videoBitrate(size.videobitrate).outputOptions(['-cpu-used 2', '-threads 2', '-profile:v high', '-level 4.2', '-pix_fmt yuv420p']).output(output);
                        } else {
                            output = `${config.mediafolder}done/${type.typename}/${size.name}/${path.parse(file).name}.webm`;
                            decoder = ffmpeg(file).videoCodec(size.videocodec).size(`${size.side}x?`).audioCodec(size.audiocodec).audioBitrate(size.audiobitrate)
                                .audioChannels(2).audioFrequency(44100).videoBitrate(size.videobitrate).outputOptions(['-cpu-used 2', '-threads 2', '-deadline good', '-g 20']).output(output);
                        }

                        var hadprogress = 0;

                        decoder.on('progress', function (progress) {
                            progress = parseInt(progress.percent);
                            if ((progress != hadprogress) && progress % 5 == 0) {
                                console.log(`video file "${path.parse(file).base}" processing ${size.name} ${progress}'% done`);
                                hadprogress = progress;
                            }
                        });

                        decoder.on('start', function () {
                            console.log("started decode");
                        });

                        decoder.on('end', function () {
                            console.log(`video file "${path.parse(file).base}" converted to ${size.videobitrate}kbit/s`);
                            postprocess(id, output, type.typename, size);
                            resolve(output);
                        });

                        decoder.on('error', function (err, stdout, stderr) {
                            console.error(err);
                            console.error(stdout);
                            console.error(stderr);
                            reject();
                        });

                        decoder.run();

                    } else {
                        console.log(`skipping "${path.parse(file).base}": ${size.name}`);
                        resolve();
                    }
                }));
            });
            Promise.all(promises).then(function (files) {
                resolve(files);
            }).catch(function (e) {
                reject(e);
            });
        }).catch(function (e) {
            reject(e);
        });
    });
};

//https://github.com/andrewrk/waveform
//sudo apt-get install libgroove-dev libpng12-dev zlib1g-dev
var audioWaveform = function (file) {
    return new Promise(function (resolve, reject) {
        var output = `${config.mediafolder}done/audio/waveform/${path.parse(file).name}.png`;
        waveform(file, {
            png: output,
            'png-width': 500,
            'png-height': 200,
            'png-color-bg': '00000000',
            'png-color-center': '4c4c4cff',
            'png-color-outer': '000000ff'
        }, function (err) {
            if (err) {
                console.error(err);
                reject();
            }
            console.log(`created waveform ${output}`);
            resolve(output);
        });
    });
};

module.exports = {
    imageDecode: imageDecode,
    audioDecode: audioDecode,
    videoDecode: videoDecode
};