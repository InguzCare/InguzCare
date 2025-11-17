export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const POST: APIRoute = async ({ request, locals }) => {
  // Get the API key from Cloudflare (production) or from import.meta.env (local dev)
  const apiKey =
    // Cloudflare Pages: env available on locals.runtime.env
    // @ts-ignore - runtime is injected by the Cloudflare adapter
    locals?.runtime?.env?.RESEND_API_KEY ??
    // Fallback for local development
    import.meta.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('RESEND_API_KEY is missing');
    return new Response('Server error', { status: 500 });
  }

  const resend = new Resend(apiKey);

  try {
    const formData = await request.formData();

    // Honeypot field – if filled, probably a bot
    const company = formData.get('company');
    if (typeof company === 'string' && company.trim() !== '') {
      return new Response(null, { status: 200 });
    }

    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();

    if (!name || !email || !message) {
      return new Response('Missing required fields', { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: 'Inguz Care <no-reply@inguzcare.co.uk>',
      to: ['contact@inguzcare.co.uk'],
      subject: 'New website enquiry',
      replyTo: email,
      text: [
        'New enquiry from the website:',
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || 'Not provided'}`,
        '',
        'Message:',
        message,
      ].join('\n'),
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response('Error sending email', { status: 500 });
    }

    // Success – redirect to thank-you page
    return new Response(null, {
      status: 302,
      headers: { Location: '/thanks' },
    });
  } catch (err) {
    console.error('Server error:', err);
    return new Response('Server error', { status: 500 });
  }
};
