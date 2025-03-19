/**
 * Claude AI 서비스
 * Claude API를 사용하여 디자인 관련 요청을 처리합니다.
 */

const { Anthropic } = require("@anthropic-ai/sdk");
const dotenv = require("dotenv");

dotenv.config();

// Claude API 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// 기본 모델 설정
const DEFAULT_MODEL = "claude-3-sonnet-20240229";
const MAX_TOKENS = 2000;

/**
 * 디자인 요청을 자연어로 처리하고 구조화된 명령으로 변환
 * @param {string} prompt - 사용자의 자연어 요청
 * @param {Object} options - 추가 옵션 (모델, 최대 토큰 등)
 * @returns {Promise<Object>} - 구조화된 Figma 명령
 */
async function processDesignPrompt(prompt, options = {}) {
  try {
    const model = options.model || DEFAULT_MODEL;
    const maxTokens = options.maxTokens || MAX_TOKENS;

    // 포트폴리오 맥락 제공을 위한 시스템 프롬프트
    const systemPrompt = `당신은 포트폴리오 디자인 전문가입니다. 사용자의 요청을 분석하여 Figma 플러그인이 이해할 수 있는 구조화된 명령으로 변환해주세요.

응답은 항상 다음 형식의 JSON으로 제공하세요:
{
  "action": "명령 종류",
  "parameters": {
    // 명령에 필요한 매개변수들
  }
}

가능한 action의 종류:
- createPortfolio: 새 포트폴리오 생성
- editSection: 특정 섹션 편집
- addElement: 요소 추가
- applyStyle: 스타일 적용
- generateLayout: 레이아웃 생성

명령을 실행하기 위해 필요한 모든 정보를 parameters에 포함하세요.
자연어 설명이나 추가 텍스트 없이 JSON만 반환하세요.`;

    // Claude API 호출
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // 응답에서 JSON 추출
    const content = response.content[0].text;
    try {
      // JSON 형식으로 응답이 왔는지 확인
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Claude의 응답에서 JSON을 추출할 수 없습니다.");
      }
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError);
      throw new Error(`Claude 응답 파싱 실패: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Claude API 오류:", error);
    throw new Error(`Claude API 요청 실패: ${error.message}`);
  }
}

/**
 * 포트폴리오 템플릿을 개인화
 * @param {Object} template - 기본 포트폴리오 템플릿
 * @param {Object} userData - 사용자 정보
 * @param {Object} options - 추가 옵션
 * @returns {Promise<Object>} - 개인화된 포트폴리오 템플릿
 */
async function personalizeTemplate(template, userData, options = {}) {
  try {
    const model = options.model || DEFAULT_MODEL;
    const maxTokens = options.maxTokens || MAX_TOKENS;

    // 템플릿과 사용자 데이터를 기반으로 프롬프트 구성
    const prompt = `다음 포트폴리오 템플릿을 사용자 정보에 맞게 개인화해주세요:
    
템플릿 정보:
${JSON.stringify(template, null, 2)}

사용자 정보:
${JSON.stringify(userData, null, 2)}

개인화된 템플릿을 반환하되, 원본 템플릿의 구조와 필수 속성은 유지해주세요.
특히 다음 사항에 중점을 두어 개인화해주세요:
1. 사용자 이름, 직함, 소개 등의 개인 정보
2. 사용자의 전문 분야에 맞는 색상 조정
3. 사용자의 선호도에 맞는 스타일 제안`;

    // Claude API 호출
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // 응답에서 JSON 추출 시도
    const content = response.content[0].text;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const personalizedTemplate = JSON.parse(jsonMatch[0]);
        return personalizedTemplate;
      } else {
        console.warn(
          "Claude의 응답에서 JSON을 추출할 수 없습니다. 원본 템플릿을 반환합니다."
        );
        return template;
      }
    } catch (parseError) {
      console.warn(
        "개인화된 템플릿 파싱 실패, 원본 템플릿을 반환합니다:",
        parseError
      );
      return template;
    }
  } catch (error) {
    console.error("템플릿 개인화 중 오류:", error);
    // 오류 발생 시 원본 템플릿 반환
    return template;
  }
}

/**
 * 텍스트 콘텐츠 생성
 * @param {string} type - 콘텐츠 유형 (bio, projectDescription 등)
 * @param {Object} context - 컨텍스트 정보
 * @param {Object} options - 추가 옵션
 * @returns {Promise<string>} - 생성된 텍스트
 */
async function generateContent(type, context, options = {}) {
  try {
    const model = options.model || DEFAULT_MODEL;
    const maxTokens = options.maxTokens || MAX_TOKENS;

    let prompt;

    // 콘텐츠 유형에 따른 프롬프트 구성
    switch (type) {
      case "bio":
        prompt = `다음 정보를 바탕으로 디자이너 소개(bio) 텍스트를 작성해주세요:
        
이름: ${context.name || ""}
직함: ${context.title || ""}
전문 분야: ${context.specialization || ""}
경력: ${context.experience || ""}

짧고 매력적인 1-2문장의 소개 텍스트를 작성해주세요.`;
        break;

      case "projectDescription":
        prompt = `다음 프로젝트 정보를 바탕으로 간결한 프로젝트 설명을 작성해주세요:
        
프로젝트명: ${context.title || ""}
유형: ${context.type || ""}
핵심 기능/특징: ${context.features || ""}

디자인 포트폴리오에 적합한 2-3문장의 설명을 작성해주세요.`;
        break;

      case "skillDescription":
        prompt = `다음 스킬에 대한 간결한 설명을 작성해주세요:
        
스킬명: ${context.skillName || ""}
숙련도: ${context.level || ""}

디자인 포트폴리오에 적합한 짧은 설명을 작성해주세요.`;
        break;

      default:
        prompt = `다음 정보를 바탕으로 텍스트 콘텐츠를 생성해주세요:
        
${JSON.stringify(context, null, 2)}

포트폴리오에 적합한 간결한 텍스트를 작성해주세요.`;
    }

    // Claude API 호출
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // 텍스트 응답 반환
    return response.content[0].text.trim();
  } catch (error) {
    console.error("콘텐츠 생성 중 오류:", error);
    // 오류 발생 시 기본 텍스트 반환
    return `[여기에 ${type} 내용을 입력하세요]`;
  }
}

/**
 * 포트폴리오 디자인 제안
 * @param {Object} userData - 사용자 정보
 * @param {Object} options - 추가 옵션
 * @returns {Promise<Object>} - 포트폴리오 디자인 제안
 */
async function suggestDesign(userData, options = {}) {
  try {
    const model = options.model || DEFAULT_MODEL;
    const maxTokens = options.maxTokens || MAX_TOKENS;

    const prompt = `다음 사용자 정보를 바탕으로 포트폴리오 디자인을 제안해주세요:
    
${JSON.stringify(userData, null, 2)}

다음 형식의 JSON으로 디자인 제안을 반환해주세요:
{
  "suggestedTemplate": "추천 템플릿 ID",
  "colorScheme": {
    "primary": { "r": 0-1 값, "g": 0-1 값, "b": 0-1 값, "a": 0-1 값 },
    "secondary": { "r": 0-1 값, "g": 0-1 값, "b": 0-1 값, "a": 0-1 값 },
    "accent": { "r": 0-1 값, "g": 0-1 값, "b": 0-1 값, "a": 0-1 값 }
  },
  "typography": {
    "heading": "폰트명",
    "body": "폰트명"
  },
  "styleNotes": "디자인 스타일 관련 조언"
}`;

    // Claude API 호출
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // 응답에서 JSON 추출
    const content = response.content[0].text;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Claude의 응답에서 JSON을 추출할 수 없습니다.");
      }
    } catch (parseError) {
      console.error("디자인 제안 파싱 실패:", parseError);

      // 기본 디자인 제안 반환
      return {
        suggestedTemplate: "minimalist",
        colorScheme: {
          primary: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
          secondary: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
          accent: { r: 0.9, g: 0.2, b: 0.2, a: 1 },
        },
        typography: {
          heading: "Inter",
          body: "Inter",
        },
        styleNotes: "깔끔하고 전문적인 미니멀 디자인을 추천합니다.",
      };
    }
  } catch (error) {
    console.error("디자인 제안 중 오류:", error);

    // 오류 발생 시 기본 디자인 제안 반환
    return {
      suggestedTemplate: "minimalist",
      colorScheme: {
        primary: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
        secondary: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
        accent: { r: 0.9, g: 0.2, b: 0.2, a: 1 },
      },
      typography: {
        heading: "Inter",
        body: "Inter",
      },
      styleNotes: "깔끔하고 전문적인 미니멀 디자인을 추천합니다.",
    };
  }
}

// 서비스 내보내기
module.exports = {
  processDesignPrompt,
  personalizeTemplate,
  generateContent,
  suggestDesign,
};
