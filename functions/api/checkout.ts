interface Env {
  POLAR_ACCESS_TOKEN: string;
}

interface RequestBody {
  productId: string;
  successUrl?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { productId, successUrl } = await context.request.json() as RequestBody;

    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'Product ID가 필요합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Create checkout session with Polar API
    const checkoutResponse = await fetch('https://api.polar.sh/v1/checkouts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        products: [productId],
        success_url: successUrl || `${new URL(context.request.url).origin}/success`,
      }),
    });

    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      console.error('Polar API Error:', errorText);
      return new Response(
        JSON.stringify({ error: '결제 세션 생성 중 오류가 발생했습니다.', details: errorText }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const checkoutData = await checkoutResponse.json() as {
      id: string;
      url: string;
      status: string;
    };

    return new Response(
      JSON.stringify({
        checkoutUrl: checkoutData.url,
        checkoutId: checkoutData.id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
