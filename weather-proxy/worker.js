// Cloudflare Worker that forwards forecast requests to Open-Meteo.
// Open-Meteo counts free usage per Cloudflare account, not per (shared) server IP.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // only the backend may use it, and only for forecasts, so it can't become an open proxy
    if (env.PROXY_KEY && request.headers.get("X-Proxy-Key") !== env.PROXY_KEY) {
      return new Response("Forbidden", { status: 403 });
    }
    if (url.pathname !== "/v1/forecast") {
      return new Response("Not found", { status: 404 });
    }

    const upstream = await fetch("https://api.open-meteo.com/v1/forecast" + url.search);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  },
};