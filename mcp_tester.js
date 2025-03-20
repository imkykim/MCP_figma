/**
 * MCP 서버 연결 테스터
 *
 * 이 스크립트는 MCP 서버에 연결하고 통신을 테스트합니다.
 * Node.js 환경에서 실행하여 MCP 서버 연결이 제대로 작동하는지 확인할 수 있습니다.
 *
 * 사용법: node mcp-tester.js
 */

const WebSocket = require("ws");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 기본 설정
const DEFAULT_URL = "ws://localhost:9000";

// 연결된 웹소켓
let ws = null;

// 서버에 연결
function connectToServer(url) {
  console.log(`서버에 연결 중... (${url})`);

  try {
    ws = new WebSocket(url);

    ws.on("open", () => {
      console.log("✅ 서버에 연결되었습니다!");
      console.log(
        '메시지를 입력하거나 "help"를 입력하여 도움말을 볼 수 있습니다.'
      );
      promptUser();
    });

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data);
        console.log("\n📥 서버로부터 메시지 수신:");
        console.log(JSON.stringify(message, null, 2));
        promptUser();
      } catch (error) {
        console.log("\n📥 서버로부터 텍스트 메시지 수신:", data.toString());
        promptUser();
      }
    });

    ws.on("close", (code, reason) => {
      console.log(
        `\n❌ 연결이 종료되었습니다. (코드: ${code}, 사유: ${reason || "없음"})`
      );
      ws = null;
      promptUser();
    });

    ws.on("error", (error) => {
      console.error(`\n⚠️ WebSocket 오류:`, error.message);
      promptUser();
    });
  } catch (error) {
    console.error("⚠️ 연결 오류:", error.message);
    ws = null;
    promptUser();
  }
}

// 메시지 전송
function sendMessage(messageType, params = {}) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.log("⚠️ 서버에 연결되어 있지 않습니다. 먼저 연결하세요.");
    promptUser();
    return;
  }

  const message = {
    type: messageType,
    ...params,
  };

  try {
    ws.send(JSON.stringify(message));
    console.log("📤 메시지 전송 완료:", JSON.stringify(message, null, 2));
  } catch (error) {
    console.error("⚠️ 메시지 전송 중 오류:", error.message);
  }

  promptUser();
}

// 연결 종료
function disconnect() {
  if (ws) {
    ws.close();
    console.log("🔌 서버와의 연결을 종료했습니다.");
  } else {
    console.log("⚠️ 현재 연결된 서버가 없습니다.");
  }

  promptUser();
}

// 사용자 프롬프트 표시
function promptUser() {
  const status =
    ws && ws.readyState === WebSocket.OPEN ? "🟢 연결됨" : "🔴 연결 안됨";
  rl.question(`\n${status} > `, (input) => {
    const command = input.trim().toLowerCase();

    if (command === "exit" || command === "quit") {
      if (ws) ws.close();
      console.log("프로그램을 종료합니다.");
      rl.close();
      return;
    }

    if (command === "help") {
      showHelp();
      return;
    }

    if (command === "connect") {
      rl.question(
        "서버 URL을 입력하세요 (기본값: ws://localhost:9000): ",
        (url) => {
          connectToServer(url.trim() || DEFAULT_URL);
        }
      );
      return;
    }

    if (command === "disconnect") {
      disconnect();
      return;
    }

    if (command === "ping") {
      sendMessage("PING", { timestamp: new Date().toISOString() });
      return;
    }

    if (command === "info") {
      sendMessage("GET_INFO");
      return;
    }

    if (command === "echo") {
      rl.question("에코할 메시지를 입력하세요: ", (message) => {
        sendMessage("ECHO", { message });
      });
      return;
    }

    if (command === "status") {
      if (ws) {
        const states = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
        console.log(`WebSocket 상태: ${states[ws.readyState]}`);
      } else {
        console.log("WebSocket 연결이 없습니다.");
      }
      promptUser();
      return;
    }

    if (command === "raw") {
      rl.question("JSON 메시지를 입력하세요: ", (jsonStr) => {
        try {
          const json = JSON.parse(jsonStr);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(json));
            console.log("📤 메시지 전송 완료:", JSON.stringify(json, null, 2));
          } else {
            console.log("⚠️ 서버에 연결되어 있지 않습니다.");
          }
        } catch (error) {
          console.error("⚠️ 잘못된 JSON 형식입니다:", error.message);
        }
        promptUser();
      });
      return;
    }

    if (command === "test") {
      testConnection();
      return;
    }

    if (command === "") {
      promptUser();
      return;
    }

    console.log(
      '⚠️ 알 수 없는 명령입니다. "help"를 입력하여 도움말을 볼 수 있습니다.'
    );
    promptUser();
  });
}

// 도움말 표시
function showHelp() {
  console.log("\n===== MCP 서버 연결 테스터 도움말 =====");
  console.log("connect    - MCP 서버에 연결합니다");
  console.log("disconnect - 서버와의 연결을 종료합니다");
  console.log("ping       - 서버에 핑 메시지를 보냅니다");
  console.log("info       - 서버 정보를 요청합니다");
  console.log("echo       - 에코 메시지를 보냅니다");
  console.log("status     - 현재 WebSocket 상태를 확인합니다");
  console.log("raw        - 사용자 정의 JSON 메시지를 보냅니다");
  console.log("test       - 기본 연결 테스트를 실행합니다");
  console.log("help       - 이 도움말을 표시합니다");
  console.log("exit       - 프로그램을 종료합니다");
  console.log("=====================================");
  promptUser();
}

// 기본 연결 테스트
function testConnection() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.log("⚠️ 서버에 연결되어 있지 않습니다. 먼저 연결하세요.");
    promptUser();
    return;
  }

  console.log("🧪 연결 테스트 실행 중...");

  const testMessages = [
    { type: "PING", timestamp: new Date().toISOString() },
    { type: "ECHO", message: "Hello from MCP tester" },
    { type: "GET_INFO" },
  ];

  let messageIndex = 0;

  const sendNextMessage = () => {
    if (messageIndex >= testMessages.length) {
      console.log("✅ 모든 테스트 메시지를 전송했습니다.");
      promptUser();
      return;
    }

    const message = testMessages[messageIndex++];
    try {
      ws.send(JSON.stringify(message));
      console.log(
        `📤 테스트 메시지 전송 (${messageIndex}/${testMessages.length}):`,
        JSON.stringify(message, null, 2)
      );
      setTimeout(sendNextMessage, 1000);
    } catch (error) {
      console.error("⚠️ 메시지 전송 중 오류:", error.message);
      promptUser();
    }
  };

  sendNextMessage();
}

// 시작 메시지 표시
console.log("===== MCP 서버 연결 테스터 =====");
console.log("Figma 플러그인과 MCP 서버 간의 통신을 테스트합니다.");
console.log('"help"를 입력하여 도움말을 볼 수 있습니다.');
console.log("================================");

// 시작 시 연결 여부 묻기
rl.question("MCP 서버에 바로 연결하시겠습니까? (Y/n): ", (answer) => {
  if (answer.trim().toLowerCase() !== "n") {
    rl.question(
      "서버 URL을 입력하세요 (기본값: ws://localhost:9000): ",
      (url) => {
        connectToServer(url.trim() || DEFAULT_URL);
      }
    );
  } else {
    promptUser();
  }
});
