FROM node:22-alpine AS build
WORKDIR /app
COPY ./package.json /app
COPY ./package-lock.json /app
RUN npm ci --omit=dev
COPY src/ ./src/

FROM alpine:3.24  AS runtime
RUN apk add --no-cache libatomic libstdc++
WORKDIR /app
COPY --from=build /usr/local/bin/node /usr/local/bin/node
COPY --from=build /app /app

EXPOSE 8080
USER 10001:10001
CMD ["node", "src/server.js"]

