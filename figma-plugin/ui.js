/**
 * Figma 포트폴리오 생성기 UI 스크립트
 * HTTP 요청을 사용하여 MCP 서버와 통신합니다
 */

document.addEventListener("DOMContentLoaded", function () {
  // DOM 요소
  var views = {
    main: document.getElementById("main-view"),
    generator: document.getElementById("generator-view"),
    connect: document.getElementById("connect-view"),
    settings: document.getElementById("settings-view"),
  };

  // 상태 표시 요소
  var connectionStatus = document.getElementById("status-indicator");
  var statusText = document.getElementById("status-text");
  var templateContainer = document.getElementById("template-container");

  // 통신 상태 관리
  var serverUrl = "http://localhost:9000"; // HTTP 주소 (WebSocket 대신 사용)
  var isConnected = false;
  var pendingRequests = {};
  var requestCounter = 0;

  // 초기 상태 설정
  showView("main");
  updateConnectionStatus();

  // 버튼 클릭 이벤트 리스너 등록
  document
    .getElementById("create-portfolio-btn")
    .addEventListener("click", function () {
      showView("generator");

      // 템플릿 목록 요청
      if (isConnected) {
        sendHttpRequest("getTemplates", {})
          .then(function (result) {
            if (result && result.templates) {
              displayTemplates(result.templates);
            } else {
              displayDefaultTemplates();
            }
          })
          .catch(function (error) {
            console.error("템플릿 가져오기 오류:", error);
            displayDefaultTemplates();
          });
      } else {
        displayDefaultTemplates();
      }
    });

  document.getElementById("connect-btn").addEventListener("click", function () {
    showView("connect");
  });

  document
    .getElementById("settings-btn")
    .addEventListener("click", function () {
      showView("settings");
      parent.postMessage({ pluginMessage: { type: "getSettings" } }, "*");
    });

  // 연결 관련 버튼
  document
    .getElementById("connect-server-btn")
    .addEventListener("click", function () {
      var serverInput = document.getElementById("server-url").value;

      // WebSocket URL을 HTTP URL로 변환
      if (serverInput.startsWith("ws://")) {
        serverUrl = serverInput.replace("ws://", "http://");
      } else if (serverInput.startsWith("wss://")) {
        serverUrl = serverInput.replace("wss://", "https://");
      } else if (
        !serverInput.startsWith("http://") &&
        !serverInput.startsWith("https://")
      ) {
        serverUrl = "http://" + serverInput;
      } else {
        serverUrl = serverInput;
      }

      // 연결 상태 초기화
      document.getElementById("connection-error").style.display = "none";
      document.getElementById("connection-success").style.display = "none";

      // 연결 테스트
      testConnection(serverUrl);
    });

  document
    .getElementById("disconnect-server-btn")
    .addEventListener("click", function () {
      disconnectServer();
    });

  // 설정 저장 버튼
  document
    .getElementById("save-settings-btn")
    .addEventListener("click", function () {
      var aiModel = document.getElementById("ai-model").value;
      var designStyle = document.getElementById("design-style").value;

      parent.postMessage(
        {
          pluginMessage: {
            type: "saveSettings",
            settings: {
              aiModel: aiModel,
              designStyle: designStyle,
              serverUrl: serverUrl,
            },
          },
        },
        "*"
      );

      showView("main");
    });

  // 뒤로 가기 버튼들
  document
    .getElementById("generator-back-btn")
    .addEventListener("click", function () {
      showView("main");
    });

  document
    .getElementById("connect-back-btn")
    .addEventListener("click", function () {
      showView("main");
    });

  document
    .getElementById("settings-back-btn")
    .addEventListener("click", function () {
      showView("main");
    });

  // 포트폴리오 생성 버튼
  document
    .getElementById("generate-btn")
    .addEventListener("click", function () {
      var portfolioName =
        document.getElementById("portfolio-name").value || "포트폴리오";
      var designerName =
        document.getElementById("designer-name").value || "디자이너 이름";
      var selectedTemplate = document.querySelector(".template-card.selected");

      if (!selectedTemplate) {
        parent.postMessage(
          {
            pluginMessage: {
              type: "notify",
              message: "템플릿을 선택해주세요",
            },
          },
          "*"
        );
        return;
      }

      var templateId = selectedTemplate.dataset.template;

      // 버튼 비활성화 및 로딩 표시
      document.getElementById("generate-btn").disabled = true;
      document.getElementById("generate-btn").textContent = "생성 중...";

      // 연결 상태에 따라 처리
      if (isConnected) {
        // HTTP 요청으로 포트폴리오 생성
        sendHttpRequest("generatePortfolio", {
          templateId: templateId,
          data: {
            name: portfolioName,
            designer: designerName,
          },
        })
          .then(function (result) {
            // 성공 시 메인 뷰로 이동
            parent.postMessage(
              {
                pluginMessage: {
                  type: "portfolioGenerated",
                  result: result,
                },
              },
              "*"
            );

            document.getElementById("generate-btn").disabled = false;
            document.getElementById("generate-btn").textContent =
              "포트폴리오 생성";
            setTimeout(function () {
              showView("main");
            }, 1500);
          })
          .catch(function (error) {
            document.getElementById("generate-btn").disabled = false;
            document.getElementById("generate-btn").textContent =
              "포트폴리오 생성";

            parent.postMessage(
              {
                pluginMessage: {
                  type: "notify",
                  message: "생성 실패: " + error,
                },
              },
              "*"
            );
          });
      } else {
        // 플러그인에 직접 요청
        parent.postMessage(
          {
            pluginMessage: {
              type: "generatePortfolio",
              templateId: templateId,
              portfolioName: portfolioName,
              designerName: designerName,
            },
          },
          "*"
        );
      }
    });

  // HTTP로 연결 테스트
  function testConnection(url) {
    var pingEndpoint = url + "/ping";

    fetch(pingEndpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then(function (response) {
        if (response.ok) {
          return response.json();
        }
        throw new Error("서버 응답이 올바르지 않습니다");
      })
      .then(function (data) {
        // 연결 성공
        isConnected = true;
        updateConnectionStatus();

        document.getElementById("connection-success").textContent =
          "MCP 서버에 연결되었습니다.";
        document.getElementById("connection-success").style.display = "block";

        // 플러그인에 연결 상태 전송
        parent.postMessage(
          {
            pluginMessage: {
              type: "connected",
              serverUrl: url,
            },
          },
          "*"
        );

        setTimeout(function () {
          showView("main");
        }, 1500);
      })
      .catch(function (error) {
        console.error("연결 테스트 오류:", error);

        isConnected = false;
        updateConnectionStatus();

        document.getElementById("connection-error").textContent =
          "서버 연결 오류: " + error.message;
        document.getElementById("connection-error").style.display = "block";

        parent.postMessage(
          {
            pluginMessage: {
              type: "connectionFailed",
              error: error.message,
            },
          },
          "*"
        );
      });
  }

  // 서버 연결 해제
  function disconnectServer() {
    if (isConnected) {
      isConnected = false;
      updateConnectionStatus();

      parent.postMessage(
        {
          pluginMessage: {
            type: "disconnected",
          },
        },
        "*"
      );

      showNotification("서버 연결이 해제되었습니다");
    }
  }

  // HTTP 요청 전송
  function sendHttpRequest(command, params) {
    return new Promise(function (resolve, reject) {
      if (!isConnected) {
        reject("MCP 서버에 연결되어 있지 않습니다");
        return;
      }

      // 요청 ID 생성
      var requestId = "req_" + requestCounter++ + "_" + Date.now();

      // API 엔드포인트 구성
      var endpoint = serverUrl + "/api/command";

      // 요청 본문
      var body = {
        commandId: requestId,
        command: command,
        params: params || {},
      };

      // fetch 요청 전송
      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      })
        .then(function (response) {
          if (response.ok) {
            return response.json();
          }
          throw new Error("서버 응답이 올바르지 않습니다");
        })
        .then(function (data) {
          if (data.error) {
            reject(data.error);
          } else {
            resolve(data.result);
          }
        })
        .catch(function (error) {
          reject(error.message);
        });
    });
  }

  // 뷰 전환 함수
  function showView(viewName) {
    // 모든 뷰 숨기기
    for (var key in views) {
      if (views.hasOwnProperty(key)) {
        views[key].classList.remove("active");
      }
    }

    // 지정된 뷰 표시
    views[viewName].classList.add("active");
  }

  // 연결 상태 업데이트 함수
  function updateConnectionStatus() {
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

  // 알림 표시
  function showNotification(message) {
    console.log("알림:", message);
    parent.postMessage(
      {
        pluginMessage: {
          type: "notify",
          message: message,
        },
      },
      "*"
    );
  }

  // 기본 템플릿 표시 함수
  function displayDefaultTemplates() {
    var defaultTemplates = [
      {
        id: "minimalist",
        name: "미니멀리스트",
        description: "깔끔하고 심플한 디자인",
      },
      {
        id: "project-showcase",
        name: "프로젝트 쇼케이스",
        description: "작업물과 프로젝트를 강조",
      },
      {
        id: "creative",
        name: "크리에이티브",
        description: "창의적이고 예술적인 감각",
      },
    ];

    displayTemplates(defaultTemplates);
  }

  // 템플릿 표시 함수
  function displayTemplates(templateList) {
    if (!templateContainer) return;

    templateContainer.innerHTML = "";

    for (var i = 0; i < templateList.length; i++) {
      var template = templateList[i];
      var templateCard = document.createElement("div");
      templateCard.className = "template-card";
      templateCard.dataset.template = template.id;

      templateCard.innerHTML =
        "<h3>" +
        template.name +
        "</h3>" +
        "<p>" +
        template.description +
        "</p>";

      templateCard.addEventListener("click", function (event) {
        // 모든 템플릿에서 선택 제거
        var allCards = document.querySelectorAll(".template-card");
        for (var j = 0; j < allCards.length; j++) {
          allCards[j].classList.remove("selected");
        }

        // 클릭된 템플릿 선택
        this.classList.add("selected");
      });

      templateContainer.appendChild(templateCard);
    }
  }

  // 플러그인에서 메시지 수신하는 핸들러
  window.onmessage = function (event) {
    var message = event.data.pluginMessage;
    if (!message) return;

    switch (message.type) {
      case "connect":
        if (message.serverUrl) {
          // WebSocket URL을 HTTP URL로 변환
          var url = message.serverUrl;
          if (url.startsWith("ws://")) {
            url = url.replace("ws://", "http://");
          } else if (url.startsWith("wss://")) {
            url = url.replace("wss://", "https://");
          } else if (
            !url.startsWith("http://") &&
            !url.startsWith("https://")
          ) {
            url = "http://" + url;
          }

          testConnection(url);
        }
        break;

      case "disconnect":
        disconnectServer();
        break;

      case "templatesList":
        // 템플릿 목록 표시
        if (message.templates && message.templates.length > 0) {
          displayTemplates(message.templates);
        }
        break;

      case "settings":
        // 설정 적용
        document.getElementById("ai-model").value =
          message.aiModel || "claude-3-sonnet";
        document.getElementById("design-style").value =
          message.designStyle || "modern";
        break;

      case "generationSuccess":
        document.getElementById("generate-btn").disabled = false;
        document.getElementById("generate-btn").textContent = "포트폴리오 생성";
        setTimeout(function () {
          showView("main");
        }, 1500);
        break;

      case "generationFailed":
        document.getElementById("generate-btn").disabled = false;
        document.getElementById("generate-btn").textContent = "포트폴리오 생성";
        break;

      case "show-connect":
        showView("connect");
        break;

      case "show-generator":
        showView("generator");
        break;

      case "show-settings":
        showView("settings");
        break;
    }
  };
});
