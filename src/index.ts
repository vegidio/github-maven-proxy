import { Hono } from 'hono'
import { proxy } from 'hono/proxy'

const GITHUB_USER = process.env.GITHUB_USER
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const PORT = Number(process.env.PORT ?? 8080)

if (!GITHUB_USER || !GITHUB_TOKEN) {
    console.error('Fatal: GITHUB_USER and GITHUB_TOKEN environment variables are required.')
    process.exit(1)
}

const authHeader = `Basic ${btoa(`${GITHUB_USER}:${GITHUB_TOKEN}`)}`
const UPSTREAM_BASE = 'https://maven.pkg.github.com'

const app = new Hono()

app.on(['GET', 'HEAD'], '*', async (c) => {
    const search = new URL(c.req.url).search
    const upstreamUrl = `${UPSTREAM_BASE}${c.req.path}${search}`

    return proxy(upstreamUrl, {
        method: c.req.method,
        headers: {
            Accept: c.req.header('Accept') ?? '*/*',
            Authorization: authHeader,
            'User-Agent': 'github-maven-proxy/1.0',
        },
    })
})

export default {
    port: PORT,
    fetch: app.fetch,
}
