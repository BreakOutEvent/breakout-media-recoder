#!/bin/bash

git clone https://github.com/andrewrk/waveform
cd waveform/
make
mv waveform ~/bin/
source ~/.profile