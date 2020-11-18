FROM node:12.8.1-slim

ENV APP_ROOT /opt/Re_ConEd
RUN mkdir -p $APP_ROOT
WORKDIR $APP_ROOT

RUN apt-get update || : && apt-get install python -y

RUN npm install -g yarn

RUN export npm_config_target_libc=glibc

RUN npm install -g grpc-tools --unsafe-perm

COPY package.json $APP_ROOT/package.json
COPY yarn.lock $APP_ROOT/yarn.lock
COPY node_modules/ $APP_ROOT/node_modules/
RUN yarn install && apt-get update && apt-get -y install libfontconfig &&\
        apt-get -y  install  gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

COPY scripts/* $APP_ROOT/scripts/
RUN chmod +x $APP_ROOT/scripts/*
CMD bash /opt/Re_ConEd/scripts/start_react_server.sh
