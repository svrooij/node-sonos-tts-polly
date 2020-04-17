FROM node:current-alpine as build-env
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY ./tsconfig.json ./tsconfig.json
COPY ./src ./src
# Build typescript to javascript in dist folder
RUN npm run tsc


FROM node:current-alpine
ENV SONOS_TTS_RUNNING_IN_CONTAINER=true
ARG BUILD_DATE=unknown
ARG BUILD_VERSION=0.0.0-development
ARG VCS_REF=not-set
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY ./README.md ./README.md
COPY --from=build-env /usr/src/app/dist ./dist
EXPOSE 5601

LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.description="TTS Server for node-sonos-ts" \
      org.label-schema.name=sonos-tts-polly \
      org.label-schema.schema-version=1.0 \
      org.label-schema.url=https://github.com/svrooij/node-sonos-tts-polly/ \
      org.label-schema.version=$BUILD_VERSION \
      org.label-schema.vcs-ref=$VCS_REF

CMD ["node", "./dist/index.js"]