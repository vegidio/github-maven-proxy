# Stage 1: Build the standalone binary
FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY src/ ./src/
RUN bun build --compile --minify src/index.ts --outfile proxy

# Stage 2: Minimal runtime image
FROM alpine

RUN apk add --no-cache libstdc++

WORKDIR /app

COPY --from=builder /app/proxy ./proxy

EXPOSE 8080

CMD ["./proxy"]
