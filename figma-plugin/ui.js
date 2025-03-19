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

  // Figma 코드로부터 메시지 리스닝
  window.onmessage = (event) => {
    const message = event.data.pluginMessage;
    if (!message) return;

    switch (message.type) {
      case "connectionSuccess":
        isConnected = true;
        updateConnectionStatus();
        document.getElementById("connect-status").textContent = "연결 성공!";
        document.getElementById("connect-status").className = "status-success";
        setTimeout(() => showView(mainView), 1500);
        break;

      case "connectionFailed":
        isConnected = false;
        updateConnectionStatus();
        document.getElementById(
          "connect-status"
        ).textContent = `연결 실패: ${message.error}`;
        document.getElementById("connect-status").className = "status-error";
        break;

      case "disconnected":
        isConnected = false;
        updateConnectionStatus();
        document.getElementById("connect-status").textContent = "연결 해제됨";
        document.getElementById("connect-status").className = "status-normal";
        setTimeout(() => showView(mainView), 1500);
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

  // 기능 함수들

  /**
   * 특정 뷰 표시
   * @param {HTMLElement} viewToShow - 표시할 뷰 요소
   */
  function showView(viewToShow) {
    // 모든 뷰 숨기기
    [mainView, generatorView, connectView, settingsView].forEach((view) => {
      if (view) view.style.display = "none";
    });

    // 지정된 뷰 표시
    if (viewToShow) viewToShow.style.display = "block";
  }

  /**
   * 연결 상태 업데이트
   */
  function updateConnectionStatus() {
    if (connectionStatus) {
      connectionStatus.textContent = isConnected ? "연결됨" : "연결 안됨";
      connectionStatus.className = isConnected
        ? "status-connected"
        : "status-disconnected";
    }
  }

  /**
   * 템플릿 목록 표시
   * @param {Array} templatesList - 템플릿 목록
   */
  function displayTemplates(templatesList) {
    if (!templateContainer) return;

    templateContainer.innerHTML = "";

    if (!templatesList || templatesList.length === 0) {
      displayDefaultTemplates();
      return;
    }

    templatesList.forEach((template) => {
      const templateCard = document.createElement("div");
      templateCard.className = "template-card";
      templateCard.dataset.templateId = template.id;

      templateCard.innerHTML = `
        <h3>${template.name}</h3>
        <p>${template.description}</p>
      `;

      // 클릭 이벤트
      templateCard.addEventListener("click", () => {
        // 모든 선택 초기화
        document.querySelectorAll(".template-card").forEach((card) => {
          card.classList.remove("selected");
        });

        // 현재 카드 선택
        templateCard.classList.add("selected");
      });

      templateContainer.appendChild(templateCard);
    });
  }

  /**
   * 기본 템플릿 표시 (서버 연결 없는 경우)
   */
  function displayDefaultTemplates() {
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

  /**
   * 알림 표시
   * @param {string} message - 알림 메시지
   * @param {string} level - 알림 레벨 (info, success, warning, error)
   */
  function showNotification(message, level = "info") {
    const notification = document.getElementById("notification");
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification notification-${level}`;
    notification.style.display = "block";

    // 3초 후 자동 숨김
    setTimeout(() => {
      notification.style.display = "none";
    }, 3000);
  }
});
