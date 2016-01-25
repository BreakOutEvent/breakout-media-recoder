media-recode-watcher
=================
##### Watching a folder to recode Image/Video and Audio

Installation
-----
* install ffmpeg with desired encoders (for default x264 & libfdk-aac)
* install mediainfo
* install imagemagic
* install waveform (https://github.com/andrewrk/waveform)
* configure s3 bucket access
* npm install
* npm start


Usage
-----
* Files are identified by their media-id inside the filename `id###name.ext`


####AWS allow read config:
```
{
    "Version": "2008-10-17",
    "Statement": [
		{
			"Sid": "AllowPublicRead",
			"Effect": "Allow",
			"Principal": {
				"AWS": "*"
			},
			"Action": "s3:GetObject",
			"Resource": "arn:aws:s3:::bucket-name/*"
		}
	]
}
```

License
-----
MIT