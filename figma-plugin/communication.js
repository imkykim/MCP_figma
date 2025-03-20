/**
 * Figma 플러그인 통신 모듈
 * 
 * Figma 플러그인과 UI, 그리고 MCP 서버 간의 통신을 관리합니다.
 */

// 유틸리티 모듈 가져오기 (Figma 환경에서는 window.MCPUtils로 접근)
const utils = window.MCPUtils || {};

class FigmaCommunication {
  constructor() {
    this.isConnected = false;
    this.connectionId = null;
    this.serverUrl = null;
    this.messageHandlers = new Map();
    this.commandCallbacks = new Map();
    this.commandIdCounter = 1;
    
    // UI 메시지 핸들러 설정
    this.setupMessageHandlers();
  }
  
  /**
   * UI 메시지 핸들러 설정
   */
  setupMessageHandlers() {
    window.onmessage = (event) => {
      const message = event.data.pluginMessage;
      if (!message) return;
      
      // 메시지 타입에 따라 처리
      if (this.messageHandlers.has(message.type)) {
        this.messageHandlers.get(message.type)(message);
      }
      
      // 와일드카드 핸들러가 있으면 실행
      if (this.messageHandlers.has('*')) {
        this.messageHandlers.get('*')(message);
      }
    };
  }
  
  /**
   * MCP 서버에 연결
   * @param {string} url - 서버 URL
   */
  connect(url) {
    this.serverUrl = url;
    
    // UI에 연결 요청 전송
    parent.postMessage({
      pluginMessage: {
        type: 'connect',
        serverUrl: url
      }
    }, '*');
  }
  
  /**
   * MCP 서버 연결 해제
   */
  disconnect() {
    parent.postMessage({
      pluginMessage: {
        type: 'disconnect'
      }
    }, '*');
    
    this.isConnected = false;
    this.connectionId = null;
  }
  
  /**
   * MCP 서버에 메시지 전송
   * @param {object} message - 전송할 메시지
   * @returns {boolean} 전송 성공 여부
   */
  sendMessage(message) {
    if (!this.isConnected) {
      console.warn('MCP 서버에 연결되어 있지 않습니다.');
      return false;
    }
    
    parent.postMessage({
      pluginMessage: {
        type: 'ws-send',
        data: message
      }
    }, '*');
    
    return true;
  }
  
  /**
   * M