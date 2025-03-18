/**
 * Claude API와의 통신을 처리하는 서비스
 * 건축 관련 프롬프트 처리 및 응답 구조화
 */

const { Anthropic } = require("@anthropic/sdk");
require("dotenv").config();

// Claude API 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

/**
 * 건축 프롬프트 처리 및 구조화된 응답 생성
 * @param {string} prompt - 사용자 명령어/프롬프트
 * @returns {Promise<Object>} - 구조화된 명령 데이터
 */
async function processArchitecturePrompt(prompt) {
  try {
    // Claude에게 보낼 시스템 프롬프트 구성
    const systemPrompt = `당신은 건축 포트폴리오 생성을 위한 Figma 명령 처리 전문가입니다.
사용자의 자연어 지시를 Figma API 호출을 위한 구조화된 JSON으로 변환하세요.
응답은 다음 타입 중 하나여야 합니다:

1. createFrame - 건축용 프레임 생성
2. createGrid - 건축 레이아웃을 위한 그리드 생성
3. addScaleBar - 축척 표시 추가
4. createFloorPlan - 평면도 생성
5. createElevation - 입면도 생성
6. createTextStyle - 건축 텍스트 스타일 생성
7. createSheet - 건축 프로젝트 시트 생성
8. composite - 여러 명령어 조합 실행

각 타입은 고유한 속성을 가지며, 모든 속성에 적절한 값을 할당하세요.
반드시 valid JSON 형식으로 응답하세요.
추가 설명이나 텍스트 없이 JSON만 반환하세요.

예시 응답 형식:
{
  "type": "createFloorPlan",
  "properties": {
    "name": "1층 평면도",
    "width": 1000,
    "height": 700,
    "scale": "1:100",
    "showGrid": true
  }
}
`;

    // Claude API 호출
    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // 응답에서 JSON 추출 (Claude가 가끔 JSON 아닌 텍스트를 응답 앞/뒤에 추가하는 경우 대비)
    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Claude의 응답에서 JSON을 추출할 수 없습니다.");
    }

    // JSON 파싱
    try {
      const structuredData = JSON.parse(jsonMatch[0]);
      return validateAndEnhanceData(structuredData);
    } catch (parseError) {
      throw new Error(`JSON 파싱 오류: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Claude API 처리 중 오류:", error);
    throw new Error(`Claude 처리 실패: ${error.message}`);
  }
}

/**
 * Claude에서 받은 구조화된 데이터 검증 및 보강
 * @param {Object} data - Claude로부터 받은 구조화된 데이터
 * @returns {Object} - 검증 및 보강된 데이터
 */
function validateAndEnhanceData(data) {
  // 필수 필드 검증
  if (!data.type) {
    throw new Error("명령 타입이 지정되지 않았습니다.");
  }

  // properties가 없는 경우 빈 객체로 초기화
  if (!data.properties && data.type !== "composite") {
    data.properties = {};
  }

  // 타입별 검증 및 기본값 설정
  switch (data.type) {
    case "createFrame":
      // 프레임에 대한 기본값 설정
      data.properties = {
        name: data.properties.name || "건축 프레임",
        width: data.properties.width || 1920,
        height: data.properties.height || 1080,
        x: data.properties.x || 0,
        y: data.properties.y || 0,
        ...data.properties,
      };
      break;

    case "createFloorPlan":
      // 평면도에 대한 기본값 설정
      data.properties = {
        name: data.properties.name || "평면도",
        width: data.properties.width || 1000,
        height: data.properties.height || 700,
        scale: data.properties.scale || "1:100",
        showGrid:
          data.properties.showGrid !== undefined
            ? data.properties.showGrid
            : true,
        ...data.properties,
      };
      break;

    case "createElevation":
      // 입면도에 대한 기본값 설정
      data.properties = {
        name: data.properties.name || "입면도",
        width: data.properties.width || 1200,
        height: data.properties.height || 500,
        scale: data.properties.scale || "1:50",
        orientation: data.properties.orientation || "front",
        ...data.properties,
      };
      break;

    case "composite":
      // 복합 명령에 대한 검증
      if (
        !data.commands ||
        !Array.isArray(data.commands) ||
        data.commands.length === 0
      ) {
        throw new Error(
          "복합 명령은 적어도 하나 이상의 명령을 포함해야 합니다."
        );
      }

      // 각 하위 명령 검증 및 보강
      data.commands = data.commands.map((cmd) => validateAndEnhanceData(cmd));
      break;

    // 다른 타입에 대한 검증 로직 추가 가능
  }

  return data;
}

/**
 * 건축 템플릿 목록 가져오기
 * @returns {Object} - 템플릿 목록
 */
function getArchitectureTemplates() {
  // examples/architecture-templates.js에서 가져오기
  return require("../examples/architecture-templates");
}

module.exports = {
  processArchitecturePrompt,
  getArchitectureTemplates,
};
