/**
 * Figma API를 사용하여 건축 관련 작업을 수행하는 함수 모음
 * 건축 포트폴리오 작업에 특화된 기능 제공
 */

const { Client } = require("figma-api");
const axios = require("axios");

// Figma API 클라이언트 초기화
const figmaClient = new Client({
  personalAccessToken: process.env.FIGMA_ACCESS_TOKEN,
});

/**
 * 건축 작업을 위한 프레임 생성
 * @param {string} fileKey - Figma 파일 키
 * @param {string} pageName - 페이지 이름
 * @param {Object} properties - 프레임 속성
 * @returns {Promise<Object>} - 생성된 프레임 정보
 */
async function createFrame(fileKey, pageName, properties) {
  const {
    name = "건축 프레임",
    width = 1920,
    height = 1080,
    x = 0,
    y = 0,
    backgroundColor = { r: 1, g: 1, b: 1, a: 1 }, // 흰색
  } = properties;

  // 페이지 ID 가져오기
  const pageId = await getPageId(fileKey, pageName);

  // REST API로 프레임 생성 요청
  const response = await axios.post(
    `https://api.figma.com/v1/files/${fileKey}/nodes`,
    {
      nodes: [pageId],
    },
    {
      headers: {
        "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
      },
    }
  );

  const pageData = response.data.nodes[pageId];
  if (!pageData) {
    throw new Error("페이지 데이터를 가져오지 못했습니다.");
  }

  // 프레임 생성
  const frameData = {
    type: "FRAME",
    name,
    x,
    y,
    width,
    height,
    backgroundColor,
  };

  // 프레임 생성 API 호출
  const createResponse = await axios.post(
    `https://api.figma.com/v1/files/${fileKey}/actions`,
    {
      action: "CREATE",
      pageId,
      data: frameData,
    },
    {
      headers: {
        "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  return createResponse.data;
}

/**
 * 건축 도면에 적합한 그리드 시스템 생성
 * @param {string} fileKey - Figma 파일 키
 * @param {string} pageName - 페이지 이름
 * @param {Object} properties - 그리드 속성
 * @returns {Promise<Object>} - 생성된 그리드 정보
 */
async function createGrid(fileKey, pageName, properties) {
  const {
    frameId,
    columns = 12,
    rows = 12,
    gutterSize = 10,
    margin = 20,
    color = { r: 0.2, g: 0.2, b: 0.2, a: 0.1 },
  } = properties;

  if (!frameId) {
    throw new Error("그리드를 적용할 프레임 ID가 필요합니다.");
  }

  // 그리드 생성 API 호출
  const response = await axios.post(
    `https://api.figma.com/v1/files/${fileKey}/actions`,
    {
      action: "UPDATE",
      nodeId: frameId,
      data: {
        layoutGrids: [
          {
            pattern: "GRID",
            sectionSize: gutterSize,
            visible: true,
            color,
          },
          {
            pattern: "COLUMNS",
            alignment: "STRETCH",
            gutterSize,
            count: columns,
            offset: margin,
            color,
          },
          {
            pattern: "ROWS",
            alignment: "STRETCH",
            gutterSize,
            count: rows,
            offset: margin,
            color,
          },
        ],
      },
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

/**
 * 건축 도면에 축척 바 추가
 * @param {string} fileKey - Figma 파일 키
 * @param {string} pageName - 페이지 이름
 * @param {Object} properties - 축척 바 속성
 * @returns {Promise<Object>} - 생성된 축척 바 정보
 */
async function addScaleBar(fileKey, pageName, properties) {
  const {
    frameId,
    scale = "1:100",
    length = 100,
    x = 50,
    y = 50,
    color = { r: 0, g: 0, b: 0, a: 1 },
  } = properties;

  if (!frameId) {
    throw new Error("축척 바를 추가할 프레임 ID가 필요합니다.");
  }

  // 축척 바 생성 (선과 텍스트로 구성)
  const pageId = await getPageId(fileKey, pageName);

  // 선 요소 생성
  const lineData = {
    type: "LINE",
    name: `축척 바 ${scale}`,
    x,
    y,
    width: length,
    height: 0,
    strokes: [{ type: "SOLID", color }],
    strokeWeight: 2,
  };

  // 텍스트 요소 생성
  const textData = {
    type: "TEXT",
    name: `축척 ${scale}`,
    x,
    y: y + 10,
    width: length,
    height: 20,
    characters: scale,
    style: {
      fontSize: 12,
      textAlignHorizontal: "CENTER",
    },
    fills: [{ type: "SOLID", color }],
  };

  // 요소 생성 API 호출
  const lineResponse = await axios.post(
    `https://api.figma.com/v1/files/${fileKey}/actions`,
    {
      action: "CREATE",
      pageId,
      parentId: frameId,
      data: lineData,
    },
    {
      headers: {
        "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  const textResponse = await axios.post(
    `https://api.figma.com/v1/files/${fileKey}/actions`,
    {
      action: "CREATE",
      pageId,
      parentId: frameId,
      data: textData,
    },
    {
      headers: {
        "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    line: lineResponse.data,
    text: textResponse.data,
  };
}

/**
 * 평면도 프레임 생성 및 설정
 * @param {string} fileKey - Figma 파일 키
 * @param {string} pageName - 페이지 이름
 * @param {Object} properties - 평면도 속성
 * @returns {Promise<Object>} - 생성된 평면도 정보
 */
async function createFloorPlan(fileKey, pageName, properties) {
  const {
    name = "평면도",
    width = 1000,
    height = 700,
    x = 0,
    y = 0,
    scale = "1:100",
    showGrid = true,
    showDimensions = true,
  } = properties;

  // 먼저 기본 프레임 생성
  const frameResponse = await createFrame(fileKey, pageName, {
    name,
    width,
    height,
    x,
    y,
  });

  const frameId = frameResponse.id;

  // 그리드 추가 (필요한 경우)
  let gridResponse = null;
  if (showGrid) {
    gridResponse = await createGrid(fileKey, pageName, {
      frameId,
      columns: 10,
      rows: 7,
    });
  }

  // 축척 바 추가
  const scaleBarResponse = await addScaleBar(fileKey, pageName, {
    frameId,
    scale,
    x: 50,
    y: height - 50,
  });

  // 북쪽 표시 추가
  const northIndicatorResponse = await createNorthIndicator(fileKey, pageName, {
    frameId,
    x: width - 100,
    y: 50,
  });

  return {
    frame: frameResponse,
    grid: gridResponse,
    scaleBar: scaleBarResponse,
    northIndicator: northIndicatorResponse,
  };
}

/**
 * 입면도(Elevation) 프레임 생성
 * @param {string} fileKey - Figma 파일 키
 * @param {string} pageName - 페이지 이름
 * @param {Object} properties - 입면도 속성
 * @returns {Promise<Object>} - 생성된 입면도 정보
 */
async function createElevation(fileKey, pageName, properties) {
  const {
    name = "입면도",
    width = 1200,
    height = 500,
    x = 0,
    y = 0,
    scale = "1:50",
    orientation = "front", // front, back, left, right
  } = properties;

  // 기본 프레임 생성
  const frameResponse = await createFrame(fileKey, pageName, {
    name: `${orientation} ${name}`,
    width,
    height,
    x,
    y,
  });

  const frameId = frameResponse.id;

  // 높이 눈금 추가
  const heightMarkerResponse = await createHeightMarkers(fileKey, pageName, {
    frameId,
    x: 30,
    y: 50,
    height: height - 100,
    intervals: 5, // 간격 수
  });

  // 축척 바 추가
  const scaleBarResponse = await addScaleBar(fileKey, pageName, {
    frameId,
    scale,
    x: 50,
    y: height - 50,
  });

  return {
    frame: frameResponse,
    heightMarkers: heightMarkerResponse,
    scaleBar: scaleBarResponse,
  };
}

/**
 * 건축 도면에 적합한 텍스트 스타일 생성
 * @param {string} fileKey - Figma 파일 키
 * @param {string} pageName - 페이지 이름
 * @param {Object} properties - 텍스트 스타일 속성
 * @returns {Promise<Object>} - 생성된 텍스트 스타일 정보
 */
async function createTextStyle(fileKey, pageName, properties) {
  const {
    name = "건축 텍스트 스타일",
    type = "title", // title, subtitle, body, caption, annotation
    fontFamily = "Inter",
    fontSize = 14,
    fontWeight = 400,
    color = { r: 0, g: 0, b: 0, a: 1 },
  } = properties;

  // 스타일 유형에 따른 기본값 설정
  let styleProperties = {};

  switch (type) {
    case "title":
      styleProperties = {
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: -0.5,
      };
      break;
    case "subtitle":
      styleProperties = {
        fontSize: 18,
        fontWeight: 600,
        letterSpacing: 0,
      };
      break;
    case "body":
      styleProperties = {
        fontSize: 14,
        fontWeight: 400,
        letterSpacing: 0.2,
      };
      break;
    case "caption":
      styleProperties = {
        fontSize: 12,
        fontWeight: 400,
        letterSpacing: 0.4,
      };
      break;
    case "annotation":
      styleProperties = {
        fontSize: 10,
        fontWeight: 400,
        letterSpacing: 0.3,
      };
      break;
  }

  // 사용자 지정 속성으로 덮어쓰기
  const finalStyle = {
    fontFamily,
    fontSize,
    fontWeight,
    ...styleProperties,
    ...properties,
  };

  // 테스트용 텍스트 요소 생성
  const pageId = await getPageId(fileKey, pageName);

  const textData = {
    type: "TEXT",
    name: `${name} - ${type}`,
    x: 0,
    y: 0,
    width: 400,
    height: finalStyle.fontSize * 1.5,
    characters: `${name} - ${type} 샘플 텍스트`,
    style: {
      fontFamily: finalStyle.fontFamily,
      fontSize: finalStyle.fontSize,
      fontWeight: finalStyle.fontWeight,
      letterSpacing: finalStyle.letterSpacing || 0,
      textAlign: "LEFT",
    },
    fills: [{ type: "SOLID", color }],
  };

  const response = await axios.post(
    `https://api.figma.com/v1/files/${fileKey}/actions`,
    {
      action: "CREATE",
      pageId,
      data: textData,
    },
    {
      headers: {
        "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    style: finalStyle,
    sample: response.data,
  };
}

/**
 * 건축 프로젝트 시트 생성 (제목, 프로젝트 정보, 범례 등 포함)
 * @param {string} fileKey - Figma 파일 키
 * @param {string} pageName - 페이지 이름
 * @param {Object} properties - 시트 속성
 * @returns {Promise<Object>} - 생성된 시트 정보
 */
async function createSheet(fileKey, pageName, properties) {
  const {
    name = "건축 시트",
    size = "A1", // A0, A1, A2, A3, A4
    orientation = "landscape", // landscape, portrait
    projectName = "프로젝트 이름",
    projectNumber = "001",
    client = "고객명",
    architect = "건축가명",
    date = new Date().toLocaleDateString(),
    scale = "다양함",
  } = properties;

  // 용지 크기 설정 (mm 단위)
  const sizeDimensions = {
    A0: { width: 1189, height: 841 },
    A1: { width: 841, height: 594 },
    A2: { width: 594, height: 420 },
    A3: { width: 420, height: 297 },
    A4: { width: 297, height: 210 },
  };

  let { width, height } = sizeDimensions[size] || sizeDimensions.A1;

  // 가로 방향인 경우 가로/세로 크기 교환
  if (orientation === "portrait") {
    [width, height] = [height, width];
  }

  // Figma는 픽셀 단위를 사용하므로 mm에서 픽셀로 변환 (1mm = 3.7795275591px)
  const pxWidth = Math.round(width * 3.78);
  const pxHeight = Math.round(height * 3.78);

  // 기본 프레임 생성
  const frameResponse = await createFrame(fileKey, pageName, {
    name: `${name} - ${size} ${orientation}`,
    width: pxWidth,
    height: pxHeight,
    x: 0,
    y: 0,
  });

  const frameId = frameResponse.id;

  // 타이틀 블록 생성 (하단에 위치)
  const titleBlockHeight = pxHeight * 0.1; // 높이의 10%
  const titleBlockResponse = await createTitleBlock(fileKey, pageName, {
    frameId,
    x: 0,
    y: pxHeight - titleBlockHeight,
    width: pxWidth,
    height: titleBlockHeight,
    projectName,
    projectNumber,
    client,
    architect,
    date,
    scale,
  });

  return {
    frame: frameResponse,
    titleBlock: titleBlockResponse,
    dimensions: {
      width: pxWidth,
      height: pxHeight,
      contentArea: {
        x: 0,
        y: 0,
        width: pxWidth,
        height: pxHeight - titleBlockHeight,
      },
    },
  };
}

/**
 * 방위 표시기(북쪽 화살표) 생성
 * @param {string} fileKey - Figma 파일 키
 * @param {string} pageName - 페이지 이름
 * @param {Object} properties - 방위 표시기 속성
 * @returns {Promise<Object>} - 생성된 방위 표시기 정보
 */
async function createNorthIndicator(fileKey, pageName, properties) {
  const {
    frameId,
    x = 50,
    y = 50,
    size = 40,
    color = { r: 0, g: 0, b: 0, a: 1 },
  } = properties;

  if (!frameId) {
    throw new Error("방위 표시기를 추가할 프레임 ID가 필요합니다.");
  }

  // 페이지 ID 가져오기
  const pageId = await getPageId(fileKey, pageName);

  // 북쪽 화살표 (삼각형) 데이터
  const arrowData = {
    type: "VECTOR",
    name: "북쪽 표시",
    x,
    y,
    width: size,
    height: size * 1.5,
    fills: [{ type: "SOLID", color }],
    vectorPaths: [
      {
        windingRule: "EVENODD",
        data: `M ${size / 2} 0 L ${size} ${size * 1.5} L 0 ${size * 1.5} Z`,
      },
    ],
  };

  // N 텍스트 데이터
  const textData = {
    type: "TEXT",
    name: "N",
    x: x + size / 2 - 5,
    y: y + size / 2,
    width: 10,
    height: 20,
    characters: "N",
    style: {
      fontSize: size / 2,
      fontWeight: 700,
      textAlignHorizontal: "CENTER",
    },
    fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }], // 흰색 텍스트
  };

  // 요소 생성 API 호출
  const arrowResponse = await axios.post(
    `https://api.figma.com/v1/files/${fileKey}/actions`,
    {
      action: "CREATE",
      pageId,
      parentId: frameId,
      data: arrowData,
    },
    {
      headers: {
        "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  const textResponse = await axios.post(
    `https://api.figma.com/v1/files/${fileKey}/actions`,
    {
      action: "CREATE",
      pageId,
      parentId: frameId,
      data: textData,
    },
    {
      headers: {
        "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    arrow: arrowResponse.data,
    text: textResponse.data,
  };
}

/**
 * 높이 표시 마커 생성
 * @param {string} fileKey - Figma 파일 키
 * @param {string} pageName - 페이지 이름
 * @param {Object} properties - 높이 마커 속성
 * @returns {Promise<Object>} - 생성된 높이 마커 정보
 */
async function createHeightMarkers(fileKey, pageName, properties) {
  const {
    frameId,
    x = 30,
    y = 50,
    height = 400,
    intervals = 5,
    color = { r: 0, g: 0, b: 0, a: 1 },
  } = properties;

  if (!frameId) {
    throw new Error("높이 마커를 추가할 프레임 ID가 필요합니다.");
  }

  // 페이지 ID 가져오기
  const pageId = await getPageId(fileKey, pageName);

  const results = [];
  const intervalHeight = height / intervals;

  // 각 간격마다 선과 높이 텍스트 생성
  for (let i = 0; i <= intervals; i++) {
    const currentY = y + (intervals - i) * intervalHeight;
    const heightValue = i;

    // 선 데이터
    const lineData = {
      type: "LINE",
      name: `높이선 ${heightValue}m`,
      x,
      y: currentY,
      width: 30,
      height: 0,
      strokes: [{ type: "SOLID", color }],
      strokeWeight: 1,
    };

    // 텍스트 데이터
    const textData = {
      type: "TEXT",
      name: `높이 ${heightValue}m`,
      x: x - 25,
      y: currentY - 8,
      width: 20,
      height: 16,
      characters: `${heightValue}m`,
      style: {
        fontSize: 10,
        textAlignHorizontal: "RIGHT",
      },
      fills: [{ type: "SOLID", color }],
    };

    // 요소 생성 API 호출
    const lineResponse = await axios.post(
      `https://api.figma.com/v1/files/${fileKey}/actions`,
      {
        action: "CREATE",
        pageId,
        parentId: frameId,
        data: lineData,
      },
      {
        headers: {
          "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    const textResponse = await axios.post(
      `https://api.figma.com/v1/files/${fileKey}/actions`,
      {
        action: "CREATE",
        pageId,
        parentId: frameId,
        data: textData,
      },
      {
        headers: {
          "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    results.push({
      height: heightValue,
      line: lineResponse.data,
      text: textResponse.data,
    });
  }

  // 수직선 추가
  const verticalLineData = {
    type: "LINE",
    name: "높이 수직선",
    x,
    y,
    width: 0,
    height,
    strokes: [{ type: "SOLID", color }],
    strokeWeight: 1,
  };

  const verticalLineResponse = await axios.post(
    `https://api.figma.com/v1/files/${fileKey}/actions`,
    {
      action: "CREATE",
      pageId,
      parentId: frameId,
      data: verticalLineData,
    },
    {
      headers: {
        "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  results.push({
    verticalLine: verticalLineResponse.data,
  });

  return results;
}

/**
 * 타이틀 블록 생성 (프로젝트 정보 포함)
 * @param {string} fileKey - Figma 파일 키
 * @param {string} pageName - 페이지 이름
 * @param {Object} properties - 타이틀 블록 속성
 * @returns {Promise<Object>} - 생성된 타이틀 블록 정보
 */
async function createTitleBlock(fileKey, pageName, properties) {
  const {
    frameId,
    x = 0,
    y = 0,
    width = 800,
    height = 100,
    projectName = "프로젝트 이름",
    projectNumber = "001",
    client = "고객명",
    architect = "건축가명",
    date = new Date().toLocaleDateString(),
    scale = "다양함",
    backgroundColor = { r: 0.95, g: 0.95, b: 0.95, a: 1 },
  } = properties;

  if (!frameId) {
    throw new Error("타이틀 블록을 추가할 프레임 ID가 필요합니다.");
  }

  // 페이지 ID 가져오기
  const pageId = await getPageId(fileKey, pageName);

  // 타이틀 블록 배경 생성
  const bgData = {
    type: "RECTANGLE",
    name: "타이틀 블록 배경",
    x,
    y,
    width,
    height,
    fills: [{ type: "SOLID", color: backgroundColor }],
    strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0, a: 1 } }],
    strokeWeight: 1,
  };

  // 요소 생성 API 호출
  const bgResponse = await axios.post(
    `https://api.figma.com/v1/files/${fileKey}/actions`,
    {
      action: "CREATE",
      pageId,
      parentId: frameId,
      data: bgData,
    },
    {
      headers: {
        "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  // 프로젝트 이름 텍스트 (굵게)
  const projectNameData = {
    type: "TEXT",
    name: "프로젝트 이름",
    x: x + 20,
    y: y + 20,
    width: width * 0.4,
    height: 30,
    characters: projectName,
    style: {
      fontSize: 24,
      fontWeight: 700,
      textAlignHorizontal: "LEFT",
    },
    fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0, a: 1 } }],
  };

  const projectNameResponse = await axios.post(
    `https://api.figma.com/v1/files/${fileKey}/actions`,
    {
      action: "CREATE",
      pageId,
      parentId: frameId,
      data: projectNameData,
    },
    {
      headers: {
        "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  // 프로젝트 정보 텍스트들
  const infoData = [
    {
      label: "프로젝트 번호",
      value: projectNumber,
      x: x + width * 0.6,
      y: y + 15,
    },
    {
      label: "고객",
      value: client,
      x: x + width * 0.6,
      y: y + 35,
    },
    {
      label: "건축가",
      value: architect,
      x: x + width * 0.6,
      y: y + 55,
    },
    {
      label: "날짜",
      value: date,
      x: x + 20,
      y: y + 60,
    },
    {
      label: "축척",
      value: scale,
      x: x + 20,
      y: y + height - 25,
    },
  ];

  const infoResponses = [];

  for (const info of infoData) {
    const labelData = {
      type: "TEXT",
      name: `${info.label} 라벨`,
      x: info.x,
      y: info.y,
      width: 100,
      height: 16,
      characters: `${info.label}:`,
      style: {
        fontSize: 12,
        fontWeight: 600,
        textAlignHorizontal: "LEFT",
      },
      fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0, a: 1 } }],
    };

    const valueData = {
      type: "TEXT",
      name: `${info.label} 값`,
      x: info.x + 100,
      y: info.y,
      width: 200,
      height: 16,
      characters: info.value,
      style: {
        fontSize: 12,
        fontWeight: 400,
        textAlignHorizontal: "LEFT",
      },
      fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0, a: 1 } }],
    };

    const labelResponse = await axios.post(
      `https://api.figma.com/v1/files/${fileKey}/actions`,
      {
        action: "CREATE",
        pageId,
        parentId: frameId,
        data: labelData,
      },
      {
        headers: {
          "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    const valueResponse = await axios.post(
      `https://api.figma.com/v1/files/${fileKey}/actions`,
      {
        action: "CREATE",
        pageId,
        parentId: frameId,
        data: valueData,
      },
      {
        headers: {
          "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    infoResponses.push({
      label: labelResponse.data,
      value: valueResponse.data,
    });
  }

  return {
    background: bgResponse.data,
    projectName: projectNameResponse.data,
    info: infoResponses,
  };
}

/**
 * 파일에서 페이지 ID 가져오기
 * @param {string} fileKey - Figma 파일 키
 * @param {string} pageName - 페이지 이름
 * @returns {Promise<string>} - 페이지 ID
 */
async function getPageId(fileKey, pageName) {
  const file = await figmaClient.file(fileKey);

  const page = file.document.children.find(
    (child) => child.type === "CANVAS" && child.name === pageName
  );

  if (!page) {
    throw new Error(`'${pageName}' 페이지를 찾을 수 없습니다.`);
  }

  return page.id;
}

module.exports = {
  createFrame,
  createGrid,
  addScaleBar,
  createFloorPlan,
  createElevation,
  createTextStyle,
  createSheet,
};
