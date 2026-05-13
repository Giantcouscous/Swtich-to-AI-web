// Cloudflare Pages Worker — Claude API proxy
// File: functions/api/recommend.js
// This runs server-side on Cloudflare Pages Functions
// Set ANTHROPIC_API_KEY in Cloudflare Pages environment variables

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pain, company, name } = await request.json();

    if (!pain) {
      return new Response(
        JSON.stringify({ error: 'pain_point required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const prompt = `You are an AI tool specialist for SwitchToAI, a UK-based AI automation consultancy.

A business owner has described their biggest pain point: "${pain}"
${company ? `Their company: ${company}` : ''}
${name ? `Their name: ${name}` : ''}

Search for the best current off-the-shelf AI or automation tool that solves this specific pain point. Look for tools on futurepedia.io and theresanaiforthat.com as well as well-known platforms. Prioritise reputable vendors, mature products, transparent pricing, and tools suitable for small UK businesses.

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "tool_name": "Tool Name",
  "why_it_fits": "One or two sentences explaining exactly why this tool solves their specific pain point — be specific to what they described.",
  "what_it_does": "One sentence describing what the tool does generally.",
  "price": "Free / Free – £X/month / £X/month",
  "setup_time": "e.g. 2 hours / Half a day / 1 week",
  "url": "https://toolwebsite.com",
  "pain_summary": "3-4 words summarising their pain point for a headline"
}`;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 600,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      const err = await anthropicResponse.text();
      console.error('Anthropic API error:', err);
      return new Response(
        JSON.stringify({ error: 'upstream_error', detail: err }),
        { status: 502, headers: corsHeaders }
      );
    }

    const data = await anthropicResponse.json();

    // Extract text from response blocks
    let rawText = '';
    for (const block of data.content || []) {
      if (block.type === 'text') rawText += block.text;
    }

    // Strip any accidental markdown fences
    const clean = rawText.replace(/```json|```/g, '').trim();

    // Validate it's parseable JSON before returning
    const parsed = JSON.parse(clean);

    return new Response(JSON.stringify(parsed), { headers: corsHeaders });

  } catch (err) {
    console.error('Worker error:', err);
    return new Response(
      JSON.stringify({ error: 'worker_error', detail: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle GET for health check
export async function onRequestGet() {
  return new Response(
    JSON.stringify({ status: 'ok', service: 'SwitchToAI recommend API' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
