FROM ubuntu:xenial

RUN apt-get update
RUN apt-get upgrade -y

# Set Locale
RUN locale-gen en_US.UTF-8  
ENV LANG en_US.UTF-8  
ENV LANGUAGE en_US:en  
ENV LC_ALL en_US.UTF-8

# Run ffmpeg build script
ADD build_ffmpeg.sh /build_ffmpeg.sh
RUN ["/bin/bash", "/build_ffmpeg.sh"]

#install recoder dependencies and nodejs
RUN apt-get -y install git curl mediainfo imagemagick libpng12-dev zlib1g-dev libgroove-dev
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get -y install nodejs
RUN apt-get clean

ADD build_waveform.sh /build_waveform.sh
RUN ["/bin/bash", "/build_waveform.sh"]

COPY . /src
WORKDIR /src

RUN npm install
RUN npm install -g forever

RUN mkdir -p /media

RUN export PATH=$PATH:$HOME/bin
ENV PATH /root/bin:$PATH

CMD ["forever", "src/index.js"]