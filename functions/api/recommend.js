export async function onRequestPost(context) {

  return new Response(
    JSON.stringify({
      success: true,
      method: 'POST works'
    }),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}
