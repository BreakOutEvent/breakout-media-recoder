var request = require('request');
var s3client = require('./s3client');
var bunyan = require('bunyan');
var path = require('path');
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
        console.log(id, size.name, res.url);
        log.info({id: id, orig: path.parse(file).base, remotename: res.remotename, url: res.url, type, size})
    });
};
