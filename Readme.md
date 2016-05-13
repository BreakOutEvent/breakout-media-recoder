breakout-media-recoder
=================
##### Watching a folder to recode Image/Video and Audio

Installation
-----
* install ffmpeg with desired encoders (for default x264 & libfdk-aac)
* install mediainfo
* install imagemagick
* install waveform (https://github.com/andrewrk/waveform)
* configure s3 bucket or azure storage access
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

# License
breakout-media-recoder. The media recoder for BreakOut

Copyright (C) 2015-2016 Philipp Piwowarsky

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see http://www.gnu.org/licenses/