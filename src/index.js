// Moodle CORS proxy for Cloudflare Workers.
// Forwards only Moodle web-service endpoints and adds CORS headers.
const ALLOWED = [/^\/webservice\//, /^\/login\/token\.php$/, /^\/pluginfile\.php\//, /^\/webservice\/pluginfile\.php\//];

export default {
  async fetch(req, env) {
    const upstream = (env.UPSTREAM || "https://www.m1.mofidlms.com").replace(/\/+$/, "");
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOW_ORIGIN || "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Max-Age": "86400",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    const url = new URL(req.url);
    if (url.pathname === "/") {
      return new Response("moodle-cors-proxy is running. Upstream: " + upstream, { headers: cors });
    }
    if (!ALLOWED.some((re) => re.test(url.pathname))) {
      return new Response("Not allowed", { status: 403, headers: cors });
    }

    const res = await fetch(upstream + url.pathname + url.search, {
      method: req.method,
      headers: { "Content-Type": req.headers.get("Content-Type") || "application/x-www-form-urlencoded" },
      body: req.method === "POST" ? await req.arrayBuffer() : undefined,
      redirect: "follow",
    });
    const headers = new Headers(cors);
    headers.set("Content-Type", res.headers.get("Content-Type") || "application/json");
    return new Response(res.body, { status: res.status, headers });
  },
};
