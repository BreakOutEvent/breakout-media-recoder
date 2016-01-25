var ffmpeg = require('fluent-ffmpeg');
var im = require('imagemagick');
var path = require('path');
var mediainfo = require("mediainfo-q");
var waveform = require('waveform');

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

var uploadS3 = function (id, file, type, size, s3) {
    s3.uploadFile(file).then(function (url) {
        //TODO DB update
        console.log(id, url);
    });
};


var imageDecode = function (id, file, type, s3) {

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
                        uploadS3(id, output, type.type, size.name, s3);
                        resolve(output);
                    });
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


var audioDecode = function (id, file, type, s3) {
    var promises = [];

    type.sizes.forEach(function (size) {

        promises.push(new Promise(function (resolve, reject) {

            var output = `./media/done/${type.type}/${size.name}/${path.parse(file).name}.mp3`;
            var decoder = ffmpeg(file).audioCodec('libmp3lame').audioBitrate(size.bitrate).audioChannels(2).audioFrequency(44100).output(output);

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
                        uploadS3(id, file, 'image', 'waveform', s3);
                    });
                }

                uploadS3(id, output, type.type, size.name, s3);
                resolve(output);
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

var videoDecode = function (id, file, type, s3) {
    return new Promise(function (resolve, reject) {
        getSize(file).then(function (thissize) {
            var promises = [];

            //create video thumbnail in do-folder
            ffmpeg(file).outputOptions(['-ss 00:00:01.000', '-vframes 1']).output(`./media/todo/${path.parse(file).name}.jpg`).run();

            type.sizes.forEach(function (size) {
                promises.push(new Promise(function (resolve, reject) {
                    if (thissize.width >= size.side) {

                        var output = `./media/done/${type.type}/${size.name}/${path.parse(file).name}.mp4`;
                        var decoder = ffmpeg(file).videoCodec('libx264').size(`${size.side}x?`).audioCodec('libfdk_aac').audioBitrate(size.audiobitrate).audioChannels(2).audioFrequency(44100).videoBitrate(size.videobitrate).outputOptions(['-cpu-used 2', '-threads 2', '-profile:v high', '-level 4.2']).output(output);

                        var hadprogress = 0;

                        decoder.on('progress', function (progress) {
                            progress = parseInt(progress.percent);
                            if ((progress != hadprogress) && progress % 5 == 0) {
                                console.log(`video file "${path.parse(file).base}" processing ${size.name} ${progress}'% done`);
                                hadprogress = progress;
                            }
                        });

                        decoder.on('end', function () {
                            console.log(`video file "${path.parse(file).base}" converted to ${size.videobitrate}kbit/s`);
                            uploadS3(id, output, type.type, size.name, s3);
                            resolve(output);
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
        var output = `./media/done/audio/waveform/${path.parse(file).name}.png`;
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
    videoDecode: videoDecode,
    audioWaveform: audioWaveform
};