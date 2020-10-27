FROM node:buster-slim


RUN mkdir /opt/app

ADD . /opt/app

WORKDIR /opt/app

EXPOSE 3000

CMD ["npm start"]
