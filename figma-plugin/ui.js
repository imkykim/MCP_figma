/**
 * Figma 포트폴리오 생성기 UI 스크립트 - 디버깅 추가 버전
 */

// 디버깅 로그 함수
function debug(message, data = null) {
  const debugMsg = data
    ? `DEBUG: ${message}: ${JSON.stringify(data)}`
    : `DEBUG: ${message}`;
  console.log(debugMsg);

  // 디버그 로그를 플러그인에도 전송
  parent.postMessage(
    {
      pluginMessage: {
        type: "debug-log",
        message: debugMsg,
      },
    },
    "*"
  );
}

document.addEventListener("DOMContentLoaded", () => {
  debug("UI initialized");

  // 모든 뷰 요소
  const mainView = document.getElementById("main-view");
  const generatorView = document.getElementById("generator-view");
  const connectView = document.getElementById("connect-view");
  const settingsView = document.getElementById("settings-view");

  // 상태 표시 요소
  const connectionStatus = document.getElementById("status-indicator");
  const statusText = document.getElementById("status-text");
  const templateContainer = document.getElementById("template-container");

  // 연결 상태
  let isConnected = false;
  let templates = []; // 템플릿 목록 저장

  // WebSocket 연결 관리
  let ws = null;

  // 초기 상태 설정
  showView(mainView);
  updateConnectionStatus();

  // 버튼 클릭 이벤트 리스너 등록
  document
    .getElementById("create-portfolio-btn")
    .addEventListener("click", () => {
      debug("Create portfolio button clicked");
      // 포트폴리오 생성 뷰로 전환
      showView(generatorView);

      // 템플릿 데이터 요청
      if (isConnected) {
        parent.postMessage({ pluginMessage: { type: "getTemplates" } }, "*");
      } else {
        // 연결되지 않은 경우 기본 템플릿 표시
        displayDefaultTemplates();
      }
    });

  document.getElementById("connect-btn").addEventListener("click", () => {
    debug("Connect button clicked");
    // 연결 뷰로 전환
    showView(connectView);
  });

  document.getElementById("settings-btn").addEventListener("click", () => {
    debug("Settings button clicked");
    // 설정 뷰로 전환
    showView(settingsView);
  });

  // 연결 관련 버튼
  document
    .getElementById("connect-server-btn")
    .addEventListener("click", () => {
      const serverUrl = document.getElementById("server-url").value;
      debug("Connect server button clicked", { serverUrl });

      if (serverUrl) {
        try {
          // Create WebSocket directly to test connection
          connectWebSocket(serverUrl);

          // Also notify plugin
          parent.postMessage(
            { pluginMessage: { type: "connect", serverUrl } },
            "*"
          );

          document.getElementById("connection-error").style.display = "none";
          document.getElementById("connection-success").style.display = "none";
        } catch (error) {
          debug("Error sending connection message", {
            error: error.toString(),
          });
          document.getElementById(
            "connection-error"
          ).textContent = `Error: ${error.message}`;
          document.getElementById("connection-error").style.display = "block";
        }
      }
    });

  document
    .getElementById("disconnect-server-btn")
    .addEventListener("click", () => {
      debug("Disconnect button clicked");
      disconnectWebSocket();
      parent.postMessage({ pluginMessage: { type: "disconnect" } }, "*");
    });

  // 설정 저장 버튼
  document.getElementById("save-settings-btn").addEventListener("click", () => {
    const aiModel = document.getElementById("ai-model").value;
    const designStyle = document.getElementById("design-style").value;
    debug("Save settings button clicked", { aiModel, designStyle });

    parent.postMessage(
      {
        pluginMessage: {
          type: "saveSettings",
          settings: { aiModel, designStyle },
        },
      },
      "*"
    );

    showView(mainView);
  });

  // 뒤로 가기 버튼들
  document
    .getElementById("generator-back-btn")
    .addEventListener("click", () => {
      debug("Generator back button clicked");
      showView(mainView);
    });

  document.getElementById("connect-back-btn").addEventListener("click", () => {
    debug("Connect back button clicked");
    showView(mainView);
  });

  document.getElementById("settings-back-btn").addEventListener("click", () => {
    debug("Settings back button clicked");
    showView(mainView);
  });

  // 포트폴리오 생성 버튼
  document.getElementById("generate-btn").addEventListener("click", () => {
    const portfolioName =
      document.getElementById("portfolio-name").value || "포트폴리오";
    const designerName =
      document.getElementById("designer-name").value || "디자이너 이름";

    debug("Generate button clicked", { portfolioName, designerName });

    // 선택된 템플릿 확인
    const selectedTemplateElem = document.querySelector(
      ".template-card.selected"
    );
    if (!selectedTemplateElem) {
      showNotification("템플릿을 선택해주세요", "error");
      return;
    }

    const templateId = selectedTemplateElem.dataset.template;
    debug("Selected template", { templateId });

    // 포트폴리오 생성 요청
    parent.postMessage(
      {
        pluginMessage: {
          type: "generate-portfolio",
          template: templateId,
          data: {
            name: portfolioName,
            designer: designerName,
          },
        },
      },
      "*"
    );

    // 로딩 표시
    document.getElementById("generate-btn").disabled = true;
    document.getElementById("generate-btn").textContent = "생성 중...";
  });

  // Connect to WebSocket server
  function connectWebSocket(url) {
    try {
      debug("Attempting to connect to WebSocket", { url });

      // Close existing connection if any
      if (ws) {
        debug("Closing existing WebSocket connection");
        ws.close();
      }

      // Create new WebSocket connection
      debug("Creating new WebSocket connection");
      ws = new WebSocket(url);

      // Set up event handlers
      ws.onopen = () => {
        debug("WebSocket connection opened");
        isConnected = true;
        updateConnectionStatus();

        // 연결 성공 메시지 표시
        document.getElementById("connection-success").textContent =
          "MCP 서버에 연결되었습니다.";
        document.getElementById("connection-success").style.display = "block";

        // Notify plugin that connection is established
        parent.postMessage(
          {
            pluginMessage: {
              type: "ws-connected",
            },
          },
          "*"
        );

        // Try sending a test message to the server
        try {
          debug("Sending test message to server");
          ws.send(
            JSON.stringify({
              type: "TEST_CONNECTION",
              message: "Hello from Figma plugin",
            })
          );
        } catch (err) {
          debug("Error sending test message", { error: err.toString() });
        }

        setTimeout(() => showView(mainView), 1500);
      };

      ws.onmessage = (event) => {
        debug("WebSocket message received", { data: event.data });
        try {
          const data = JSON.parse(event.data);
          // Forward message to plugin
          parent.postMessage(
            {
              pluginMessage: {
                type: "ws-message",
                data: data,
              },
            },
            "*"
          );
        } catch (error) {
          debug("WebSocket message parsing error", {
            error: error.toString(),
            rawData: event.data,
          });
        }
      };

      ws.onerror = (error) => {
        debug("WebSocket error", { error: error.toString() });
        isConnected = false;
        updateConnectionStatus();

        // 연결 오류 메시지 표시
        document.getElementById("connection-error").textContent =
          "MCP 서버 연결 중 오류가 발생했습니다.";
        document.getElementById("connection-error").style.display = "block";

        // Forward error to plugin
        parent.postMessage(
          {
            pluginMessage: {
              type: "ws-error",
              error: "연결 오류",
            },
          },
          "*"
        );
      };

      ws.onclose = (event) => {
        debug("WebSocket connection closed", {
          code: event.code,
          reason: event.reason,
        });
        isConnected = false;
        updateConnectionStatus();

        // Notify plugin that connection is closed
        parent.postMessage(
          {
            pluginMessage: {
              type: "ws-disconnected",
            },
          },
          "*"
        );
      };

      // Return true to indicate connection attempt started
      return true;
    } catch (error) {
      debug("Error creating WebSocket", { error: error.toString() });
      isConnected = false;
      updateConnectionStatus();

      // 연결 오류 메시지 표시
      document.getElementById(
        "connection-error"
      ).textContent = `연결 오류: ${error.message}`;
      document.getElementById("connection-error").style.display = "block";

      parent.postMessage(
        {
          pluginMessage: {
            type: "ws-error",
            error: error.message,
          },
        },
        "*"
      );

      return false;
    }
  }

  // Disconnect WebSocket
  function disconnectWebSocket() {
    debug("Disconnecting WebSocket");
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  // Send message via WebSocket
  function sendWebSocketMessage(message) {
    debug("Sending WebSocket message", message);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    } else {
      debug("Cannot send message: WebSocket is not connected", {
        connected: !!ws,
        readyState: ws ? ws.readyState : "null",
      });
      showNotification("WebSocket is not connected", "error");
      return false;
    }
  }

  // Figma 코드로부터 메시지 리스닝
  window.onmessage = (event) => {
    const message = event.data.pluginMessage;
    if (!message) return;

    debug("Received message from plugin", message);

    switch (message.type) {
      case "establish-connection":
        debug("Establishing connection", { serverUrl: message.serverUrl });
        connectWebSocket(message.serverUrl);
        break;

      case "disconnect-connection":
        debug("Disconnecting by plugin request");
        disconnectWebSocket();
        break;

      case "ws-send":
        debug("Plugin requested to send message", message.data);
        sendWebSocketMessage(message.data);
        break;

      case "templatesList":
        debug("Received templates list", { count: message.templates?.length });
        templates = message.templates;
        displayTemplates(templates);
        break;

      case "generationSuccess":
        debug("Portfolio generation successful");
        document.getElementById("generate-btn").disabled = false;
        document.getElementById("generate-btn").textContent = "포트폴리오 생성";
        showNotification("포트폴리오가 성공적으로 생성되었습니다!", "success");
        setTimeout(() => showView(mainView), 1500);
        break;

      case "generationFailed":
        debug("Portfolio generation failed", { error: message.error });
        document.getElementById("generate-btn").disabled = false;
        document.getElementById("generate-btn").textContent = "포트폴리오 생성";
        showNotification(`생성 실패: ${message.error}`, "error");
        break;

      case "connected":
        debug("Plugin reports connected state");
        isConnected = true;
        updateConnectionStatus();
        break;

      case "disconnected":
        debug("Plugin reports disconnected state");
        isConnected = false;
        updateConnectionStatus();
        break;

      case "show-generator":
        debug("Showing generator view");
        showView(generatorView);
        break;

      case "show-connect":
        debug("Showing connect view");
        showView(connectView);
        break;

      case "show-settings":
        debug("Showing settings view");
        showView(settingsView);
        break;

      case "settings":
        debug("Received settings", message.settings);
        // 설정 업데이트
        if (message.settings) {
          document.getElementById("ai-model").value =
            message.settings.aiModel || "claude-3-sonnet";
          document.getElementById("design-style").value =
            message.settings.designStyle || "modern";
        }
        break;

      case "notify":
        debug("Notification from plugin", {
          message: message.message,
          level: message.level,
        });
        showNotification(message.message, message.level || "info");
        break;
    }
  };

  // 뷰 전환 함수
  function showView(viewElement) {
    debug("Showing view", { view: viewElement.id });
    // 모든 뷰 숨기기
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.remove("active");
    });

    // 지정된 뷰 표시
    viewElement.classList.add("active");
  }

  // 연결 상태 업데이트 함수
  function updateConnectionStatus() {
    debug("Updating connection status", { isConnected });
    if (connectionStatus && statusText) {
      if (isConnected) {
        connectionStatus.classList.remove("disconnected");
        connectionStatus.classList.add("connected");
        statusText.textContent = "연결됨";
      } else {
        connectionStatus.classList.remove("connected");
        connectionStatus.classList.add("disconnected");
        statusText.textContent = "연결 끊김";
      }
    }
  }

  // 템플릿 표시 함수
  function displayTemplates(templateList) {
    debug("Displaying templates", { count: templateList?.length });
    if (!templateContainer) return;

    templateContainer.innerHTML = "";

    templateList.forEach((template) => {
      const templateCard = document.createElement("div");
      templateCard.className = "template-card";
      templateCard.dataset.template = template.id;

      const templateTitle = document.createElement("h3");
      templateTitle.textContent = template.name;

      const templateDesc = document.createElement("p");
      templateDesc.textContent = template.description;

      templateCard.appendChild(templateTitle);
      templateCard.appendChild(templateDesc);

      templateCard.addEventListener("click", () => {
        // 선택된 템플릿 표시
        document.querySelectorAll(".template-card").forEach((card) => {
          card.classList.remove("selected");
        });
        templateCard.classList.add("selected");
      });

      templateContainer.appendChild(templateCard);
    });
  }

  // 기본 템플릿 표시 함수
  function displayDefaultTemplates() {
    debug("Displaying default templates");
    const defaultTemplates = [
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
    ];

    displayTemplates(defaultTemplates);
  }

  // 알림 표시 함수
  function showNotification(message, type = "info") {
    debug("Showing notification", { message, type });
    // 임시 알림 엘리먼트 생성
    let notificationElement = document.createElement("div");
    notificationElement.className = `notification ${type}`;
    notificationElement.textContent = message;
    notificationElement.style.position = "fixed";
    notificationElement.style.bottom = "20px";
    notificationElement.style.left = "50%";
    notificationElement.style.transform = "translateX(-50%)";
    notificationElement.style.padding = "10px 20px";
    notificationElement.style.borderRadius = "4px";
    notificationElement.style.zIndex = "1000";

    // 타입에 따른 스타일
    switch (type) {
      case "error":
        notificationElement.style.backgroundColor = "#f44336";
        notificationElement.style.color = "white";
        break;
      case "success":
        notificationElement.style.backgroundColor = "#4caf50";
        notificationElement.style.color = "white";
        break;
      default:
        notificationElement.style.backgroundColor = "#2196f3";
        notificationElement.style.color = "white";
    }

    document.body.appendChild(notificationElement);

    // 3초 후 자동 제거
    setTimeout(() => {
      if (document.body.contains(notificationElement)) {
        document.body.removeChild(notificationElement);
      }
    }, 3000);
  }

  // 초기화 시 설정 로드 및 연결 상태 확인
  debug("Requesting initial settings and connection status");
  parent.postMessage({ pluginMessage: { type: "getSettings" } }, "*");
  parent.postMessage({ pluginMessage: { type: "checkConnection" } }, "*");
});
