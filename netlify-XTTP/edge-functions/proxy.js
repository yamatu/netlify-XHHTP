const BACKEND_URL = Netlify.env.get("BACKEND_URL") || "https://your-backend-server.com";

export default async function handler(request, context) {
  try {
    const url = new URL(request.url);
    const targetPath = url.pathname + url.search;
    const upstreamUrl = new URL(targetPath, BACKEND_URL).toString();

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("x-forwarded-proto");
    headers.delete("x-forwarded-host");

    const method = request.method;

    const init = {
      method,
      headers,
      redirect: "manual"
    };

    if (method !== "GET" && method !== "HEAD") {
      init.body = request.body;
    }

    const upstreamResponse = await fetch(upstreamUrl, init);

    const responseHeaders = new Headers();

    for (const [key, value] of upstreamResponse.headers.entries()) {
      const lower = key.toLowerCase();
      if (!["transfer-encoding", "connection", "keep-alive"].includes(lower)) {
        responseHeaders.set(key, value);
      }
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(`Proxy Error: ${error.message}`, {
      status: 502
    });
  }
}
