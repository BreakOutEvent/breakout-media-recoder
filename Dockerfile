FROM ubuntu:xenial

# Extended from https://github.com/cellofellow/ffmpeg
# Apache License Version 2.0
# original copyright Joshua Gardner

# Set Locale
RUN locale-gen en_US.UTF-8  
ENV LANG en_US.UTF-8  
ENV LANGUAGE en_US:en  
ENV LC_ALL en_US.UTF-8

# Enable Universe and Multiverse and install dependencies.
RUN echo deb http://archive.ubuntu.com/ubuntu xenial universe multiverse >> /etc/apt/sources.list;
RUN apt-get update
RUN apt-get -y install autoconf automake build-essential git mercurial cmake libass-dev libgpac-dev libtheora-dev libtool libvdpau-dev libvorbis-dev pkg-config texi2html zlib1g-dev libmp3lame-dev wget yasm openssl libssl-dev

#install recoder dependencies and nodejs
RUN apt-get -y install curl mediainfo imagemagick libpng12-dev zlib1g-dev libgroove-dev
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get -y install nodejs
RUN apt-get clean


ADD build_waveform.sh /build_waveform.sh
RUN ["/bin/bash", "/build_waveform.sh"]

# Run ffmpeg build script
ADD build_ffmpeg.sh /build_ffmpeg.sh
RUN ["/bin/bash", "/build_ffmpeg.sh"]


COPY . /src
WORKDIR /src

RUN npm install
RUN npm install -g forever

RUN mkdir -p /media

CMD ["forever", "src/index.js"]