/**
 * Figma 포트폴리오 생성기 플러그인
 * MCP 아키텍처를 통해 Node.js 애플리케이션과 통신합니다.
 */

// 연결 상태 관리
var isConnected = false;
var connectionId = null;
var serverUrl = "ws://localhost:9000"; // 기본 URL
var pendingRequests = {};
var requestCounter = 0;

// 플러그인 설정
var pluginSettings = {
  aiModel: "claude-3-sonnet",
  designStyle: "modern",
};

// 플러그인 설정 저장에 figma.clientStorage 사용
async function loadSettings() {
  try {
    var settings = await figma.clientStorage.getAsync("settings");
    if (settings) {
      // 설정 값 복사
      for (var key in settings) {
        if (settings.hasOwnProperty(key)) {
          pluginSettings[key] = settings[key];
        }
      }

      if (settings.serverUrl) {
        serverUrl = settings.serverUrl;
      }
    }
  } catch (error) {
    console.error("설정 로드 오류:", error);
  }
}

async function saveSettings(settings) {
  try {
    // 설정 값 병합
    for (var key in settings) {
      if (settings.hasOwnProperty(key)) {
        pluginSettings[key] = settings[key];
      }
    }

    await figma.clientStorage.setAsync("settings", pluginSettings);
  } catch (error) {
    console.error("설정 저장 오류:", error);
  }
}

// 기본 스타일 정의
var styles = {
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

// 설정 로드
loadSettings().then(function () {
  // UI에 연결 상태 전송
  if (isConnected) {
    figma.ui.postMessage({ type: "connected" });
  }
});

// UI로부터 WebSocket을 통해 MCP 서버에 명령 전송
function sendMcpCommand(command, params) {
  return new Promise(function (resolve, reject) {
    if (!isConnected) {
      reject(new Error("MCP 서버에 연결되어 있지 않습니다"));
      return;
    }

    // 요청 ID 생성
    var requestId = "req_" + requestCounter++ + "_" + Date.now();

    // 요청 등록
    pendingRequests[requestId] = {
      resolve: resolve,
      reject: reject,
      time: Date.now(),
    };

    // UI에 명령 전송 요청
    figma.ui.postMessage({
      type: "sendWSCommand",
      requestId: requestId,
      command: command,
      params: params || {},
    });

    // 타임아웃 설정 (15초)
    setTimeout(function () {
      if (pendingRequests[requestId]) {
        var error = new Error("명령 타임아웃: " + command);
        pendingRequests[requestId].reject(error);
        delete pendingRequests[requestId];
      }
    }, 15000);
  });
}

// 명령 처리
figma.ui.onmessage = async function (msg) {
  console.log("UI 메시지 수신:", msg.type);

  switch (msg.type) {
    // WebSocket 관련 메시지
    case "wsConnected":
      isConnected = true;
      serverUrl = msg.serverUrl;
      // 연결 URL 저장
      await saveSettings({ serverUrl: serverUrl });
      figma.notify("MCP 서버에 연결되었습니다");
      break;

    case "wsDisconnected":
      isConnected = false;
      connectionId = null;
      figma.notify("MCP 서버와의 연결이 종료되었습니다");
      break;

    case "wsConnectionEstablished":
      connectionId = msg.connectionId;
      figma.notify("MCP 서버에 연결되었습니다. (ID: " + connectionId + ")");
      break;

    case "wsError":
      isConnected = false;
      figma.notify("MCP 서버 연결 오류: " + msg.error);
      break;

    case "wsCommandResult":
      // 명령 응답 처리
      var request = pendingRequests[msg.requestId];
      if (request) {
        request.resolve(msg.result);
        delete pendingRequests[msg.requestId];
      }
      break;

    case "wsCommandError":
      // 명령 오류 처리
      var request = pendingRequests[msg.requestId];
      if (request) {
        request.reject(new Error(msg.error));
        delete pendingRequests[msg.requestId];
      }
      break;

    // 일반 명령
    case "connect":
      // UI에 연결 요청 전달
      figma.ui.postMessage({
        type: "connect",
        serverUrl: msg.serverUrl || serverUrl,
      });
      break;

    case "disconnect":
      // UI에 연결 해제 요청 전달
      figma.ui.postMessage({ type: "disconnect" });
      break;

    case "generatePortfolio":
      await generatePortfolio(msg.templateId, {
        name: msg.portfolioName,
        designer: msg.designerName,
      });
      break;

    case "getSettings":
      // 현재 설정 정보 UI로 전송
      figma.ui.postMessage({
        type: "settings",
        aiModel: pluginSettings.aiModel,
        designStyle: pluginSettings.designStyle,
      });
      break;

    case "saveSettings":
      if (msg.settings) {
        await saveSettings(msg.settings);
        figma.notify("설정이 저장되었습니다");
      }
      break;

    case "portfolioGenerated":
      // UI로부터 생성된 포트폴리오 정보 수신
      figma.notify("포트폴리오가 생성되었습니다!");
      break;

    case "notify":
      figma.notify(msg.message);
      break;

    case "close-plugin":
      figma.closePlugin(msg.message);
      break;
  }
};

// 기본 템플릿 정보 전송
function sendDefaultTemplates() {
  figma.ui.postMessage({
    type: "templatesList",
    templates: [
      {
        id: "minimalist",
        name: "미니멀리스트",
        description: "깔끔하고 간결한 디자인",
      },
      {
        id: "project-showcase",
        name: "프로젝트 쇼케이스",
        description: "프로젝트 중심 레이아웃",
      },
      {
        id: "creative",
        name: "크리에이티브",
        description: "창의적이고 예술적인 디자인",
      },
    ],
  });
}

// 템플릿 목록 가져오기
async function fetchTemplates() {
  if (!isConnected) {
    sendDefaultTemplates();
    return;
  }

  try {
    // MCP 서버에 템플릿 목록 요청
    var result = await sendMcpCommand("getTemplates", {});

    // 결과가 있으면 UI로 전송
    if (result && result.templates) {
      figma.ui.postMessage({
        type: "templatesList",
        templates: result.templates,
      });
    } else {
      // 결과가 없으면 기본 템플릿 전송
      sendDefaultTemplates();
    }
  } catch (error) {
    console.error("템플릿 로드 오류:", error);
    sendDefaultTemplates();
  }
}

// 포트폴리오 생성
async function generatePortfolio(templateId, data) {
  try {
    if (!templateId) {
      figma.notify("템플릿이 지정되지 않았습니다");
      figma.ui.postMessage({
        type: "generationFailed",
        error: "템플릿이 지정되지 않았습니다",
      });
      return;
    }

    figma.notify("포트폴리오 생성 중...");

    // 새 페이지 생성
    var page = figma.createPage();
    page.name = data.name || "포트폴리오";
    figma.currentPage = page;

    if (isConnected) {
      try {
        // MCP 서버에 포트폴리오 생성 요청
        var result = await sendMcpCommand("generatePortfolio", {
          templateId: templateId,
          data: data,
        });

        // MCP 응답 처리
        figma.notify("포트폴리오가 생성되었습니다!");
        figma.ui.postMessage({ type: "generationSuccess" });

        return result;
      } catch (error) {
        console.error("포트폴리오 생성 중 오류:", error);
        figma.notify("오류: " + error.message);
        figma.ui.postMessage({
          type: "generationFailed",
          error: error.message,
        });
      }
    } else {
      // 로컬 템플릿 적용
      var result = await applyTemplate({
        template: {
          id: templateId,
          name: data.name || "포트폴리오",
        },
        data: data,
      });

      figma.notify("포트폴리오가 생성되었습니다!");
      figma.ui.postMessage({ type: "generationSuccess" });

      return result;
    }
  } catch (error) {
    console.error("포트폴리오 생성 중 오류:", error);
    figma.notify("오류: " + error.message);
    figma.ui.postMessage({
      type: "generationFailed",
      error: error.message,
    });
  }
}

// 프레임 생성
async function createFrame(params) {
  var name = params.name || "New Frame";
  var width = params.width || 800;
  var height = params.height || 600;
  var x = params.x || 0;
  var y = params.y || 0;
  var backgroundColor = params.backgroundColor || styles.colors.background;

  var frame = figma.createFrame();
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
  var text = params.text || "";
  var frameId = params.frameId;
  var x = params.x || 0;
  var y = params.y || 0;
  var width = params.width || 300;
  var styleType = params.styleType || "body";
  var color = params.color || styles.colors.text;
  var horizontalAlignment = params.horizontalAlignment || "LEFT";

  // 텍스트 스타일 가져오기
  var textStyle = styles.text[styleType] || styles.text.body;

  // 텍스트 노드 생성
  var textNode = figma.createText();
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
  textNode.fills = [{ type: "SOLID", color: color }];

  // 프레임에 추가
  if (frameId) {
    var frame = figma.getNodeById(frameId);
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

// 템플릿 적용
async function applyTemplate(params) {
  var template = params.template;
  var data = params.data;

  // 메인 프레임 생성
  var frame = await createFrame({
    name: (data && data.name) || (template && template.name) || "포트폴리오",
    width: 1920,
    height: 1080,
    backgroundColor: styles.colors.background,
  });

  // 간단한 텍스트 추가
  await createText({
    frameId: frame.id,
    text: (data.name || "포트폴리오") + " - " + (data.designer || "디자이너"),
    x: 50,
    y: 50,
    width: 500,
    styleType: "heading",
  });

  return frame;
}

// Figma 명령어 처리
figma.on("run", function (event) {
  var command = event.command;

  switch (command) {
    case "generate-portfolio":
      figma.ui.postMessage({ type: "show-generator" });
      break;

    case "connect-mcp":
      // UI 표시하고 연결 탭으로 이동
      figma.ui.postMessage({ type: "show-connect" });
      break;

    case "show-settings":
      figma.ui.postMessage({ type: "show-settings" });
      break;
  }
});
