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

    const prompt = `
You are an AI tool specialist for SwitchToAI.

Pain point:
${pain}

Company:
${company}

Name:
${name}

Return ONLY valid JSON:

{
  "tool_name": "",
  "why_it_fits": "",
  "what_it_does": "",
  "price": "",
  "setup_time": "",
  "url": "",
  "pain_summary": ""
}
`;

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
          model: 'claude-sonnet-4-20250514',
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

    return new Response(
      JSON.stringify({
        error: err.message
      }),
      {
        status: 500,
        headers
      }
    );

  }

}
