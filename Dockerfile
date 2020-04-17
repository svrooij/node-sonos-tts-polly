FROM node:current-alpine as install
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

FROM install as compile
RUN npm install
COPY ./src/ ./src/
COPY tsconfig.json ./
RUN npm run prepack

FROM node:current-alpine as combiner
WORKDIR /usr/src/app
COPY --from=install /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=install /usr/src/app/package.json /usr/src/app/package.json
COPY --from=compile /usr/src/app/dist /usr/src/app/dist
COPY ./README.md ./README.md

FROM node:current-alpine
ENV SONOS_TTS_RUNNING_IN_CONTAINER=true
ARG BUILD_DATE=unknown
ARG BUILD_VERSION=0.0.0-development
ARG VCS_REF=not-set
WORKDIR /usr/src/app

COPY --from=combiner /usr/src/app /usr/src/app
EXPOSE 5601

LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.description="TTS Server for node-sonos-ts" \
      org.label-schema.name=sonos-tts-polly \
      org.label-schema.schema-version=1.0 \
      org.label-schema.url=https://github.com/svrooij/node-sonos-tts-polly/ \
      org.label-schema.version=$BUILD_VERSION \
      org.label-schema.vcs-ref=$VCS_REF

CMD ["node", "./dist/index.js"]