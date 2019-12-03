FROM node:8.16.2

COPY sources.list /etc/apt/sources.list

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN npm config set registry https://registry.npm.taobao.org && npm install -g cnpm

COPY server /workspace/server
COPY assets /workspace/assets

RUN cd /workspace/assets && cnpm install && npm run build && \
    rm -rf /workspace/assets/node_modules && rm -rf /workspace/assets/src
RUN cd /workspace/server && cnpm install

VOLUME ['/workspace/server/config/runtime-conf.js']

EXPOSE 3333

CMD ["node", "/workspace/server/start-up.js"]
