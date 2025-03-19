/**
 * Figma 포트폴리오 생성기 플러그인
 * MCP 아키텍처를 통해 Node.js 애플리케이션과 통신합니다.
 */

// 연결 상태 관리
let isConnected = false;
let connectionId = null;
let userSettings = {
  aiModel: "claude-3-sonnet",
  designStyle: "modern",
};

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
figma.showUI(__html__, { width: 450, height: 600 });

// UI로부터 메시지 수신 및 처리
figma.ui.onmessage = async (msg) => {
  console.log("Message from UI:", msg);

  switch (msg.type) {
    // WebSocket 연결 관련
    case "connected":
      isConnected = true;
      figma.notify("MCP 서버에 연결되었습니다");
      break;

    case "disconnected":
      isConnected = false;
      connectionId = null;
      figma.notify("MCP 서버와 연결이 종료되었습니다");
      break;

    case "error":
      isConnected = false;
      figma.notify(`오류: ${msg.message}`);
      break;

    // WebSocket 메시지 수신
    case "ws-message":
      handleServerMessage(msg.data);
      break;

    // 포트폴리오 생성 (템플릿 기반)
    case "generate-portfolio":
      await generatePortfolio(
        msg.templateId,
        msg.portfolioName,
        msg.designerName
      );
      break;

    // AI 프롬프트 처리
    case "process-prompt":
      await processPrompt(msg.prompt, msg.designerName);
      break;

    // 설정 저장
    case "save-settings":
      userSettings = msg.settings;
      figma.notify("설정이 저장되었습니다");
      break;

    // 알림 표시
    case "notify":
      figma.notify(msg.message);
      break;

    // 플러그인 종료
    case "close-plugin":
      figma.closePlugin(msg.message);
      break;
  }
};

// MCP 서버 메시지 처리
function handleServerMessage(message) {
  console.log("Server message:", message);

  if (!message || !message.type) {
    console.warn("Invalid message format");
    return;
  }

  switch (message.type) {
    case "CONNECTION_ESTABLISHED":
      connectionId = message.connectionId;
      figma.notify(`MCP 서버에 연결되었습니다 (ID: ${connectionId})`);
      break;

    case "EXECUTE_COMMAND":
      executeCommand(message.command, message.params, message.commandId);
      break;

    case "commandResult":
      handleCommandResult(message);
      break;

    default:
      console.log(`Unhandled message type: ${message.type}`);
  }
}

// 명령 결과 처리
function handleCommandResult(message) {
  if (!message.command) return;

  switch (message.command) {
    case "PROCESS_PROMPT":
      // AI 프롬프트 처리 결과
      if (message.error) {
        figma.ui.postMessage({
          type: "prompt-processing-failed",
          error: message.error,
        });
        return;
      }

      figma.ui.postMessage({ type: "prompt-processing-success" });

      // AI 응답을 기반으로 포트폴리오 생성
      createPortfolioFromAIResponse(message.result);
      break;

    default:
      console.log(`Unhandled command result: ${message.command}`);
  }
}

// 명령 실행 결과 전송
function sendCommandResponse(commandId, result, error = null) {
  const response = {
    type: "COMMAND_RESPONSE",
    commandId,
    result,
    error,
  };

  // UI에 메시지 전송 (UI가 WebSocket으로 전달)
  figma.ui.postMessage({
    type: "send-message",
    data: response,
  });
}

// AI 프롬프트 처리 및 전송
async function processPrompt(prompt, designerName) {
  try {
    if (!isConnected) {
      throw new Error("MCP 서버에 연결되어 있지 않습니다");
    }

    figma.ui.postMessage({ type: "prompt-processing-started" });
    figma.notify("AI 요청 처리 중...");

    // 프롬프트와 설정 정보를 MCP 서버로 전송
    figma.ui.postMessage({
      type: "send-message",
      data: {
        type: "PROCESS_PROMPT",
        prompt: prompt,
        designerName: designerName,
        settings: userSettings,
      },
    });
  } catch (error) {
    console.error("프롬프트 처리 오류:", error);
    figma.notify(`오류: ${error.message}`);
    figma.ui.postMessage({
      type: "prompt-processing-failed",
      error: error.message,
    });
  }
}

// AI 응답을 기반으로 포트폴리오 생성
async function createPortfolioFromAIResponse(aiResponse) {
  try {
    figma.ui.postMessage({ type: "generation-started" });
    figma.notify("AI 응답을 기반으로 포트폴리오 생성 중...");

    console.log("AI Response:", aiResponse);

    // 새 페이지 생성
    const page = figma.createPage();
    page.name = aiResponse.portfolioName || "AI 생성 포트폴리오";
    figma.currentPage = page;

    // 캔버스 크기 추출
    const canvasWidth =
      aiResponse.canvasSize && aiResponse.canvasSize.width
        ? aiResponse.canvasSize.width
        : 1920;
    const canvasHeight =
      aiResponse.canvasSize && aiResponse.canvasSize.height
        ? aiResponse.canvasSize.height
        : 1080;

    // 배경색 추출
    let backgroundColor = styles.colors.background;
    if (
      aiResponse.style &&
      aiResponse.style.colors &&
      aiResponse.style.colors.background
    ) {
      backgroundColor = convertColor(aiResponse.style.colors.background);
    }

    // 메인 프레임 생성
    const mainFrame = await createFrame({
      name: aiResponse.portfolioName || "AI 생성 포트폴리오",
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: backgroundColor,
    });

    // 여백 및 콘텐츠 너비 설정
    let pagePadding = styles.spacing.xlarge;
    if (
      aiResponse.style &&
      aiResponse.style.spacing &&
      aiResponse.style.spacing.pagePadding
    ) {
      pagePadding = aiResponse.style.spacing.pagePadding;
    }

    let contentWidth = 1600;
    if (aiResponse.layout && aiResponse.layout.contentWidth) {
      contentWidth = aiResponse.layout.contentWidth;
    }

    let currentY = pagePadding;
    const contentX = (canvasWidth - contentWidth) / 2;

    // 각 섹션 생성
    if (aiResponse.sections && Array.isArray(aiResponse.sections)) {
      for (const section of aiResponse.sections) {
        // 섹션 배경색 설정
        let sectionBgColor = null;
        if (section.backgroundColor) {
          sectionBgColor = convertColor(section.backgroundColor);
        }

        // 섹션 생성
        const sectionResult = await createSection({
          frameId: mainFrame.id,
          title: section.title || "섹션",
          x: contentX,
          y: currentY,
          width: contentWidth,
          backgroundColor: sectionBgColor,
        });

        // 섹션 내용 생성
        if (section.content) {
          await createSectionContent(section, sectionResult, contentWidth);
        }

        // 섹션 간격 설정
        let sectionGap = styles.spacing.xlarge;
        if (
          aiResponse.style &&
          aiResponse.style.spacing &&
          aiResponse.style.spacing.sectionGap
        ) {
          sectionGap = aiResponse.style.spacing.sectionGap;
        }

        // 다음 섹션 위치 업데이트
        currentY += sectionResult.height + sectionGap;

        // 필요시 프레임 높이 조정
        if (currentY > mainFrame.height) {
          // 프레임 리사이즈
          const frameNode = figma.currentPage.findOne(
            (node) => node.id === mainFrame.id
          );
          if (frameNode) {
            frameNode.resize(mainFrame.width, currentY + pagePadding);
          }
        }
      }
    }

    figma.notify("AI 기반 포트폴리오가 생성되었습니다!");
    figma.ui.postMessage({ type: "generation-success" });
  } catch (error) {
    console.error("AI 응답 기반 포트폴리오 생성 오류:", error);
    figma.notify(`오류: ${error.message}`);
    figma.ui.postMessage({
      type: "generation-failed",
      error: error.message,
    });
  }
}

// 섹션 내용 생성
async function createSectionContent(section, sectionResult, contentWidth) {
  // 섹션 내 요소 시작 위치
  let elementY = sectionResult.contentY;
  const elementX = styles.spacing.medium;
  const elemWidth = contentWidth - styles.spacing.medium * 2;

  if (!section.content || !Array.isArray(section.content)) return;

  // 섹션의 각 요소를 생성
  for (const element of section.content) {
    const sectionNode = figma.getNodeById(sectionResult.id);

    switch (element.type) {
      case "text":
        let textColor = styles.colors.text;
        if (element.color) {
          textColor = convertColor(element.color);
        }

        const textResult = await createText({
          frameId: sectionResult.id,
          text: element.text || "",
          x: elementX,
          y: elementY,
          width: elemWidth,
          styleType: element.style || "body",
          color: textColor,
          horizontalAlignment: element.alignment || "LEFT",
        });

        const textNode = figma.getNodeById(textResult.id);
        if (textNode) {
          elementY += textNode.height + styles.spacing.medium;
        }
        break;

      case "image":
        let imageColor = styles.colors.gray;
        if (element.color) {
          imageColor = convertColor(element.color);
        }

        const imgHeight = element.height || 300;

        const imgResult = await createImagePlaceholder({
          frameId: sectionResult.id,
          name: element.name || "Image",
          x: elementX,
          y: elementY,
          width: element.width || elemWidth,
          height: imgHeight,
          color: imageColor,
        });

        elementY += imgHeight + styles.spacing.medium;
        break;

      case "rectangle":
        let rectColor = styles.colors.gray;
        if (element.color) {
          rectColor = convertColor(element.color);
        }

        const rectHeight = element.height || 100;

        const rectResult = await createRectangle({
          frameId: sectionResult.id,
          x: elementX,
          y: elementY,
          width: element.width || elemWidth,
          height: rectHeight,
          color: rectColor,
          cornerRadius: element.cornerRadius || 0,
        });

        elementY += rectHeight + styles.spacing.medium;
        break;
    }
  }

  // 섹션 높이 업데이트
  const sectionNode = figma.getNodeById(sectionResult.id);
  if (sectionNode) {
    sectionNode.resize(sectionNode.width, elementY + styles.spacing.medium);
  }
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
        throw new Error(`Unknown command: ${command}`);
    }

    sendCommandResponse(commandId, result);
  } catch (error) {
    console.error(`Command execution error (${command}):`, error);
    sendCommandResponse(commandId, null, error.message);
  }
}

// AI 색상 값을 Figma 색상 값으로 변환
function convertColor(colorObj) {
  if (!colorObj) return null;

  // RGB 객체인 경우 (r, g, b 값이 0-1 사이)
  if ("r" in colorObj && "g" in colorObj && "b" in colorObj) {
    return {
      r: colorObj.r,
      g: colorObj.g,
      b: colorObj.b,
      a: colorObj.a || 1,
    };
  }

  // RGB 값이 0-255 사이인 경우
  if ("red" in colorObj && "green" in colorObj && "blue" in colorObj) {
    return {
      r: colorObj.red / 255,
      g: colorObj.green / 255,
      b: colorObj.blue / 255,
      a: colorObj.alpha || 1,
    };
  }

  // Hex 값인 경우 (예: "#FF5733")
  if (typeof colorObj === "string" && colorObj.startsWith("#")) {
    const hex = colorObj.substring(1);
    return {
      r: parseInt(hex.substr(0, 2), 16) / 255,
      g: parseInt(hex.substr(2, 2), 16) / 255,
      b: parseInt(hex.substr(4, 2), 16) / 255,
      a: 1,
    };
  }

  return styles.colors.text; // 기본값
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

  return { id: frame.id, name: frame.name, width, height };
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
  textNode.x = x;
  textNode.y = y;
  textNode.resize(width, textNode.height);
  textNode.textAlignHorizontal = horizontalAlignment;

  // 폰트 로드 및 적용
  await figma.loadFontAsync(textStyle.fontName);
  textNode.fontName = textStyle.fontName;
  textNode.fontSize = textStyle.fontSize;
  textNode.characters = text;

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

  return {
    id: textNode.id,
    text: textNode.characters,
    height: textNode.height,
  };
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

  return { id: rect.id, height };
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

  return { id: placeholderFrame.id, name: placeholderFrame.name, height };
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

// 템플릿 적용
async function applyTemplate(params) {
  const { template, data } = params;

  // 템플릿의 캔버스 크기 가져오기
  let width = 1920;
  let height = 1080;

  if (template.canvasSize) {
    if (template.canvasSize.width) {
      width = template.canvasSize.width;
    }

    if (template.canvasSize.height) {
      height = template.canvasSize.height;
    }
  }

  // 메인 프레임 생성
  const frame = await createFrame({
    name: (data && data.name) || "포트폴리오",
    width: width,
    height: height,
    backgroundColor: styles.colors.background,
  });

  return frame;
}

// 포트폴리오 생성 (템플릿 기반)
async function generatePortfolio(templateId, portfolioName, designerName) {
  try {
    figma.ui.postMessage({ type: "generation-started" });

    if (!templateId) {
      throw new Error("템플릿이 지정되지 않았습니다");
    }

    // 새 페이지 생성
    const page = figma.createPage();
    page.name = portfolioName || "포트폴리오";
    figma.currentPage = page;

    // 기본 정보
    const userData = {
      name: designerName || "디자이너",
      title: "포트폴리오",
      sections: ["intro", "projects", "skills", "contact"],
    };

    // 템플릿 적용
    const result = await applyTemplate({
      template: { id: templateId },
      data: userData,
    });

    figma.notify("포트폴리오가 생성되었습니다!");
    figma.ui.postMessage({ type: "generation-success" });

    return result;
  } catch (error) {
    console.error("포트폴리오 생성 중 오류:", error);
    figma.notify(`오류: ${error.message}`);
    figma.ui.postMessage({
      type: "generation-failed",
      error: error.message,
    });
  }
}

// Figma 명령어 처리
figma.on("run", ({ command }) => {
  switch (command) {
    case "generate-portfolio":
      figma.ui.postMessage({ type: "show-generator" });
      break;

    case "connect-mcp":
      figma.ui.postMessage({
        type: "connect",
        serverUrl: "ws://localhost:9000",
      });
      break;

    case "show-settings":
      figma.ui.postMessage({ type: "show-settings" });
      break;
  }
});
