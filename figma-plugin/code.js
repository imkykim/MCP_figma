/**
 * Figma 포트폴리오 생성기 플러그인
 * MCP 아키텍처를 통해 Node.js 애플리케이션과 통신합니다.
 */

// 기본 스타일 정의
const styles = {
  colors: {
    primary: { r: 0.1, g: 0.1, b: 0.9, a: 1 },
    secondary: { r: 0.2, g: 0.2, b: 0.7, a: 1 },
    accent: { r: 0.9, g: 0.2, b: 0.2, a: 1 },
    text: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
    background: { r: 1, g: 1, b: 1, a: 1 },
    gray: { r: 0.9, g: 0.9, b: 0.9, a: 1 },
  },
  text: {
    heading: {
      fontName: { family: "Inter", style: "Bold" },
      fontSize: 32,
    },
    subheading: {
      fontName: { family: "Inter", style: "SemiBold" },
      fontSize: 24,
    },
    body: {
      fontName: { family: "Inter", style: "Regular" },
      fontSize: 16,
    },
    caption: {
      fontName: { family: "Inter", style: "Regular" },
      fontSize: 12,
    },
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 40,
  },
};

// MCP 통신 상태
let connectionId = null;
let pendingCommands = new Map();
let serverUrl = "ws://localhost:9000";

// 플러그인 시작 시 실행
figma.showUI(__html__, { width: 400, height: 500 });

// 명령 처리
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case "connect":
      figma.ui.postMessage({
        type: "establish-connection",
        serverUrl: msg.serverUrl || serverUrl,
      });
      break;

    case "disconnect":
      figma.ui.postMessage({ type: "disconnect-connection" });
      break;

    case "generate-portfolio":
      await generatePortfolio(msg.template, msg.data);
      break;

    case "ws-connected":
      connectionId = msg.connectionId;
      figma.notify(`MCP 서버에 연결되었습니다. (ID: ${connectionId})`);
      break;

    case "ws-message":
      handleIncomingMessage(msg.data);
      break;

    case "ws-error":
      console.error("WebSocket 오류:", msg.error);
      figma.notify("MCP 서버 연결 중 오류가 발생했습니다.");
      break;

    case "ws-closed":
      connectionId = null;
      figma.notify("MCP 서버와의 연결이 종료되었습니다.");
      break;

    case "notify":
      figma.notify(msg.message);
      break;

    case "close-plugin":
      figma.closePlugin(msg.message);
      break;
  }
};

// 수신된 메시지 처리
function handleIncomingMessage(message) {
  switch (message.type) {
    case "CONNECTION_ESTABLISHED":
      // 연결 ID 저장
      connectionId = message.connectionId;
      figma.notify(`MCP 서버에 연결되었습니다. (ID: ${connectionId})`);
      break;

    case "EXECUTE_COMMAND":
      // 명령 실행
      executeCommand(message.command, message.params, message.commandId);
      break;

    default:
      console.log("알 수 없는 메시지 타입:", message.type);
  }
}

// MCP 서버에 메시지 전송
function sendMessage(message) {
  figma.ui.postMessage({
    type: "ws-send",
    data: message,
  });
  return true;
}

// 명령 실행 결과 응답
function sendCommandResponse(commandId, result, error = null) {
  const response = {
    type: "COMMAND_RESPONSE",
    commandId,
    result,
    error,
  };

  sendMessage(response);
}

// 명령 실행
async function executeCommand(command, params, commandId) {
  try {
    let result = null;

    switch (command) {
      case "createFrame":
        result = await createFrame(params);
        break;

      case "createText":
        result = await createText(params);
        break;

      case "createRectangle":
        result = await createRectangle(params);
        break;

      case "createImagePlaceholder":
        result = await createImagePlaceholder(params);
        break;

      case "createSection":
        result = await createSection(params);
        break;

      case "applyTemplate":
        result = await applyTemplate(params);
        break;

      case "getPluginInfo":
        result = {
          version: "1.0.0",
          connected: !!connectionId,
          connectionId,
        };
        break;

      default:
        throw new Error(`알 수 없는 명령: ${command}`);
    }

    sendCommandResponse(commandId, result);
  } catch (error) {
    console.error(`명령 실행 중 오류 (${command}):`, error);
    sendCommandResponse(commandId, null, error.message);
  }
}

// 노드 생성 및 조작 유틸리티 함수
async function createNode(type, params = {}) {
  let node;

  // 노드 타입에 따라 생성
  switch (type) {
    case "FRAME":
      node = figma.createFrame();
      break;
    case "TEXT":
      node = figma.createText();
      break;
    case "RECTANGLE":
      node = figma.createRectangle();
      break;
    case "LINE":
      node = figma.createLine();
      break;
    default:
      throw new Error(`지원하지 않는 노드 타입: ${type}`);
  }

  // 공통 속성 설정
  if (params.name) node.name = params.name;
  if (params.x !== undefined) node.x = params.x;
  if (params.y !== undefined) node.y = params.y;

  // 크기 설정
  if (params.width !== undefined && params.height !== undefined) {
    node.resize(params.width, params.height);
  }

  // 색상 설정
  if (params.fills || params.backgroundColor) {
    const color = params.fills || params.backgroundColor;
    node.fills = [{ type: "SOLID", color }];
  }

  // 부모 프레임에 추가
  if (params.frameId) {
    const frame = figma.getNodeById(params.frameId);
    if (frame && frame.type === "FRAME") {
      frame.appendChild(node);
    } else {
      figma.currentPage.appendChild(node);
    }
  } else {
    figma.currentPage.appendChild(node);
  }

  return node;
}

// 프레임 생성
async function createFrame(params) {
  const {
    name = "New Frame",
    width = 800,
    height = 600,
    x = 0,
    y = 0,
    backgroundColor = styles.colors.background,
  } = params;

  const frame = await createNode("FRAME", {
    name,
    width,
    height,
    x,
    y,
    backgroundColor,
  });

  return { id: frame.id, name: frame.name };
}

// 텍스트 생성
async function createText(params) {
  const {
    text = "",
    frameId,
    x = 0,
    y = 0,
    width = 300,
    styleType = "body",
    color = styles.colors.text,
    horizontalAlignment = "LEFT",
  } = params;

  // 텍스트 스타일 가져오기
  const textStyle = styles.text[styleType] || styles.text.body;

  // 텍스트 노드 생성
  const textNode = await createNode("TEXT", {
    frameId,
    x,
    y,
    width,
  });

  textNode.characters = text;
  textNode.textAlignHorizontal = horizontalAlignment;

  // 폰트 로드 및 적용
  await figma.loadFontAsync(textStyle.fontName);
  textNode.fontName = textStyle.fontName;
  textNode.fontSize = textStyle.fontSize;

  // 색상 적용
  textNode.fills = [{ type: "SOLID", color }];

  return {
    id: textNode.id,
    text: textNode.characters,
    width: textNode.width,
    height: textNode.height,
  };
}

// 사각형 생성
async function createRectangle(params) {
  const {
    frameId,
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    cornerRadius = 0,
    color = styles.colors.primary,
    name = "Rectangle",
  } = params;

  const rect = await createNode("RECTANGLE", {
    frameId,
    name,
    x,
    y,
    width,
    height,
    color,
  });

  if (cornerRadius > 0) {
    rect.cornerRadius = cornerRadius;
  }

  return {
    id: rect.id,
    name: rect.name,
    width: rect.width,
    height: rect.height,
  };
}

// 이미지 플레이스홀더 생성
async function createImagePlaceholder(params) {
  const {
    frameId,
    name = "Image Placeholder",
    x = 0,
    y = 0,
    width = 300,
    height = 200,
    backgroundColor = { r: 0.9, g: 0.9, b: 0.9, a: 1 },
  } = params;

  // 이미지 플레이스홀더로 사용할 사각형 생성
  const placeholder = await createNode("RECTANGLE", {
    frameId,
    name,
    x,
    y,
    width,
    height,
    backgroundColor,
  });

  // 이미지 아이콘 표시용 텍스트 추가
  const centerX = x + width / 2 - 12; // 아이콘 중앙 위치 조정
  const centerY = y + height / 2 - 12;

  const iconText = await createText({
    frameId,
    text: "🖼️",
    x: centerX,
    y: centerY,
    width: 24,
    styleType: "subheading",
    horizontalAlignment: "CENTER",
  });

  return {
    id: placeholder.id,
    name: placeholder.name,
    width: placeholder.width,
    height: placeholder.height,
    iconId: iconText.id,
  };
}

// 섹션 생성
async function createSection(params) {
  const {
    frameId,
    title = "Section",
    x = 0,
    y = 0,
    width = 800,
    height = 0, // 동적으로 계산됨
    backgroundColor = null,
    spacing = styles.spacing.medium,
  } = params;

  // 섹션 프레임 생성
  const sectionFrame = await createNode("FRAME", {
    frameId,
    name: title,
    x,
    y,
    width,
    height: 200, // 초기 높이, 나중에 조정됨
    backgroundColor,
  });

  // 섹션 제목 생성
  const titleHeight = styles.text.subheading.fontSize + spacing;
  const titleNode = await createText({
    frameId: sectionFrame.id,
    text: title,
    x: 0,
    y: 0,
    width: width,
    styleType: "subheading",
  });

  // 컨텐츠를 위한 공간 높이 계산
  const contentY = titleHeight + spacing;

  // 섹션 프레임 높이 조정
  const sectionHeight = contentY + styles.spacing.large;
  sectionFrame.resize(width, sectionHeight);

  // 섹션에 컨텐츠를 추가할 위치를 알려주는 정보 반환
  return {
    id: sectionFrame.id,
    name: sectionFrame.name,
    width: sectionFrame.width,
    height: sectionFrame.height,
    titleId: titleNode.id,
    contentY,
  };
}

// 템플릿 적용
async function applyTemplate(params) {
  const { template, data = {} } = params;

  if (!template) {
    throw new Error("템플릿이 제공되지 않았습니다.");
  }

  try {
    console.log("템플릿 적용 시작:", template.name);

    // 베이스 프레임 생성
    const mainFrame = await createFrame({
      name: data.name ? `${data.name} 포트폴리오` : template.name,
      width: template.canvasSize.width,
      height: template.canvasSize.height,
      backgroundColor: template.style.colors.background,
    });

    // 템플릿의 섹션들을 기반으로 포트폴리오 구성
    const sections = {};
    let currentY = template.style.spacing.pagePadding;

    // 템플릿의 각 섹션을 순회하며 생성
    for (const [sectionKey, sectionConfig] of Object.entries(
      template.sections
    )) {
      // 사용자가 요청한 섹션만 생성 (필수 섹션이거나 사용자가 요청한 섹션)
      if (
        sectionConfig.required ||
        !data.sections ||
        data.sections.includes(sectionKey)
      ) {
        const contentWidth = template.layout.contentWidth;
        const pageWidth = template.canvasSize.width;
        const contentX = (pageWidth - contentWidth) / 2; // 중앙 정렬

        // 섹션 생성
        const section = await createSection({
          frameId: mainFrame.id,
          title: sectionConfig.title,
          x: contentX,
          y: currentY,
          width: contentWidth,
          backgroundColor: null, // 배경색 없음
        });

        sections[sectionKey] = section;

        // 다음 섹션을 위한 Y 위치 업데이트
        currentY += section.height + template.style.spacing.sectionGap;
      }
    }

    // 전체 프레임 높이 조정 (모든 섹션을 담을 수 있게)
    if (currentY > template.canvasSize.height) {
      // 이 부분은 필요에 따라 구현 (프레임 리사이즈)
      // mainFrame.resize(template.canvasSize.width, currentY + template.style.spacing.pagePadding);
    }

    return {
      id: mainFrame.id,
      name: mainFrame.name,
      width: mainFrame.width,
      height: mainFrame.height,
      sections,
    };
  } catch (error) {
    console.error("템플릿 적용 중 오류:", error);
    throw error;
  }
}

// 포트폴리오 생성
async function generatePortfolio(templateId, data) {
  try {
    // 이 함수는 템플릿 정보를 MCP 서버에서 가져와 applyTemplate 함수를 호출
    // MCP 서버에게 템플릿 정보를 요청
    const commandId = `gen_${Date.now()}`;

    // 서버에 요청 전송
    sendMessage({
      type: "command",
      command: "generatePortfolio",
      params: {
        templateId,
        userData: data,
      },
      commandId,
    });

    // 사용자에게 진행 상황 알림
    figma.notify("포트폴리오 생성 요청을 서버에 전송했습니다.", {
      timeout: 2000,
    });

    // 이 함수는 비동기적으로 작동하며, 결과는 handleIncomingMessage에서 처리됨
    return { success: true, message: "포트폴리오 생성 요청이 전송되었습니다." };
  } catch (error) {
    console.error("포트폴리오 생성 요청 중 오류:", error);
    figma.notify("포트폴리오 생성 요청 중 오류가 발생했습니다.", {
      error: true,
    });
    throw error;
  }
}

// 클로드 AI 프롬프트 처리 함수
async function processPrompt(prompt, designerName, settings) {
  try {
    // 프롬프트 처리 요청을 MCP 서버에 전송
    const commandId = `prompt_${Date.now()}`;

    sendMessage({
      type: "command",
      command: "PROCESS_PROMPT",
      params: {
        prompt,
        designerName,
        settings,
      },
      commandId,
    });

    figma.notify("AI 프롬프트 처리 요청을 전송했습니다.", { timeout: 2000 });

    return { success: true, message: "프롬프트 처리 요청이 전송되었습니다." };
  } catch (error) {
    console.error("프롬프트 처리 요청 중 오류:", error);
    figma.notify("프롬프트 처리 요청 중 오류가 발생했습니다.", { error: true });
    throw error;
  }
}
