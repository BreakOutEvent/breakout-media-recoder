var request = require('request');
var s3client = require('./s3client');
var helpers = require('./helpers');
var bunyan = require('bunyan');
var path = require('path');
var jwt = require('njwt');
var config = require('./config.json');

var log = bunyan.createLogger({
    name: "s3matching",
    streams: [
        {
            level: 'info',
            path: "./log/s3matching.json"
        }
    ]
});

module.exports = function (id, file, type, size) {
    s3client.uploadFile(file).then(function (res) {

        postRequest(id, file, res.url);
        console.log(id, size.name, res.url);
        log.info({id: id, orig: path.parse(file).base, remotename: res.remotename, url: res.url, type, size})
    });
};

function postRequest(id, file, itemurl) {

    var token = jwt.create({sub: id.toString()}, config.posthook.jwt_secret, 'HS512');

    helpers.getMetaData(file).then(function (thissize) {
        request({
            method: 'post',
            body: {
                url: itemurl,
                width: thissize.width,
                height: thissize.height,
                length: thissize.length,
                size: thissize.size
            },
            headers: {
                'X-UPLOAD-TOKEN': token
            },
            json: true,
            url: `${config.posthook.url}${id}/`
        }, function (err, res, body) {
            if (err) console.error(err);
        });
    });
}