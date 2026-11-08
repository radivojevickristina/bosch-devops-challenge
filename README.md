# Bosch DevOps Challenge — Visit Counter

[![Build and Test](https://github.com/radivojevickristina/bosch-devops-challenge/actions/workflows/ci.yml/badge.svg)](https://github.com/radivojevickristina/bosch-devops-challenge/actions/workflows/ci.yml)

## Overview

This is a simple visit counter application built with Node.js, Express, and Redis. It exposes three HTTP endpoints, stores the visit count in Redis, and checks Redis availability. 

## Architecture

    HTTP client (browser / curl)
               |
               v
      Node.js / Express (app)
               |
          INCR / PING
               v
       Redis (internal network)
               |
           AOF files
               v
       redis_data (Docker volume)

Docker Compose runs the application and Redis on the same internal network. Only the application port is published to the host.

## Tech Stack

- **Node.js** — JavaScript runtime used to run the application.
- **Express** — Handles HTTP requests and API endpoints.
- **Redis** — Stores and increments the visit counter.
- **Docker** — Containerizes the application.
- **Docker Compose** — Runs and connects the application and Redis services.
- **GitHub Actions** — Automates linting, testing, and Docker image builds.
- **ESLint** — Performs static code analysis.
- **Node.js Test Runner and Supertest** — Test API endpoints using a mocked Redis client.
- **Trivy** — Scans the Docker image for known vulnerabilities.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Returns a welcome message and the hostname of the running instance. |
| `GET` | `/visits` | Atomically increments the counter in Redis and returns its value. |
| `GET` | `/health` | Checks Redis connectivity using `PING`. |

Example responses: `{"message":"Hello DevOps","host":"container-hostname"}`, `{"visits":3}`, and `{"status":"ok"}`.

The `/visits` endpoint uses the Redis `INCR` command. If Redis is unavailable, `/visits` returns HTTP `503` with `{"error":"Redis unavailable"}`. The `/health` endpoint returns HTTP `200` with `{"status":"ok"}` when Redis responds with `PONG`, or HTTP `503` with `{"status":"error"}` otherwise.

The application logs each completed request's HTTP method, URL, and response status to standard output.

## Prerequisites and Getting Started

**Prerequisites:** Git and Docker Desktop (or Docker Engine with Docker Compose). Node.js and npm are only required to run tests or lint locally outside Docker.

1. **Clone the repository:** Run `git clone https://github.com/radivojevickristina/bosch-devops-challenge.git`, then `cd bosch-devops-challenge`.
2. **Create the environment file:** Run `cp .env.example .env` (on Windows PowerShell, use `Copy-Item .env.example .env`).
3. **Build and start the services:** Run `docker compose up -d --build`.
4. **Check the containers:** Run `docker compose ps`.
5. **Test the endpoints:** Run `curl http://localhost:8080/`, `curl http://localhost:8080/visits`, and `curl http://localhost:8080/health`  (`curl.exe` in Windows PowerShell).
6. **Stop the services:** Run `docker compose down`.

The default port in `.env.example` is `8080`. Running `docker compose down` without `-v` preserves the named Redis volume.

### Environment Configuration

| Variable | Example | Description |
|---|---|---|
| `APP_PORT` | `8080` | HTTP server port. |
| `REDIS_HOST` | `redis` | Redis service hostname inside Docker Compose. |
| `REDIS_PORT` | `6379` | Redis port. |

The `.env.example` file provides the required configuration. The actual `.env` file is excluded from version control. The Node.js application binds to `0.0.0.0` inside the container, while Docker Compose publishes the app port on `127.0.0.1` of the host.

### Verify Redis Persistence

1. Call `curl http://localhost:8080/visits` and note the returned value.
2. Run `docker compose down`, followed by `docker compose up -d`.
3. Call `curl http://localhost:8080/visits` again. The counter should continue from its previous value.

## Testing and Code Quality

The application includes automated endpoint tests using the built-in Node.js test runner and Supertest. A mocked Redis client simulates successful operations and errors without requiring a running Redis server.

- Run tests: `npm test`.
- Run ESLint: `npm run lint`.

ESLint uses the recommended JavaScript rules and is configured for the Node.js CommonJS environment. Both checks run automatically in GitHub Actions.

## Docker and Docker Compose

The application uses a multi-stage Dockerfile. The build stage starts from `node:22-alpine`, installs production dependencies with `npm ci --omit=dev`, and copies the source files. The runtime stage uses `alpine:3.24`, the Node.js executable, the application files, and the required `libatomic` and `libstdc++` libraries. The application runs as a non-root user (`10001:10001`).

Build the image locally with `docker build -t visit-counter .`.

Docker Compose manages two services:

- **app:** Builds and runs the Node.js application.
- **redis:** Uses `redis:7.4-alpine`, with AOF persistence, the named volume `redis_data`, and a healthcheck based on `redis-cli ping`.

The application waits until Redis is healthy before starting. Both services use the `unless-stopped` restart policy. Redis is not directly exposed to the host.

### Multi-stage Build Comparison

The Docker-reported disk usage was compared before and after switching to the final Alpine multi-stage image:

| Build | Image size |
|---|---:|
| Original single-stage image | 270 MB |
| Final Alpine multi-stage image | 217 MB |

This reduced the reported image size by **53 MB**.

## Important Design Decisions

- **Alpine-based images:** The build stage uses the official Node.js Alpine image for Node.js and npm. The smaller runtime stage contains only the Node.js executable, required libraries, application code, and production dependencies, without npm.
- **Multi-stage build and cache:** Dependencies are installed before copying the source code so Docker can reuse the installation layer when only the application code changes.
- **Non-root user:** The application runs as UID/GID `10001:10001` to avoid running the Node.js process as root.
- **Redis persistence:** AOF writes changes to disk, while the named volume `redis_data` keeps those files across container recreation when the volume is preserved.
- **Healthcheck and startup order:** Redis uses `redis-cli ping`, and `depends_on` with `service_healthy` makes Compose wait for Redis before starting the app.
- **Mocked tests:** Redis is mocked in endpoint tests so success and failure responses can be tested without an external Redis instance.

## Healthcheck Script

The Bash script `scripts/healthcheck.sh` checks the application's `/health` endpoint. It accepts a base URL, makes up to five attempts, waits three seconds between failed attempts, and logs a timestamp and status for each attempt. It exits with code `0` on HTTP `200` or `1` if all attempts fail.

Run it with `bash scripts/healthcheck.sh http://localhost:8080`. If no URL is provided, the script prints usage instructions and exits with code `1`.

## Continuous Integration and Security Scanning

GitHub Actions runs on pushes to `main` and pull requests targeting `main`. The CI workflow checks out the repository, sets up Node.js 22 with npm caching, installs dependencies using `npm ci`, runs ESLint and automated tests, builds the Docker image, and scans the image using Trivy.

Trivy checks for known HIGH and CRITICAL severity vulnerabilities. The security step is configured to fail the workflow when matching vulnerabilities are detected.

## Makefile

A Makefile provides shortcuts for common commands:

| Command | Description |
|---|---|
| `make build` | Builds the Docker image using Docker Compose. |
| `make up` | Starts the application and Redis in detached mode. |
| `make test` | Runs automated tests with npm. |
| `make down` | Stops and removes Compose containers without deleting named volumes. |

The targets are marked `.PHONY` so they run even if files or directories with the same names exist. GNU Make is required to use these shortcuts.

## Challenges and Solutions

During this project, I encountered several issues that helped me better understand Docker and the development process.

- **Docker setup on Windows:** At first, the `docker` command was not recognized in Git Bash, even though Docker Desktop was installed. I checked the setup and continued working through PowerShell, where Docker was available.
- **Running Node.js in a minimal Alpine image:** After switching to a minimal Alpine runtime image, the application could not start because the Node.js executable required additional system libraries. I investigated the error and installed `libatomic` and `libstdc++`, which resolved the problem.
- **Docker image vulnerabilities:** Trivy detected HIGH-severity vulnerabilities in an earlier Docker image. I modified the multi-stage Dockerfile to exclude npm and unnecessary components from the final image. After rebuilding, the security scan reported no HIGH or CRITICAL vulnerabilities.

These issues showed me why it is important to test Docker images, check their dependencies, and consider security during development.

## Future Improvements

- **GitHub Container Registry:** Automatically publish Docker images to GHCR after a successful CI run, using commit SHAs as image tags.
- **Integration testing:** Add tests with a real Redis instance to verify communication between the services.
- **Application healthcheck:** Add a Docker healthcheck for the Node.js service in addition to the existing Redis healthcheck.
- **Kubernetes:** Add Kubernetes Deployment, Service, and ConfigMap manifests to practice running the application in a cluster.

## AI Tools Used

I used ChatGPT to learn DevOps concepts, understand unfamiliar tools, troubleshoot issues, and review configuration files. It was especially helpful when working with Docker multi-stage builds, security scan findings, and README wording.

I reviewed the suggestions, tested changes locally, and verified the application using automated tests, Docker, and GitHub Actions. I made sure to understand the code and configuration included in the final project.
