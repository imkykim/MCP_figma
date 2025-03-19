/**
 * Figma 서비스
 * MCP를 통해 Figma 플러그인과 통신하고 명령을 처리합니다.
 */

const mcpCore = require("../mcp/core");
const templateService = require("../templates/portfolio-templates");

/**
 * Figma 플러그인에 명령 전송
 * @param {string} command - 명령 이름
 * @param {Object} params - 명령 매개변수
 * @param {number} connectionId - 특정 연결 ID (선택사항)
 * @returns {Promise<Object>} - 명령 실행 결과
 */
async function sendCommand(command, params = {}, connectionId) {
  try {
    if (!mcpCore.hasActiveConnections()) {
      throw new Error(
        "활성화된 Figma 플러그인 연결이 없습니다. 먼저 연결을 설정해주세요."
      );
    }

    // 특정 연결 ID가 제공되지 않은 경우 첫 번째 활성 연결 사용
    if (connectionId === undefined) {
      const connections = mcpCore.getActiveConnectionIds();
      if (connections.length > 0) {
        connectionId = connections[0];
      }
    }

    // 명령 실행 및 결과 반환
    return await mcpCore.executeCommand(command, params, connectionId);
  } catch (error) {
    console.error(`Figma 명령 실행 오류 (${command}):`, error);
    throw new Error(`Figma 명령 실행 실패: ${error.message}`);
  }
}

/**
 * 포트폴리오 템플릿 적용
 * @param {string} templateId - 템플릿 ID
 * @param {Object} data - 사용자 데이터
 * @param {number} connectionId - 연결 ID (선택사항)
 * @returns {Promise<Object>} - 생성된 포트폴리오 정보
 */
async function applyTemplate(templateId, data = {}, connectionId) {
  try {
    // 템플릿 가져오기
    const template = templateService.getTemplateById(templateId);
    if (!template) {
      throw new Error(`템플릿을 찾을 수 없습니다: ${templateId}`);
    }

    // 템플릿 적용 명령 실행
    const result = await sendCommand(
      "applyTemplate",
      {
        template,
        data,
      },
      connectionId
    );

    return result;
  } catch (error) {
    console.error("템플릿 적용 오류:", error);
    throw new Error(`템플릿 적용 실패: ${error.message}`);
  }
}

/**
 * 프레임 생성
 * @param {Object} params - 프레임 생성 매개변수
 * @param {number} connectionId - 연결 ID (선택사항)
 * @returns {Promise<Object>} - 생성된 프레임 정보
 */
async function createFrame(params, connectionId) {
  return await sendCommand("createFrame", params, connectionId);
}

/**
 * 텍스트 생성
 * @param {Object} params - 텍스트 생성 매개변수
 * @param {number} connectionId - 연결 ID (선택사항)
 * @returns {Promise<Object>} - 생성된 텍스트 노드 정보
 */
async function createText(params, connectionId) {
  return await sendCommand("createText", params, connectionId);
}

/**
 * 이미지 플레이스홀더 생성
 * @param {Object} params - 이미지 플레이스홀더 매개변수
 * @param {number} connectionId - 연결 ID (선택사항)
 * @returns {Promise<Object>} - 생성된 이미지 플레이스홀더 정보
 */
async function createImagePlaceholder(params, connectionId) {
  return await sendCommand("createImagePlaceholder", params, connectionId);
}

/**
 * 섹션 생성
 * @param {Object} params - 섹션 생성 매개변수
 * @param {number} connectionId - 연결 ID (선택사항)
 * @returns {Promise<Object>} - 생성된 섹션 정보
 */
async function createSection(params, connectionId) {
  return await sendCommand("createSection", params, connectionId);
}

/**
 * 사각형 생성
 * @param {Object} params - 사각형 생성 매개변수
 * @param {number} connectionId - 연결 ID (선택사항)
 * @returns {Promise<Object>} - 생성된 사각형 정보
 */
async function createRectangle(params, connectionId) {
  return await sendCommand("createRectangle", params, connectionId);
}

/**
 * 포트폴리오 구성 요소 생성 (포트폴리오 섹션 및 요소 구축)
 * @param {Object} template - 포트폴리오 템플릿
 * @param {Object} userData - 사용자 데이터
 * @param {Object} frameInfo - 기본 프레임 정보
 * @param {number} connectionId - 연결 ID (선택사항)
 * @returns {Promise<Object>} - 생성된 포트폴리오 요소 정보
 */
async function buildPortfolioComponents(
  template,
  userData,
  frameInfo,
  connectionId
) {
  try {
    const results = {
      sections: {},
      elements: [],
    };

    // 현재 Y 위치 (요소 배치용)
    let currentY = template.style.spacing.pagePadding;
    const contentWidth = template.layout.contentWidth;
    const pageWidth = template.canvasSize.width;
    const contentX = (pageWidth - contentWidth) / 2; // 중앙 정렬

    // 템플릿의 각 섹션 처리
    for (const [sectionKey, sectionConfig] of Object.entries(
      template.sections
    )) {
      // 사용자가 이 섹션을 원하는지 확인
      if (
        !sectionConfig.required &&
        userData.sections &&
        !userData.sections.includes(sectionKey)
      ) {
        continue; // 사용자가 원하지 않는 섹션 건너뛰기
      }

      // 섹션 생성
      const sectionResult = await createSection(
        {
          frameId: frameInfo.id,
          title: sectionConfig.title,
          x: contentX,
          y: currentY,
          width: contentWidth,
          backgroundColor: null, // 배경색 없음
        },
        connectionId
      );

      results.sections[sectionKey] = sectionResult;

      // 다음 섹션을 위한 Y 위치 업데이트
      currentY += sectionResult.height + template.style.spacing.sectionGap;
    }

    // 전체 프레임 높이 조정 필요 시
    if (currentY > template.canvasSize.height) {
      // 프레임 높이 업데이트 (필요시)
    }

    return results;
  } catch (error) {
    console.error("포트폴리오 구성 요소 생성 오류:", error);
    throw new Error(`포트폴리오 구성 요소 생성 실패: ${error.message}`);
  }
}

/**
 * 완전한 포트폴리오 생성
 * @param {string} templateId - 템플릿 ID
 * @param {Object} userData - 사용자 데이터
 * @param {number} connectionId - 연결 ID (선택사항)
 * @returns {Promise<Object>} - 생성된 포트폴리오 정보
 */
async function generatePortfolio(templateId, userData = {}, connectionId) {
  try {
    // 1. 템플릿 가져오기
    const template = templateService.getTemplateById(templateId);
    if (!template) {
      throw new Error(`템플릿을 찾을 수 없습니다: ${templateId}`);
    }

    // 2. 기본 프레임 생성
    const frameParams = {
      name: userData.name ? `${userData.name} 포트폴리오` : "포트폴리오",
      width: template.canvasSize.width,
      height: template.canvasSize.height,
      backgroundColor: template.style.colors.background,
    };

    const frameInfo = await createFrame(frameParams, connectionId);

    // 3. 포트폴리오 구성 요소 생성
    const componentsInfo = await buildPortfolioComponents(
      template,
      userData,
      frameInfo,
      connectionId
    );

    // 4. 결과 반환
    return {
      frame: frameInfo,
      components: componentsInfo,
      template: templateId,
    };
  } catch (error) {
    console.error("포트폴리오 생성 오류:", error);
    throw new Error(`포트폴리오 생성 실패: ${error.message}`);
  }
}

/**
 * 플러그인 정보 가져오기
 * @param {number} connectionId - 연결 ID (선택사항)
 * @returns {Promise<Object>} - 플러그인 정보
 */
async function getPluginInfo(connectionId) {
  return await sendCommand("getPluginInfo", {}, connectionId);
}

// 서비스 내보내기
module.exports = {
  sendCommand,
  applyTemplate,
  createFrame,
  createText,
  createImagePlaceholder,
  createSection,
  createRectangle,
  buildPortfolioComponents,
  generatePortfolio,
  getPluginInfo,
};
