/**
 * MCP 공통 설정 모듈
 * 
 * 모든 MCP 컴포넌트에서 공유하는 설정값을 관리합니다.
 */

// 기본 설정
const defaultConfig = {
  // 서버 설정
  server: {
    host: 'localhost',
    port: 9000,
    wsProtocol: 'ws',
    httpProtocol: 'http',
    get wsUrl() {
      return `${this.wsProtocol}://${this.host}:${this.port}`;
    },
    get httpUrl() {
      return `${this.httpProtocol}://${this.host}:${this.port}`;
    }
  },
  
  // 통신 설정
  communication: {
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    commandTimeout: 30000
  },
  
  // 템플릿 설정
  templates: {
    basePath: './templates',
    defaultTemplate: 'minimalist'
  },
  
  // 스타일 설정
  styles: {
    colors: {
      primary: { r: 0.1, g: 0.1, b: 0.9, a: 1 },
      secondary: { r: 0.2, g: 0.2, b: 0.7, a: 1 },
      accent: { r: 0.9, g: 0.2, b: 0.2, a: 1 },
      text: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
      background: { r: 1, g: 1, b: 1, a: 1 },
      gray: { r: 0.9, g: 0.9, b: 0.9, a: 1 }
    },
    text: {
      heading: {
        fontName: { family: "Inter", style: "Bold" },
        fontSize: 32
      },
      subheading: {
        fontName: { family: "Inter", style: "SemiBold" },
        fontSize: 24
      },
      body: {
        fontName: { family: "Inter", style: "Regular" },
        fontSize: 16
      },
      caption: {
        fontName: { family: "Inter", style: "Regular" },
        fontSize: 12
      }
    },
    spacing: {
      small: 8,
      medium: 16,
      large: 24,
      xlarge: 40
    }
  },
  
  // 디버그 설정
  debug: false
};

// 환경 감지
const isNode = typeof window === 'undefined';

// 설정 로드 및 병합
function loadConfig() {
  let config = { ...defaultConfig };
  
  // Node.js 환경에서만 파일 시스템에서 설정 로드
  if (isNode) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // 설정 파일 경로
      const configPath = path.resolve(__dirname, '../config.json');
      
      // 설정 파일이 존재하면 로드
      if (fs.existsSync(configPath)) {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // 설정 병합
        config = mergeConfigs(config, userConfig);
      }
    } catch (error) {
      console.warn('설정 파일을 로드하는 중 오류가 발생했습니다:', error.message);
    }
  }
  
  return config;
}

// 설정 병합 (깊은 병합)
function mergeConfigs(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (
        source[key] !== null && 
        typeof source[key] === 'object' && 
        !Array.isArray(source[key]) &&
        target[key] !== null &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        result[key] = mergeConfigs(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

// 설정 로드
const config = loadConfig();

// 설정 모듈 내보내기
if (isNode) {
  module.exports = config;
} else {
  window.MCPConfig = config;
}