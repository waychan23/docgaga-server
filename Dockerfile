FROM node:8.16.2-alpine

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && apk add --no-cache git

RUN npm config set registry https://registry.npm.taobao.org && npm install -g cnpm

COPY server /workspace/server
COPY assets /workspace/assets

RUN cd /workspace/server && cnpm install
RUN cd /workspace/assets && cnpm install && npm run build

COPY ./entrypoint.sh /workspace/entrypoint.sh

VOLUME ['/workspace/server/config/runtime-conf.js']

CMD ["sh", "-c", "/workspace/entrypoint.sh"]
