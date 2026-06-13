// Supabase Edge Function: send-reports
// Deploy: supabase/functions/send-reports/index.ts
// Trigger: database webhook on INSERT to report_requests table
//
// Environment variables — set in Supabase Dashboard → Settings → Edge Functions:
//   DB_URL         = https://fiykaghrcnhswmwsrgdy.supabase.co
//   DB_SERVICE_KEY = <your service role key>
//   BREVO_API_KEY  = <your Brevo API key>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DB_URL         = Deno.env.get('DB_URL')!
const DB_SERVICE_KEY = Deno.env.get('DB_SERVICE_KEY')!
const BREVO_API_KEY  = Deno.env.get('BREVO_API_KEY')!
const FROM_EMAIL     = 'founder@switchtoai.ai'
const FROM_NAME      = 'Ahmed M. — SwitchToAI'
const NOTIFY_EMAIL   = 'founder@switchtoai.ai'

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const record  = payload.record || payload
    const { name, email, pain_point } = record

    if (!email) {
      return new Response(JSON.stringify({ error: 'No email provided' }), { status: 400 })
    }

    const db = createClient(DB_URL, DB_SERVICE_KEY)

    // Generate signed URLs — 24 hour expiry
    const { data: url1, error: e1 } = await db.storage
      .from('reports')
      .createSignedUrl('Food and Beverage Assessment.pdf', 86400)

    const { data: url2, error: e2 } = await db.storage
      .from('reports')
      .createSignedUrl('Retail Circle Assessment Final.pdf', 86400)

    if (e1 || e2) {
      console.error('Signed URL errors:', e1, e2)
      return new Response(JSON.stringify({ error: 'Failed to generate download links' }), { status: 500 })
    }

    const firstName = name ? name.split(' ')[0] : 'there'

    // Send reports to user
    const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email, name: name || '' }],
        subject: 'Your SwitchToAI Assessment Reports',
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0E1117;color:#F0EEE9;padding:40px 32px;border-radius:12px;">
            <div style="margin-bottom:32px;">
              <span style="font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#3B7BFF;">SwitchToAI</span>
            </div>
            <h1 style="font-size:24px;font-weight:600;color:#F8F6F1;margin:0 0 16px;line-height:1.2;">Hi ${firstName}, here are your reports.</h1>
            <p style="font-size:15px;color:#7A8699;line-height:1.7;margin:0 0 32px;">Two real AI automation assessments. Real businesses, real numbers, real recommendations.</p>

            <div style="background:#141820;border:1px solid rgba(59,123,255,0.25);border-radius:10px;padding:24px;margin-bottom:16px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#3B7BFF;margin-bottom:8px;">Multi-Site Food &amp; Beverage</div>
              <div style="font-size:18px;font-weight:700;color:#F8F6F1;margin-bottom:8px;">Tacos Collective</div>
              <div style="font-size:13px;color:#7A8699;margin-bottom:16px;">14–15 staff · Multiple sites · Manual reporting, WhatsApp ops, stock ordering by hand</div>
              <a href="${url1!.signedUrl}" style="display:inline-block;background:#3B7BFF;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:700;">Download report →</a>
              <div style="font-size:11px;color:#7A8699;margin-top:8px;">Link expires in 24 hours</div>
            </div>

            <div style="background:#141820;border:1px solid rgba(59,123,255,0.25);border-radius:10px;padding:24px;margin-bottom:32px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#3B7BFF;margin-bottom:8px;">Luxury Watch Brokerage</div>
              <div style="font-size:18px;font-weight:700;color:#F8F6F1;margin-bottom:8px;">Retail Circle</div>
              <div style="font-size:13px;color:#7A8699;margin-bottom:16px;">4-person team · AWS CRM · Global market · Weekend lead leakage, dormant client re-engagement</div>
              <a href="${url2!.signedUrl}" style="display:inline-block;background:#3B7BFF;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:700;">Download report →</a>
              <div style="font-size:11px;color:#7A8699;margin-top:8px;">Link expires in 24 hours</div>
            </div>

            ${pain_point ? `
            <div style="background:#1A2030;border-left:3px solid #3B7BFF;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:32px;">
              <div style="font-size:11px;color:#7A8699;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.08em;">You mentioned</div>
              <div style="font-size:14px;color:#F0EEE9;line-height:1.6;">${pain_point}</div>
            </div>` : ''}

            <p style="font-size:15px;color:#7A8699;line-height:1.7;margin:0 0 24px;">If anything in those reports looks familiar — book a free 30-minute call and we'll map yours.</p>
            <a href="https://calendly.com/switch-to-ai/30min" style="display:inline-block;background:#3B7BFF;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:700;margin-bottom:32px;">Book your free 30-minute call →</a>

            <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:24px;">
              <div style="font-size:14px;color:#F0EEE9;font-weight:600;margin-bottom:4px;">Ahmed M.</div>
              <div style="font-size:13px;color:#7A8699;">Founder, SwitchToAI · hello@switchtoai.ai · switchtoai.ai</div>
            </div>
          </div>
        `
      })
    })

    if (!emailRes.ok) {
      const errText = await emailRes.text()
      console.error('Brevo error:', errText)
      return new Response(JSON.stringify({ error: 'Failed to send email', detail: errText }), { status: 500 })
    }

    // Notify Ahmed
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'SwitchToAI Reports', email: FROM_EMAIL },
        to: [{ email: NOTIFY_EMAIL }],
        subject: `Report request — ${name || 'Anonymous'} (${email})`,
        htmlContent: `
          <p><strong>Name:</strong> ${name || 'Not provided'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Pain point:</strong> ${pain_point || 'Not provided'}</p>
        `
      })
    })

    // Mark notified
    await db
      .from('report_requests')
      .update({ notified: true })
      .eq('email', email)

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
