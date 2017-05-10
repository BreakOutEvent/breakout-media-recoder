var azure = require('azure-storage');
var uuidV4 = require('uuid/v4');
var path = require('path');
var config = require('../config.json');

var blobService = azure.createBlobService(config.azure.accountName, config.azure.accountKey);

var uploadFile = function (localfile) {
    return new Promise(function (resolve, reject) {
        var remotename = uuidV4() + path.parse(localfile).ext;

        blobService.createBlockBlobFromLocalFile(config.azure.containerName, remotename, localfile, function (err, result, response) {
            if (!err) {
                var url = `https://${config.azure.accountName}.blob.core.windows.net/${config.azure.containerName}/${remotename}`;
                resolve({ remotename: remotename, url: url });
            } else {
                console.error(err);
                reject();
            }
        });
    });
};

module.exports = {
    uploadFile: uploadFile
};