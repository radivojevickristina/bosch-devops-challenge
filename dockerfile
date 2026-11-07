FROM node:22-trixie-slim AS build
WORKDIR /app
COPY ./package.json /app
COPY ./package-lock.json /app
RUN npm ci --omit=dev
COPY src/ ./src/

FROM gcr.io/distroless/nodejs22-debian13:nonroot AS runtime
WORKDIR /app
COPY --from=build /app /app

EXPOSE 8080
CMD ["src/server.js"]