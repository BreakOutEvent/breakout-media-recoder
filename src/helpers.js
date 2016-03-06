var mediainfo = require("mediainfo-q");
var fs = require("fs");

var getSize = function (file) {
    return new Promise(function (resolve, reject) {
        mediainfo(file).then(function (res) {

            var size = {width: 0, height: 0};
            if (res[0].tracks[0].width) size.width = parseInt(res[0].tracks[0].width.replace(/[^0-9]/, ''));
            if (res[0].tracks[0].height) size.height = parseInt(res[0].tracks[0].height.replace(/[^0-9]/, ''));

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

var getMetaData = function (file) {
    return new Promise(function (resolve, reject) {
        mediainfo(file).then(function (res) {

            var size = {width: 0, height: 0, length: 0, size: 0};
            if (res[0].tracks[0].width) size.width = parseInt(res[0].tracks[0].width.replace(/[^0-9]/, ''));
            if (res[0].tracks[0].height) size.height = parseInt(res[0].tracks[0].height.replace(/[^0-9]/, ''));

            if (res[0].tracks[0].duration) {
                var duration = res[0].tracks[0].duration.match(/((\d+)mn\s)?(\d+)s/);
                if (duration[2]) size.length += parseInt(duration[2]) * 60;
                if (duration[3]) size.length += parseInt(duration[3]);
            }

            var stats = fs.statSync(file);
            if (stats.size) size.size = stats.size;

            console.log(size);
            resolve(size);
        }).catch(function (e) {
            reject(e);
        });
    });
};

module.exports = {
    getSize: getSize,
    getSizeCalc: getSizeCalc,
    getMetaData: getMetaData
};