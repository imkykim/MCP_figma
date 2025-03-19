/**
 * MCP 코어 모듈
 * Node.js 애플리케이션과 Figma 플러그인 간의 통신을 처리합니다.
 */

const WebSocket = require("ws");
const { EventEmitter } = require("events");

// 메시지 이벤트 핸들러
const messageEvents = new EventEmitter();

// 플러그인 연결을 위한 WebSocket 서버
let wss;
let activeConnections = new Map();
let connectionIdCounter = 1;

/**
 * MCP 코어 초기화 - WebSocket 서버 설정
 * @param {number} port - WebSocket 서버 포트
 * @returns {Promise<WebSocket.Server>} - 초기화된 WebSocket 서버
 */
function initialize(port = 9000) {
  return new Promise((resolve, reject) => {
    try {
      // 이미 실행 중인 서버가 있으면 닫기
      if (wss) {
        wss.close();
      }

      // 새 WebSocket 서버 생성
      wss = new WebSocket.Server({ port });

      console.log(`MCP 코어가 포트 ${port}에서 초기화되었습니다.`);

      // 클라이언트 연결 이벤트 처리
      wss.on("connection", (ws) => {
        const connectionId = connectionIdCounter++;
        activeConnections.set(connectionId, ws);

        console.log(
          `새 Figma 플러그인 연결이 설정되었습니다. (ID: ${connectionId})`
        );

        // 클라이언트에 ID 전송
        ws.send(
          JSON.stringify({ type: "CONNECTION_ESTABLISHED", connectionId })
        );

        // 메시지 수신 이벤트 처리
        ws.on("message", (message) => {
          try {
            const parsedMessage = JSON.parse(message);
            handleIncomingMessage(parsedMessage, connectionId);
          } catch (error) {
            console.error("메시지 처리 중 오류:", error);
          }
        });

        // 연결 종료 이벤트 처리
        ws.on("close", () => {
          console.log(
            `Figma 플러그인 연결이 종료되었습니다. (ID: ${connectionId})`
          );
          activeConnections.delete(connectionId);
          messageEvents.emit("connectionClosed", { connectionId });
        });

        // 에러 이벤트 처리
        ws.on("error", (error) => {
          console.error(`WebSocket 오류 (ID: ${connectionId}):`, error);
          messageEvents.emit("error", { connectionId, error });
        });

        // 새 연결 이벤트 발생
        messageEvents.emit("newConnection", { connectionId, ws });
      });

      wss.on("error", (error) => {
        console.error("WebSocket 서버 오류:", error);
        reject(error);
      });

      resolve(wss);
    } catch (error) {
      console.error("MCP 코어 초기화 중 오류:", error);
      reject(error);
    }
  });
}

/**
 * 수신된 메시지 처리
 * @param {Object} message - 수신된 메시지 객체
 * @param {number} connectionId - 메시지를 보낸 연결 ID
 */
function handleIncomingMessage(message, connectionId) {
  // 메시지 타입에 따른 이벤트 발생
  if (message.type) {
    messageEvents.emit(message.type, { ...message, connectionId });
    messageEvents.emit("message", { ...message, connectionId });
  } else {
    console.warn("메시지 타입이 없습니다:", message);
  }
}

/**
 * Figma 플러그인에 메시지 전송
 * @param {Object} message - 전송할 메시지 객체
 * @param {number} connectionId - 전송할 연결 ID (undefined면 전체 연결에 전송)
 * @returns {boolean} - 전송 성공 여부
 */
function sendMessage(message, connectionId) {
  try {
    const messageString = JSON.stringify(message);

    if (connectionId !== undefined) {
      // 특정 연결에만 전송
      const connection = activeConnections.get(connectionId);
      if (connection && connection.readyState === WebSocket.OPEN) {
        connection.send(messageString);
        return true;
      } else {
        console.warn(
          `연결 ID ${connectionId}이(가) 존재하지 않거나 열려있지 않습니다.`
        );
        return false;
      }
    } else {
      // 모든 활성 연결에 전송
      let successCount = 0;
      activeConnections.forEach((connection, id) => {
        if (connection.readyState === WebSocket.OPEN) {
          connection.send(messageString);
          successCount++;
        }
      });

      return successCount > 0;
    }
  } catch (error) {
    console.error("메시지 전송 중 오류:", error);
    return false;
  }
}

/**
 * Figma 플러그인에 명령 전송
 * @param {string} command - 명령 이름
 * @param {Object} params - 명령 매개변수
 * @param {number} connectionId - 전송할 연결 ID
 * @returns {Promise<Object>} - 명령 실행 결과
 */
function executeCommand(command, params = {}, connectionId) {
  return new Promise((resolve, reject) => {
    try {
      // 고유한 명령 ID 생성
      const commandId = `cmd_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // 명령 응답을 기다리는 이벤트 리스너
      const responseHandler = (response) => {
        if (response.commandId === commandId) {
          messageEvents.removeListener("COMMAND_RESPONSE", responseHandler);

          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.result);
          }
        }
      };

      // 응답 이벤트 리스너 등록
      messageEvents.on("COMMAND_RESPONSE", responseHandler);

      // 명령 제한 시간 설정 (10초)
      const timeout = setTimeout(() => {
        messageEvents.removeListener("COMMAND_RESPONSE", responseHandler);
        reject(new Error(`명령 실행 시간이 초과되었습니다: ${command}`));
      }, 10000);

      // 명령 메시지 생성 및 전송
      const commandMessage = {
        type: "EXECUTE_COMMAND",
        commandId,
        command,
        params,
      };

      const sent = sendMessage(commandMessage, connectionId);

      if (!sent) {
        clearTimeout(timeout);
        messageEvents.removeListener("COMMAND_RESPONSE", responseHandler);
        reject(
          new Error("명령을 전송할 수 없습니다. 연결이 없거나 닫혔습니다.")
        );
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * MCP 코어 종료
 * @returns {Promise<void>}
 */
function shutdown() {
  return new Promise((resolve) => {
    if (wss) {
      wss.close(() => {
        console.log("MCP 코어가 종료되었습니다.");
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * 연결 상태 확인
 * @returns {boolean} - 활성 연결이 있는지 여부
 */
function hasActiveConnections() {
  return activeConnections.size > 0;
}

/**
 * 현재 활성 연결 ID 목록 가져오기
 * @returns {Array<number>} - 활성 연결 ID 배열
 */
function getActiveConnectionIds() {
  return Array.from(activeConnections.keys());
}

module.exports = {
  initialize,
  executeCommand,
  sendMessage,
  messageEvents,
  shutdown,
  hasActiveConnections,
  getActiveConnectionIds,
};
