export async function onRequest(context) {

  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (request.method === 'GET') {
    return new Response(
      JSON.stringify({
        success: true,
        message: 'GET health check works'
      }),
      { headers }
    );
  }

  try {

    const body = await request.json();

    const pain = body.pain || '';
    const company = body.company || '';
    const name = body.name || '';

    if (!pain) {
      return new Response(
        JSON.stringify({
          error: 'Pain point missing'
        }),
        {
          status: 400,
          headers
        }
      );
    }

    const prompt = `You are a specialist AI automation advisor for SwitchToAI, a UK-based consultancy helping small service businesses recover time through automation.

A business owner has submitted the following:
Pain point: ${pain}
${company ? `Company: ${company}` : ''}
${name ? `Name: ${name}` : ''}

Your task: identify the single best off-the-shelf AI or automation tool that directly solves this pain point for a small UK service business.

Requirements:
- Prioritise tools that are mature, actively maintained, and have transparent pricing
- Must be suitable for non-technical business owners — no coding required
- UK-compliant where relevant (GDPR-friendly, GBP pricing or free tier available)
- Prefer tools with a free tier or trial so they can test before paying
- Be specific — not "a CRM" but "HubSpot" or "Pipedrive"
- If the pain point is about building an AI agent, recommend Make.com or n8n as the foundation

Return ONLY valid JSON — no markdown, no explanation, no extra text:
{
  "tool_name": "Exact tool name",
  "why_it_fits": "2 sentences max. Be specific to their exact pain point — mention what the tool does in the context of what they described.",
  "what_it_does": "1 sentence general description.",
  "price": "Free / Free – £X/month / from £X/month",
  "setup_time": "e.g. 2 hours / Half a day / 1 week",
  "url": "https://exacturl.com",
  "pain_summary": "3-4 words for a page headline"
}`;
console.log('API KEY EXISTS:', !!env.ANTHROPIC_API_KEY);
console.log('API KEY PREFIX:', env.ANTHROPIC_API_KEY?.slice(0, 10));
    const anthropicResponse = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
model: 'claude-sonnet-4-5',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      }
    );

    const text = await anthropicResponse.text();

    if (!anthropicResponse.ok) {

console.log(text);

return new Response(
  JSON.stringify({
    error: 'Anthropic failed',
    detail: text
  }),
  {
    status: 500,
    headers
  }
);

    }

    const data = JSON.parse(text);

    let output = '';

    for (const block of data.content) {

      if (block.type === 'text') {
        output += block.text;
      }

    }

    output = output
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

let parsed;

try {
  parsed = JSON.parse(output);
} catch (e) {

  return new Response(
    JSON.stringify({
      error: 'Invalid Claude JSON',
      raw: output
    }),
    {
      status: 500,
      headers
    }
  );

}

return new Response(
  JSON.stringify(parsed),
  { headers }
);

} catch (err) {

  console.log(err);

  return new Response(
    JSON.stringify({
      error: err.message,
      stack: err.stack
    }),
      {
        status: 500,
        headers
      }
    );

  }

}
