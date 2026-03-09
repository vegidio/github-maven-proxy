# GitHub Maven Proxy

<p align="center">
<img src="docs/assets/icon.avif" width="256" alt="Github Maven Proxy"/>
<br/>
<strong>Github Maven Proxy</strong> is a lightweight reverse proxy for GitHub Packages
<br/>
that handles authentication transparently.
</p>

## 💡 Motivation

GitHub Packages requires authentication for every request — even when the package is publicly visible. This means every developer who wants to use your package must create a GitHub personal access token and configure it in their build tool, which is tedious, error-prone, and impractical for open-source consumers.

This proxy solves that by sitting in front of `maven.pkg.github.com` and injecting the authentication header on every request. You deploy it once with a single token, and anyone can fetch your packages from the proxy URL without credentials.

## ⚙️ Configuration

The proxy is configured through the following environment variables:

| Variable | Required | Description |
|---|---|---|
| `GITHUB_USER` | ✅ | Your GitHub username |
| `GITHUB_TOKEN` | ✅ | A GitHub personal access token with `read:packages` scope |
| `PORT` | ❌ | Port the proxy listens on (default: `8080`) |

## 🚀 Deployment

### Docker

```bash
docker run -d \
  -e GITHUB_USER=your-github-username \
  -e GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx \
  -p 8080:8080 \
  ghcr.io/vegidio/gh-maven-proxy:latest
```

### Docker Compose

```bash
cp .env.example .env
# Edit .env and fill in your GITHUB_USER and GITHUB_TOKEN
docker compose up -d
```

### Kubernetes (Helm)

```bash
helm install gh-proxy ./charts/gh-proxy \
  --set env.GITHUB_USER=your-github-username \
  --set env.GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx \
  --set ingress.hosts[0].host=maven.your-domain.com
```

## 🖼️ Usage

Once the proxy is running, add it as a Maven repository in your build tool using the URL format:

```
https://<proxy-host>/<github-owner>/<github-repo>
```

For example, if your proxy is deployed at `maven.your-domain.com`:

### Gradle (Kotlin DSL)

```kotlin
repositories {
    maven {
        url = uri("https://maven.your-domain.com")
    }
}
```

### Maven

```xml
<repositories>
    <repository>
        <id>github-maven-proxy</id>
        <url>https://maven.your-domain.com</url>
    </repository>
</repositories>
```

No credentials required on the client side.

## 🛠️ Build

### Dependencies

- [Bun](https://bun.sh/docs/installation)
- [Docker](https://docs.docker.com/get-started/get-docker/) (for container builds)

### Running locally

```bash
# Install dependencies
bun install

# Start with hot reload
bun run dev

# Start without hot reload
bun run start
```

### Building a Docker image

```bash
bun run docker
```

This produces a multi-platform image (`linux/amd64` and `linux/arm64`) and pushes it to `ghcr.io`.

## 📝 License

**GitHub Maven Proxy** is released under the Apache 2.0 License. See [LICENSE](LICENSE) for details.

## 👨🏾‍💻 Author

Vinicius Egidio ([vinicius.io](http://vinicius.io))
