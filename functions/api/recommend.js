export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (request.method === "GET") {
    return new Response(
      JSON.stringify({ success: true, method: "GET", message: "function works" }),
      { headers }
    );
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "method_not_allowed" }),
      { status: 405, headers }
    );
  }

  try {
    const { pain, company, name } = await request.json();

    if (!pain) {
      return new Response(
        JSON.stringify({ error: "pain_required" }),
        { status: 400, headers }
      );
    }

    if (!env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "missing_anthropic_key" }),
        { status: 500, headers }
      );
    }

    const prompt = `Return ONLY valid JSON. No markdown. No explanation.

Recommend one current off-the-shelf AI or automation tool for this business pain point.

Pain point: ${pain}
Company: ${company || ""}
Name: ${name || ""}

JSON format:
{
  "tool_name": "Tool Name",
  "why_it_fits": "One or two sentences explaining why this tool solves their specific pain point.",
  "what_it_does": "One sentence describing what the tool does.",
  "price": "Free / Free – £X/month / £X/month",
  "setup_time": "e.g. 2 hours / Half a day / 1 week",
  "url": "https://toolwebsite.com",
  "pain_summary": "3-4 words summarising their pain point"
}`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 700,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const raw = await anthropicResponse.text();

    if (!anthropicResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "anthropic_error",
          status: anthropicResponse.status,
          detail: raw,
        }),
        { status: 502, headers }
      );
    }

    const data = JSON.parse(raw);

    let text = "";
    for (const block of data.content || []) {
      if (block.type === "text") text += block.text;
    }

    const clean = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "json_parse_failed",
          raw: clean,
        }),
        { status: 500, headers }
      );
    }

    return new Response(JSON.stringify(parsed), { headers });

  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "worker_crash",
        detail: err.message,
      }),
      { status: 500, headers }
    );
  }
}
