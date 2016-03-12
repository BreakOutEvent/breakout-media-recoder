var request = require('request');
var s3client = require('./s3client');
var azureclient = require('./azureclient');
var helpers = require('./helpers');
var bunyan = require('bunyan');
var path = require('path');
var jsonwebtoken = require('jsonwebtoken');
var config = require('../config.json');

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
    if (config.postprocess) {
        azureclient.uploadFile(file).then(function (res) {
            postRequest(id, file, res.url, type);
            console.log(id, size.name, res.url);
            log.info({id: id, orig: path.parse(file).base, remotename: res.remotename, url: res.url, type, size})
        });
    }
};

function postRequest(id, file, itemurl, type) {

    var token = jsonwebtoken.sign({subject: id.toString()}, config.posthook.jwt_secret, {algorithm: 'HS512'});

    helpers.getMetaData(file).then(function (thissize) {
        request({
            method: 'post',
            body: {
                url: itemurl,
                width: thissize.width,
                height: thissize.height,
                length: thissize.length,
                size: thissize.size,
                type: type
            },
            headers: {
                'X-UPLOAD-TOKEN': token
            },
            json: true,
            url: `${config.posthook.url}${id}/`
        }, function (err, res, body) {
            if (err) console.error(err, body);
        });
    });
}