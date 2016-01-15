var decoders = require('./decoders');

var config = {
    types: [
        {
            type: "image",
            decoder: decoders.imageDecode,
            sizes: [
                {name: "thumbnail", side: 80, quality: 0.8},
                {name: "small", side: 200, quality: 0.65},
                {name: "medium", side: 600, quality: 0.8},
                {name: "large", side: 1200, quality: 0.8}
            ]
        },
        {
            type: "video"
        },
        {
            type: "audio",
            decoder: decoders.audioDecode,
            sizes: [
                {name: "low", quality: 48},
                {name: "medium", quality: 92},
                {name: "high", quality: 192}
            ]
        }
    ]
};

module.exports = config;