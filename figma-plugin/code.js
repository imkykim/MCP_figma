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
        serverUrl: msg.serverUrl || serverUrl 
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
    data: message
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
    case 'FRAME':
      node = figma.createFrame();
      break;
    case 'TEXT':
      node = figma.createText();
      break;
    case 'RECTANGLE':
      node = figma.createRectangle();
      break;
    case 'LINE':
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

  const frame = await createNode('FRAME', {
    name,
    width,
    height,
    x,
    y,
    backgroundColor
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
  const textNode = await createNode('TEXT', {
    frameId,
    x,
    y,
    width
  });
  
  textNode.characters = text;
  textNode.textAlignHorizontal = horizontalAlignment;

  // 폰트 로드 및 적용
  await figma.loadFontAsync(textStyle.fontName);
  textNode.fontName = textStyle.fontName;
  textNode.fontSize = textStyle.fontSize;

  // 색상 적용
  textNode.fills = [{ type: "SOLID", color }];

  return { id: textNode.id, text:
