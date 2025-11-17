export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  // Get the API key from Cloudflare (production) or from import.meta.env (local dev)
  const apiKey =
    // Cloudflare Pages: env available on locals.runtime.env
    // @ts-ignore - runtime is injected by the Cloudflare adapter
    locals?.runtime?.env?.RESEND_API_KEY ??
    // Fallback for local development
    import.meta.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("RESEND_API_KEY is missing");
    return new Response("Server error: missing API key", { status: 500 });
  }

  try {
    const formData = await request.formData();

    // Honeypot – if filled, probably a bot
    const company = formData.get("company");
    if (typeof company === "string" && company.trim() !== "") {
      return new Response(null, { status: 200 });
    }

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!name || !email || !message) {
      return new Response("Missing required fields", { status: 400 });
    }

    const textBody = [
      "New enquiry from the website:",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      "",
      "Message:",
      message,
    ].join("\n");

    // Call Resend's HTTP API directly
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Inguz Care <no-reply@inguzcare.co.uk>",
        to: ["contact@inguzcare.co.uk"],
        subject: "New website enquiry",
        reply_to: email,
        text: textBody,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error response:", res.status, body);

      // 🔴 TEMPORARY: show full error from Resend in the browser
      return new Response(
        `Resend error (${res.status}):\n\n${body}`,
        {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        }
      );
    }

    // Success – redirect to thank-you page
    return new Response(null, {
      status: 302,
      headers: { Location: "/thanks" },
    });
  } catch (err: any) {
    console.error("Server error:", err);
    return new Response(
      `Server error:\n\n${String(err?.message ?? err)}`,
      { status: 500 }
    );
  }
};
