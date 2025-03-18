/**
 * Claude와 Figma 간의 통합을 처리하는 서비스
 * Claude의 구조화된 출력을 Figma API 호출로 변환
 */

const { Client } = require("figma-api");
const figmaActions = require("./figma-actions");
const axios = require("axios");

// Figma API 클라이언트 초기화
const figmaClient = new Client({
  personalAccessToken: process.env.FIGMA_ACCESS_TOKEN,
});

/**
 * Claude에서 구조화된 데이터를 받아 Figma에서 실행
 * @param {Object} structuredData - Claude로부터 받은 구조화된 명령 데이터
 * @param {string} fileKey - 작업할 Figma 파일 키
 * @param {string} pageName - 작업할 Figma 페이지 이름
 * @returns {Promise<Object>} - 실행 결과
 */
async function executeInFigma(structuredData, fileKey, pageName) {
  try {
    // 파일 구조 가져오기
    const file = await figmaClient.file(fileKey);

    // 지정된 페이지 찾기
    const page = findPageByName(file.document, pageName);
    if (!page) {
      // 페이지가 없으면 새로 생성하기 위한 REST API 호출 (Figma API 클라이언트는 페이지 생성 미지원)
      await createNewPage(fileKey, pageName);
      // 파일 구조 다시 가져오기
      const updatedFile = await figmaClient.file(fileKey);
      const newPage = findPageByName(updatedFile.document, pageName);
      if (!newPage) {
        throw new Error(`'${pageName}' 페이지를 생성하지 못했습니다.`);
      }
    }

    // 구조화된 데이터 해석 및 액션 실행
    const result = await processStructuredData(
      structuredData,
      fileKey,
      pageName
    );

    return {
      success: true,
      message: `'${pageName}' 페이지에 명령이 성공적으로 적용되었습니다.`,
      details: result,
    };
  } catch (error) {
    console.error("Figma 실행 중 오류:", error);
    throw new Error(`Figma 실행 실패: ${error.message}`);
  }
}

/**
 * 사전 정의된 건축 템플릿을 Figma에 적용
 * @param {string} templateName - 적용할 템플릿 이름
 * @param {string} fileKey - 작업할 Figma 파일 키
 * @param {string} pageName - 작업할 Figma 페이지 이름
 * @returns {Promise<Object>} - 실행 결과
 */
async function applyTemplate(templateName, fileKey, pageName) {
  try {
    const templates = require("../examples/architecture-templates");
    const templateData = templates[templateName];

    if (!templateData) {
      throw new Error(`'${templateName}' 템플릿을 찾을 수 없습니다.`);
    }

    // 템플릿 데이터를 사용하여 Figma에서 실행
    return await executeInFigma(
      templateData.figmaInstructions,
      fileKey,
      pageName
    );
  } catch (error) {
    console.error("템플릿 적용 중 오류:", error);
    throw new Error(`템플릿 적용 실패: ${error.message}`);
  }
}

/**
 * 구조화된 데이터를 해석하고 Figma 액션으로 변환하여 실행
 * @param {Object} data - 구조화된 명령 데이터
 * @param {string} fileKey - Figma 파일 키
 * @param {string} pageName - Figma 페이지 이름
 * @returns {Promise<Object>} - 실행 결과
 */
async function processStructuredData(data, fileKey, pageName) {
  // 명령 타입에 따라 적절한 액션 실행
  switch (data.type) {
    case "createFrame":
      return await figmaActions.createFrame(fileKey, pageName, data.properties);

    case "createGrid":
      return await figmaActions.createGrid(fileKey, pageName, data.properties);

    case "addScaleBar":
      return await figmaActions.addScaleBar(fileKey, pageName, data.properties);

    case "createFloorPlan":
      return await figmaActions.createFloorPlan(
        fileKey,
        pageName,
        data.properties
      );

    case "createElevation":
      return await figmaActions.createElevation(
        fileKey,
        pageName,
        data.properties
      );

    case "createTextStyle":
      return await figmaActions.createTextStyle(
        fileKey,
        pageName,
        data.properties
      );

    case "createSheet":
      return await figmaActions.createSheet(fileKey, pageName, data.properties);

    case "composite":
      // 여러 명령어가 포함된 복합 명령 처리
      const results = [];
      for (const command of data.commands) {
        const result = await processStructuredData(command, fileKey, pageName);
        results.push(result);
      }
      return results;

    default:
      throw new Error(`지원하지 않는 명령 타입: ${data.type}`);
  }
}

/**
 * 파일 구조에서 이름으로 페이지 찾기
 * @param {Object} document - Figma 문서 객체
 * @param {string} pageName - 찾을 페이지 이름
 * @returns {Object|null} - 찾은 페이지 또는 null
 */
function findPageByName(document, pageName) {
  if (!document || !document.children) return null;

  return (
    document.children.find(
      (page) => page.type === "CANVAS" && page.name === pageName
    ) || null
  );
}

/**
 * Figma REST API를 사용하여 새 페이지 생성
 * @param {string} fileKey - Figma 파일 키
 * @param {string} pageName - 새 페이지 이름
 * @returns {Promise<Object>} - API 응답
 */
async function createNewPage(fileKey, pageName) {
  const endpoint = `https://api.figma.com/v1/files/${fileKey}/pages`;

  const response = await axios.post(
    endpoint,
    {
      name: pageName,
    },
    {
      headers: {
        "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}

module.exports = {
  executeInFigma,
  applyTemplate,
};
