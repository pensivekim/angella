interface Env {
  OPENAI_API_KEY: string;
}

interface RequestBody {
  photo: string;
  height: number;
  weight: number;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { photo, height, weight } = await context.request.json() as RequestBody;

    if (!photo || !height || !weight) {
      return new Response(
        JSON.stringify({ error: '사진, 키, 몸무게 정보가 필요합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const systemPrompt = `당신은 전문 퍼스널 스타일리스트입니다.
사용자의 사진과 신체 정보를 분석하여 맞춤형 스타일 컨설팅 보고서를 작성해주세요.
보고서에는 다음 내용을 포함해주세요:

1. 체형 분석
2. 퍼스널 컬러 추천
3. 어울리는 스타일 및 패션 아이템 추천
4. 피해야 할 스타일
5. 코디 팁

친절하고 전문적인 톤으로 작성해주세요.`;

    const userMessage = `키 ${height}cm, 몸무게 ${weight}kg`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-chat-latest',
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: systemPrompt
              }
            ]
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_image',
                image_url: photo
              },
              {
                type: 'input_text',
                text: userMessage
              }
            ]
          }
        ],
        text: {
          format: {
            type: 'text'
          }
        },
        reasoning: {},
        tools: [],
        temperature: 1,
        max_output_tokens: 2048,
        top_p: 1,
        store: true
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API Error:', error);
      return new Response(
        JSON.stringify({ error: 'AI 분석 중 오류가 발생했습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const data = await response.json() as {
      output: Array<{
        content: Array<{
          type: string;
          text: string;
        }>;
      }>;
    };

    const report = data.output?.[0]?.content?.find(c => c.type === 'output_text')?.text
      || '보고서를 생성할 수 없습니다.';

    return new Response(
      JSON.stringify({ report }),
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
