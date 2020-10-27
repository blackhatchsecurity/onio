FROM node:buster-slim


RUN mkdir /opt/app

ADD . /opt/app

WORKDIR /opt/app
RUN npm install
EXPOSE 3000

CMD ["npm start"]
