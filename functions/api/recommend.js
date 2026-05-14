export async function onRequest(context) {
  return new Response(
    JSON.stringify({
      success: true,
      method: context.request.method,
      message: 'function works'
    }),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}
