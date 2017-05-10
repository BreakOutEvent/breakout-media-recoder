var s3 = require('s3');
var uuidV4 = require('uuid/v4');
var path = require('path');
var config = require('../config.json');

var client = s3.createClient({
    maxAsyncS3: 20,
    s3RetryCount: 3,
    s3RetryDelay: 1000,
    multipartUploadThreshold: 20971520,
    multipartUploadSize: 15728640,
    s3Options: {
        accessKeyId: config.s3.accessKey,
        secretAccessKey: config.s3.secretAccessKey,
        region: config.s3.region
    }
});

var uploadFile = function (localfile) {
    return new Promise(function (resolve, reject) {

        var remotename = uuidV4() + path.parse(localfile).ext;
        var url = `https://s3-${config.s3.region}.amazonaws.com/${config.s3.bucketName}/${remotename}`;
        var params = {
            localFile: localfile,
            s3Params: {
                Bucket: config.s3.bucketName,
                Key: remotename
            }
        };
        var uploader = client.uploadFile(params);
        uploader.on('error', function (err) {
            console.error("unable to upload:", err.stack);
            reject();
        });
        uploader.on('progress', function () {
            //console.log("progress", uploader.progressMd5Amount, uploader.progressAmount, uploader.progressTotal);
        });
        uploader.on('end', function () {
            resolve({remotename: remotename, url: url});
        });
    });
};

module.exports = {
    uploadFile: uploadFile
};