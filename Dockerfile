FROM node:buster-slim


RUN mkdir /opt/app

ADD . /opt/app

WORKDIR /opt/app

RUN cd $(npm root -g)/npm \
&& npm install fs-extra

RUN npm install 

EXPOSE 3000

CMD ["npm start"]