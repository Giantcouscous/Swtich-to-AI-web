export async function onRequest() {
  return new Response(
    JSON.stringify({ ok: true, message: "function works" }),
    { headers: { "Content-Type": "application/json" } }
  );
}
