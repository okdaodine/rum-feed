FROM node:16.13.2

ADD server /server
ADD build /server/build
WORKDIR /server
RUN yarn install
RUN apt-get -y update
RUN apt-get -y install vim
RUN apt-get install -y ffmpeg
RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/*

ENV PATH="/usr/bin/ffmpeg:/usr/bin/ffprobe:${PATH}"

WORKDIR /server

EXPOSE 9000