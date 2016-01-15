var watch = require('nodewatch');
var mediainfo = require("mediainfo-q");
var ffmpeg = require('fluent-ffmpeg');
var path = require('path');

watch.add("./media/todo").onChange(function(file,prev,curr,action){
    mediainfo(file).then(function(res){
        console.log(res[0].tracks[0]);
        if(res[0].tracks[0].type == "Video"){
            ffmpeg(file).videoCodec('libx264').videoBitrate(8000).fps(30).output(`./media/done/${path.parse(file).name}.avi`).run();
        }
    });
});