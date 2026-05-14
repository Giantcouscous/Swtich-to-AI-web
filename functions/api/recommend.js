export async function onRequestPost() {

  return new Response(
    JSON.stringify({
      success: true,
      message: "worker alive"
    }),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}
