interface Env {
  OPENAI_API_KEY: string;
}

interface RequestBody {
  photo: string;
  height: string;
  weight: string;
  style: string;
  colorPreference: string;
  occasions: string[];
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { photo, height, weight, style, colorPreference, occasions } = await context.request.json() as RequestBody;

    if (!photo) {
      return new Response(
        JSON.stringify({ error: '사진이 필요합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const styleLabels: Record<string, string> = {
      minimal: '미니멀',
      streetwear: '스트릿웨어',
      casual: '캐주얼',
      formal: '포멀'
    };

    const colorLabels: Record<string, string> = {
      warm: '따뜻한 톤',
      cool: '차가운 톤',
      neutral: '뉴트럴',
      vibrant: '비비드'
    };

    const occasionLabels: Record<string, string> = {
      daily: '일상',
      office: '오피스',
      date: '데이트',
      party: '파티'
    };

    const systemPrompt = `당신은 전문 패션 스타일리스트입니다.
사용자의 사진, 체형 정보(키, 몸무게), 스타일 선호도를 바탕으로 맞춤형 패션 컨설팅 보고서를 작성해주세요.
보고서에는 다음 내용을 포함해주세요:

1. 퍼스널 컬러 분석 (사진 속 피부톤, 머리색 기반)
2. 체형 분석 및 어울리는 실루엣 추천
3. 어울리는 컬러 팔레트 추천
4. 선호 스타일에 맞는 패션 아이템 추천
5. 상황별 코디 제안
6. 액세서리 및 스타일링 팁

참고: 이 서비스는 패션 및 스타일 추천 목적이며, 의학적 조언이 아닙니다.
친절하고 전문적인 톤으로 작성해주세요.`;

    const occasionList = occasions?.map(o => occasionLabels[o] || o).join(', ') || '일상';
    const userMessage = `키: ${height}cm
몸무게: ${weight}kg
선호 스타일: ${styleLabels[style] || style}
선호 컬러: ${colorLabels[colorPreference] || colorPreference}
주요 착용 상황: ${occasionList}`;

    // 스타일 보고서 생성
    const reportResponse = await fetch('https://api.openai.com/v1/responses', {
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

    if (!reportResponse.ok) {
      const errorText = await reportResponse.text();
      console.error('OpenAI API Error:', errorText);
      return new Response(
        JSON.stringify({ error: 'AI 분석 중 오류가 발생했습니다.', details: errorText }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const reportData = await reportResponse.json() as {
      output: Array<{
        content: Array<{
          type: string;
          text: string;
        }>;
      }>;
    };

    const report = reportData.output?.[0]?.content?.find(c => c.type === 'output_text')?.text
      || '보고서를 생성할 수 없습니다.';

    // 헤어스타일 이미지 생성
    let hairstyleImage: string | null = null;

    try {
      // Base64 데이터에서 실제 이미지 데이터 추출
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const blob = new Blob([binaryData], { type: 'image/png' });

      const formData = new FormData();
      formData.append('image', blob, 'photo.png');
      formData.append('prompt', `You are an expert hairstylist. Create a 3x3 grid showing 9 different hairstyle recommendations for this person.

CRITICAL RULES:
1. DO NOT modify, change, or alter the person's face in any way
2. Keep the exact same facial features, skin tone, and face shape
3. Only change the hairstyle (hair color, length, style, texture)
4. The face must remain 100% identical to the original photo
5. Include a brief Korean label for each hairstyle

Show diverse styles: short, medium, long, curly, straight, layered, with bangs, without bangs, different colors that suit their skin tone.`);
      formData.append('model', 'gpt-image-1');
      formData.append('n', '1');
      formData.append('size', '1024x1024');
      formData.append('quality', 'high');
      formData.append('background', 'auto');
      formData.append('moderation', 'auto');
      formData.append('input_fidelity', 'high');

      const imageResponse = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.env.OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json() as {
          data: Array<{ b64_json: string }>;
        };

        if (imageData.data?.[0]?.b64_json) {
          hairstyleImage = `data:image/png;base64,${imageData.data[0].b64_json}`;
        }
      } else {
        const errorText = await imageResponse.text();
        console.error('Hairstyle API Error:', errorText);
      }
    } catch (imgError) {
      console.error('Hairstyle generation error:', imgError);
    }

    return new Response(
      JSON.stringify({ report, hairstyleImage }),
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
