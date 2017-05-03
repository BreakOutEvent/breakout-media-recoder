var request = require('request');
var s3client = require('./s3client');
var azureclient = require('./azureclient');
var helpers = require('./helpers');
var bunyan = require('bunyan');
var path = require('path');
var fs = require('fs');
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
            postRequest(id, file, res.url, type).then(function (msg) {
                console.log(msg)
            }).catch(function (e) {
                console.error("ERROR", e);
            });
            console.log(id, size.name, res.url);
            log.info({ id: id, orig: path.parse(file).base, remotename: res.remotename, url: res.url, type, size })
        });

        if (size.name === "orig") {
            owncloudUpload(file);
        }
    }
};

function postRequest(id, file, itemurl, type) {

    return new Promise(function (resolve, reject) {
        var token = jsonwebtoken.sign({ subject: id.toString() }, config.posthook.jwt_secret, { algorithm: 'HS512' });
        helpers.getMetaData(file).then(function (thissize) {
            setTimeout(function () {
                var options = {
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
                };

                console.log("Sending item to backend with options "+JSON.stringify(options));
                request(options, function (err, res, body) {
                    if (err) {
                        console.error(err, body);
                        reject(err);
                    } else {
                        if (res.statusCode === 201) {
                            resolve("backend accepted");
                        } else {

                            //Retry once if failed
                            setTimeout(function () {
                                request(options, function (err, res, body) {
                                    if (err) {
                                        console.error(err, body);
                                        reject(err);
                                    } else {
                                        if (res.statusCode === 201) {
                                            resolve("backend accepted");
                                        } else {
                                            reject(`status: ${res.statusCode}`);
                                        }
                                    }
                                });
                            }, Math.floor(Math.random() * 1000) + 200);

                        }
                    }
                });
            }, Math.floor(Math.random() * 500) + 100);
        }).catch(function (e) {
            reject(`Metadata Error! ${e}`);
        });
    });
}

function owncloudUpload(file) {

    var remotefilename = encodeURIComponent(path.parse(file).base);
    var owncloudpath = `${config.owncloud.host}${config.owncloud.remoteFolder}${remotefilename}`;

    fs.createReadStream(file).pipe(request.put(owncloudpath).auth(config.owncloud.username, config.owncloud.password, true));
}