var s3 = require('s3');
var uuid = require('node-uuid');
var path = require('path');

var uploadFile = function (client, localfile, config) {
    return new Promise(function (resolve, reject) {

        var remotename = uuid.v4() + path.parse(localfile).ext;
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
            resolve(url);
        });
    });
};

module.exports = function (config) {
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
    return {
        uploadFile: function (file) {
            return uploadFile(client, file, config);
        }
    };
};