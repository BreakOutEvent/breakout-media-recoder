var request = require('request');
var s3client = require('./s3client');

module.exports = function (id, file, type, size) {
    s3client.uploadFile(file).then(function (url) {
        console.log(id, size.name, url);
    });
};
