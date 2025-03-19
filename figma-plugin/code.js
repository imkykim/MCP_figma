/**
 * Figma 포트폴리오 생성기 플러그인
 * MCP 아키텍처를 통해 Node.js 애플리케이션과 통신합니다.
 */

// WebSocket 연결 관리
let ws = null;
let isConnected = false;
let connectionId = null;
let pendingCommands = new Map();
let serverUrl = "ws://localhost:9000";

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

// 플러그인 시작 시 실행
figma.showUI(__html__, { width: 400, height: 500 });

// 명령 처리
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case "connect":
      await connectToMcpServer(msg.serverUrl || serverUrl);
      break;

    case "disconnect":
      disconnectFromMcpServer();
      break;

    case "generate-portfolio":
      await generatePortfolio(msg.template, msg.data);
      break;

    case "notify":
      figma.notify(msg.message);
      break;

    case "close-plugin":
      figma.closePlugin(msg.message);
      break;
  }
};

// MCP 서버에 연결
async function connectToMcpServer(url) {
  try {
    // 이미 연결되어 있으면 연결 해제
    if (ws !== null) {
      disconnectFromMcpServer();
    }

    serverUrl = url;
    
    // Use figma.ui.postMessage to communicate with the UI
    // which can then use WebSockets
    figma.ui.postMessage({ 
      type: "establish-connection", 
      serverUrl: serverUrl 
    });
    
    // Set a flag to indicate connection is in progress
    isConnected = true;
    figma.notify("MCP 서버 연결 요청을 보냈습니다.");
  } catch (error) {
    console.error("MCP 서버 연결 중 오류:", error);
    figma.notify("MCP 서버 연결 중 오류가 발생했습니다.");
  }
}

// MCP 서버와 연결 해제
function disconnectFromMcpServer() {
  // Send disconnect message to UI
  figma.ui.postMessage({
    type: "disconnect-connection"
  });
  
  // Reset connection state
  ws = null;
  isConnected = false;
  connectionId = null;
  
  figma.notify("MCP 서버와의 연결이 종료되었습니다.");
}

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

// Update figma.ui.onmessage to handle WebSocket messages from UI
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case "connect":
      await connectToMcpServer(msg.serverUrl || serverUrl);
      break;

    case "disconnect":
      disconnectFromMcpServer();
      break;

    case "generate-portfolio":
      await generatePortfolio(msg.template, msg.data);
      break;

    case "notify":
      figma.notify(msg.message);
      break;

    case "close-plugin":
      figma.closePlugin(msg.message);
      break;
      
    // Add new message types for WebSocket communication
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
      isConnected = false;
      break;
      
    case "ws-closed":
      isConnected = false;
      connectionId = null;
      figma.notify("MCP 서버와의 연결이 종료되었습니다.");
      break;
  }
};

// MCP 서버에 메시지 전송
function sendMessage(message) {
  if (isConnected) {
    // Send via UI instead of direct WebSocket
    figma.ui.postMessage({
      type: "ws-send",
      data: message
    });
    return true;
  } else {
    figma.notify("MCP 서버에 연결되어 있지 않습니다.");
    return false;
  }
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
          connected: isConnected,
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

  const frame = figma.createFrame();
  frame.name = name;
  frame.resize(width, height);
  frame.x = x;
  frame.y = y;
  frame.fills = [{ type: "SOLID", color: backgroundColor }];

  // 현재 페이지에 추가
  figma.currentPage.appendChild(frame);

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
  const textNode = figma.createText();
  textNode.characters = text;
  textNode.x = x;
  textNode.y = y;
  textNode.resize(width, textNode.height);
  textNode.textAlignHorizontal = horizontalAlignment;

  // 폰트 로드 및 적용
  await figma.loadFontAsync(textStyle.fontName);
  textNode.fontName = textStyle.fontName;
  textNode.fontSize = textStyle.fontSize;

  // 색상 적용
  textNode.fills = [{ type: "SOLID", color }];

  // 프레임에 추가
  if (frameId) {
    const frame = figma.getNodeById(frameId);
    if (frame && frame.type === "FRAME") {
      frame.appendChild(textNode);
    } else {
      figma.currentPage.appendChild(textNode);
    }
  } else {
    figma.currentPage.appendChild(textNode);
  }

  return { id: textNode.id, text: textNode.characters };
}

// 직사각형 생성
async function createRectangle(params) {
  const {
    frameId,
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    color = styles.colors.gray,
    cornerRadius = 0,
  } = params;

  const rect = figma.createRectangle();
  rect.x = x;
  rect.y = y;
  rect.resize(width, height);
  rect.fills = [{ type: "SOLID", color }];

  if (cornerRadius > 0) {
    rect.cornerRadius = cornerRadius;
  }

  // 프레임에 추가
  if (frameId) {
    const frame = figma.getNodeById(frameId);
    if (frame && frame.type === "FRAME") {
      frame.appendChild(rect);
    } else {
      figma.currentPage.appendChild(rect);
    }
  } else {
    figma.currentPage.appendChild(rect);
  }

  return { id: rect.id };
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
    color = { r: 0.8, g: 0.8, b: 0.8, a: 1 },
  } = params;

  // 플레이스홀더 컨테이너로 프레임 생성
  const placeholderFrame = figma.createFrame();
  placeholderFrame.name = name;
  placeholderFrame.x = x;
  placeholderFrame.y = y;
  placeholderFrame.resize(width, height);
  placeholderFrame.fills = [{ type: "SOLID", color }];

  // 아이콘 추가
  const iconRect = figma.createRectangle();
  iconRect.resize(width * 0.3, height * 0.3);
  iconRect.x = width * 0.35;
  iconRect.y = height * 0.25;
  iconRect.fills = [{ type: "SOLID", color: { r: 0.6, g: 0.6, b: 0.6, a: 1 } }];
  placeholderFrame.appendChild(iconRect);

  // 텍스트 추가
  const textNode = figma.createText();
  await figma.loadFontAsync(styles.text.caption.fontName);
  textNode.fontName = styles.text.caption.fontName;
  textNode.fontSize = styles.text.caption.fontSize;
  textNode.characters = "Add Image";
  textNode.textAlignHorizontal = "CENTER";
  textNode.x = width * 0.5 - textNode.width / 2;
  textNode.y = height * 0.6;
  textNode.fills = [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.4, a: 1 } }];
  placeholderFrame.appendChild(textNode);

  // 프레임에 추가
  if (frameId) {
    const frame = figma.getNodeById(frameId);
    if (frame && frame.type === "FRAME") {
      frame.appendChild(placeholderFrame);
    } else {
      figma.currentPage.appendChild(placeholderFrame);
    }
  } else {
    figma.currentPage.appendChild(placeholderFrame);
  }

  return { id: placeholderFrame.id, name: placeholderFrame.name };
}

// 섹션 생성
async function createSection(params) {
  const {
    frameId,
    title = "Section Title",
    x = 0,
    y = 0,
    width = 800,
    backgroundColor = null,
  } = params;

  // 부모 프레임 가져오기
  let parentFrame;
  if (frameId) {
    parentFrame = figma.getNodeById(frameId);
    if (!parentFrame || parentFrame.type !== "FRAME") {
      throw new Error("유효하지 않은 프레임 ID");
    }
  } else {
    parentFrame = figma.currentPage;
  }

  // 섹션 프레임 생성
  const sectionFrame = figma.createFrame();
  sectionFrame.name = title;
  sectionFrame.x = x;
  sectionFrame.y = y;
  sectionFrame.resize(width, 200); // 초기 높이 (나중에 조정됨)

  if (backgroundColor) {
    sectionFrame.fills = [{ type: "SOLID", color: backgroundColor }];
  } else {
    sectionFrame.fills = []; // 배경색 없음
  }

  // 제목 텍스트 추가
  const titleText = await createText({
    text: title,
    x: styles.spacing.medium,
    y: styles.spacing.medium,
    width: width - styles.spacing.medium * 2,
    styleType: "subheading",
  });

  const titleNode = figma.getNodeById(titleText.id);
  sectionFrame.appendChild(titleNode);

  // 구분선 추가
  const divider = figma.createLine();
  await figma.loadFontAsync(styles.text.body.fontName); // 선 높이를 위한 폰트 로드
  const titleHeight = titleNode.height + styles.spacing.medium * 2;

  divider.x = 0;
  divider.y = titleHeight;
  divider.resize(width, 0);
  divider.strokes = [
    { type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9, a: 1 } },
  ];
  sectionFrame.appendChild(divider);

  // 프레임 높이 업데이트
  sectionFrame.resize(width, titleHeight + styles.spacing.large);

  // 부모 프레임에 추가
  parentFrame.appendChild(sectionFrame);

  return {
    id: sectionFrame.id,
    name: sectionFrame.name,
    height: sectionFrame.height,
    contentY: titleHeight + styles.spacing.medium, // 콘텐츠 시작 Y 위치
  };
}

// 포트폴리오 생성
async function generatePortfolio(template, data) {
  try {
    if (!template) {
      figma.notify("템플릿이 지정되지 않았습니다.");
      return;
    }

    figma.notify("포트폴리오 생성 중...");

    // 새 페이지 생성
    const page = figma.createPage();
    page.name = (data && data.name) || "포트폴리오";
    figma.currentPage = page;

    // 템플릿 적용
    const result = await applyTemplate({ template, data });

    figma.notify("포트폴리오가 생성되었습니다!");
    return result;
  } catch (error) {
    console.error("포트폴리오 생성 중 오류:", error);
    figma.notify(`오류: ${error.message}`);
  }
}

// 템플릿 적용
async function applyTemplate(params) {
  const { template, data } = params;

  // 메인 프레임 생성
  const frame = await createFrame({
    name: (data && data.name) || "포트폴리오",
    width: 1920,
    height: 1080,
    backgroundColor: styles.colors.background,
  });

  return frame;
}

// Figma 명령어 처리
figma.on("run", ({ command }) => {
  switch (command) {
    case "generate-portfolio":
      figma.ui.postMessage({ type: "show-generator" });
      break;

    case "connect-mcp":
      connectToMcpServer(serverUrl);
      break;

    case "show-settings":
      figma.ui.postMessage({ type: "show-settings" });
      break;
  }
});
