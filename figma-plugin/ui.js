/**
 * Figma 포트폴리오 생성기 UI 스크립트
 */

document.addEventListener("DOMContentLoaded", () => {
  // 모든 뷰 요소
  const mainView = document.getElementById("main-view");
  const generatorView = document.getElementById("generator-view");
  const connectView = document.getElementById("connect-view");
  const settingsView = document.getElementById("settings-view");

  // 상태 표시 요소
  const connectionStatus = document.getElementById("connection-status");
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
    // 연결 뷰로 전환
    showView(connectView);
  });

  document.getElementById("settings-btn").addEventListener("click", () => {
    // 설정 뷰로 전환
    showView(settingsView);
  });

  // 연결 관련 버튼
  document
    .getElementById("connect-server-btn")
    .addEventListener("click", () => {
      const serverUrl = document.getElementById("server-url").value;
      if (serverUrl) {
        parent.postMessage(
          { pluginMessage: { type: "connect", serverUrl } },
          "*"
        );
        document.getElementById("connect-status").textContent = "연결 중...";
        document.getElementById("connect-status").className =
          "status-connecting";
      }
    });

  document.getElementById("disconnect-btn").addEventListener("click", () => {
    parent.postMessage({ pluginMessage: { type: "disconnect" } }, "*");
  });

  // 설정 저장 버튼
  document.getElementById("save-settings-btn").addEventListener("click", () => {
    const aiModel = document.getElementById("ai-model").value;
    const designStyle = document.getElementById("design-style").value;

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
  document.querySelectorAll(".back-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      showView(mainView);
    });
  });

  // 포트폴리오 생성 버튼
  document.getElementById("generate-btn").addEventListener("click", () => {
    const portfolioName =
      document.getElementById("portfolio-name").value || "포트폴리오";
    const designerName =
      document.getElementById("designer-name").value || "디자이너 이름";

    // 선택된 템플릿 확인
    const selectedTemplateElem = document.querySelector(
      ".template-card.selected"
    );
    if (!selectedTemplateElem) {
      showNotification("템플릿을 선택해주세요", "error");
      return;
    }

    const templateId = selectedTemplateElem.dataset.templateId;

    // 포트폴리오 생성 요청
    parent.postMessage(
      {
        pluginMessage: {
          type: "generatePortfolio",
          portfolioName,
          designerName,
          templateId,
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
      // Close existing connection if any
      if (ws) {
        ws.close();
      }
      
      // Create new WebSocket connection
      ws = new WebSocket(url);
      
      // Set up event handlers
      ws.onopen = () => {
        // Notify plugin that connection is established
        parent.postMessage({
          pluginMessage: {
            type: "ws-connected"
          }
        }, '*');
        
        isConnected = true;
        updateConnectionStatus();
        document.getElementById("connect-status").textContent = "연결 성공!";
        document.getElementById("connect-status").className = "status-success";
        setTimeout(() => showView(mainView), 1500);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Forward message to plugin
          parent.postMessage({
            pluginMessage: {
              type: "ws-message",
              data: data
            }
          }, '*');
        } catch (error) {
          console.error("WebSocket message parsing error:", error);
        }
      };
      
      ws.onerror = (error) => {
        // Forward error to plugin
        parent.postMessage({
          pluginMessage: {
            type: "ws-error",
            error: "WebSocket connection error"
          }
        }, '*');
        
        isConnected = false;
        updateConnectionStatus();
        document.getElementById("connect-status").textContent = "연결 실패";
        document.getElementById("connect-status").className = "status-error";
      };
      
      ws.onclose = () => {
        // Notify plugin that connection is closed
        parent.postMessage({
          pluginMessage: {
            type: "ws-closed"
          }
        }, '*');
        
        isConnected = false;
        updateConnectionStatus();
        document.getElementById("connect-status").textContent = "연결 해제됨";
        document.getElementById("connect-status").className = "status-normal";
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      parent.postMessage({
        pluginMessage: {
          type: "ws-error",
          error: error.message
        }
      }, '*');
      
      isConnected = false;
      updateConnectionStatus();
      document.getElementById("connect-status").textContent = `연결 실패: ${error.message}`;
      document.getElementById("connect-status").className = "status-error";
    }
  }
  
  // Disconnect WebSocket
  function disconnectWebSocket() {
    if (ws) {
      ws.close();
      ws = null;
    }
  }
  
  // Send message via WebSocket
  function sendWebSocketMessage(message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.error("Cannot send message: WebSocket is not connected");
      parent.postMessage({
        pluginMessage: {
          type: "notify",
          message: "WebSocket is not connected"
        }
      }, '*');
    }
  }

  // Figma 코드로부터 메시지 리스닝
  window.onmessage = (event) => {
    const message = event.data.pluginMessage;
    if (!message) return;

    switch (message.type) {
      case "establish-connection":
        connectWebSocket(message.serverUrl);
        break;
        
      case "disconnect-connection":
        disconnectWebSocket();
        break;
        
      case "ws-send":
        sendWebSocketMessage(message.data);
        break;
        
      case "templatesList":
        templates = message.templates;
        displayTemplates(templates);
        break;

      case "generationSuccess":
        document.getElementById("generate-btn").disabled = false;
        document.getElementById("generate-btn").textContent = "포트폴리오 생성";
        showNotification("포트폴리오가 성공적으로 생성되었습니다!", "success");
        setTimeout(() => showView(mainView), 1500);
        break;

      case "generationFailed":
        document.getElementById("generate-btn").disabled = false;
        document.getElementById("generate-btn").textContent = "포트폴리오 생성";
        showNotification(`생성 실패: ${message.error}`, "error");
        break;

      case "notify":
        showNotification(message.message, message.level || "info");
        break;
    }
  };
  
  // 뷰 전환 함수
  function showView(viewElement) {
    // 모든 뷰 숨기기
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.remove("active");
    });
    
    // 지정된 뷰 표시
    viewElement.classList.add("active");
  }
  
  // 연결 상태 업데이트 함수
  function updateConnectionStatus() {
    if (connectionStatus) {
      const indicator = document.getElementById("status-indicator");
      const statusText = document.getElementById("status-text");
      
      if (isConnected) {
        indicator.classList.remove("disconnected");
        indicator.classList.add("connected");
        statusText.textContent = "연결됨";
      } else {
        indicator.classList.remove("connected");
        indicator.classList.add("disconnected");
        statusText.textContent = "연결 끊김";
      }
    }
  }
  
  // 알림 표시 함수
  function showNotification(message, level = "info") {
    const notification = document.getElementById("notification");
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${level}`;
    notification.style.display = "block";
    
    setTimeout(() => {
      notification.style.display = "none";
    }, 3000);
  }
  
  // 기본 템플릿 표시 함수
  function displayDefaultTemplates() {
    const defaultTemplates = [
      { id: "minimalist", name: "미니멀리스트 디자이너", description: "깔끔하고 심플한 디자인의 포트폴리오 템플릿입니다." },
      { id: "project-showcase", name: "프로젝트 쇼케이스", description: "작업물과 프로젝트를 강조하는 포트폴리오 템플릿입니다." },
      { id: "creative-professional", name: "크리에이티브 프로페셔널", description: "독창적이고 예술적인 감각의 포트폴리오 템플릿입니다." }
    ];
    
    displayTemplates(defaultTemplates);
  }
  
  // 템플릿 표시 함수
  function displayTemplates(templateList) {
    if (!templateContainer) return;
    
    templateContainer.innerHTML = "";
    
    templateList.forEach(template => {
      const templateCard = document.createElement("div");
      templateCard.className = "template-card";
      templateCard.dataset.templateId = template.id;
      
      const templateTitle = document.createElement("h3");
      templateTitle.textContent = template.name;
      
      const templateDesc = document.createElement("p");
      templateDesc.textContent = template.description;
      
      templateCard.appendChild(templateTitle);
      templateCard.appendChild(templateDesc);
      
      templateCard.addEventListener("click", () => {
        // 선택된 템플릿 표시
        document.querySelectorAll(".template-card").forEach(card => {
          card.classList.remove("selected");
        });
        templateCard.classList.add("selected");
      });
      
      templateContainer.appendChild(templateCard);
    });
  }
});
