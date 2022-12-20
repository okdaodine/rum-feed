FROM node:16.13.2

ADD server /server
ADD build /server/build
WORKDIR /server
RUN yarn install
RUN apt-get -y update && apt-get -y install vim

WORKDIR /server

EXPOSE 9000