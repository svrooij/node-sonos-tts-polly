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
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY ./README.md ./README.md
COPY --from=build-env /usr/src/app/dist ./dist
EXPOSE 5601
CMD ["node", "./dist/index.js"]