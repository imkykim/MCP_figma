/**
 * MCP 공통 유틸리티 모듈
 * 
 * Node.js 애플리케이션과 Figma 플러그인에서 공통으로 사용하는 유틸리티 함수들을 제공합니다.
 */

// 환경 감지
const isNode = typeof window === 'undefined';
const isFigma = typeof figma !== 'undefined';

/**
 * 고유 ID 생성
 * @returns {string} 고유 ID
 */
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 딥 복사
 * @param {any} obj - 복사할 객체
 * @returns {any} 복사된 객체
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * 객체 병합
 * @param {object} target - 대상 객체
 * @param {object} source - 소스 객체
 * @returns {object} 병합된 객체
 */
function mergeObjects(target, source) {
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
        result[key] = mergeObjects(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * 색상 변환 유틸리티
 */
const colorUtils = {
  /**
   * RGB 색상을 Figma 색상 객체로 변환
   * @param {string} rgb - RGB 색상 문자열 (예: "rgb(255, 0, 0)")
   * @returns {object} Figma 색상 객체
   */
  rgbToFigmaColor(rgb) {
    const match = rgb.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (!match) return { r: 0, g: 0, b: 0 };
    
    return {
      r: parseInt(match[1], 10) / 255,
      g: parseInt(match[2], 10) / 255,
      b: parseInt(match[3], 10) / 255
    };
  },
  
  /**
   * HEX 색상을 Figma 색상 객체로 변환
   * @param {string} hex - HEX 색상 문자열 (예: "#FF0000")
   * @returns {object} Figma 색상 객체
   */
  hexToFigmaColor(hex) {
    hex = hex.replace(/^#/, '');
    
    let r, g, b;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16) / 255;
      g = parseInt(hex[1] + hex[1], 16) / 255;
      b = parseInt(hex[2] + hex[2], 16) / 255;
    } else {
      r = parseInt(hex.substr(0, 2), 16) / 255;
      g = parseInt(hex.substr(2, 2), 16) / 255;
      b = parseInt(hex.substr(4, 2), 16) / 255;
    }
    
    return { r, g, b };
  },
  
  /**
   * Figma 색상 객체를 HEX 색상으로 변환
   * @param {object} color - Figma 색상 객체
   * @returns {string} HEX 색상 문자열
   */
  figmaColorToHex(color) {
    const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
    const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
    const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
    
    return `#${r}${g}${b}`;
  }
};

/**
 * 템플릿 처리 유틸리티
 */
const templateUtils = {
  /**
   * 템플릿 문자열 처리
   * @param {string} template - 템플릿 문자열
   * @param {object} data - 데이터 객체
   * @returns {string} 처리된 문자열
   */
  processTemplate(template, data) {
    return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = data;
      
      for (const k of keys) {
        if (value === undefined || value === null) return match;
        value = value[k];
      }
      
      return value !== undefined && value !== null ? value : match;
    });
  },
  
  /**
   * 템플릿 객체 처리
   * @param {object} template - 템플릿 객체
   * @param {object} data - 데이터 객체
   * @returns {object} 처리된 객체
   */
  processTemplateObject(template, data) {
    const result = deepClone(template);
    
    const processValue = (value) => {
      if (typeof value === 'string') {
        return this.processTemplate(value, data);
      } else if (Array.isArray(value)) {
        return value.map(item => processValue(item));
      } else if (value !== null && typeof value === 'object') {
        const processed = {};
        for (const key in value) {
          processed[key] = processValue(value[key]);
        }
        return processed;
      }
      return value;
    };
    
    return processValue(result);
  }
};

/**
 * 로깅 유틸리티
 */
const logger = {
  _prefix: '[MCP]',
  _debug: false,
  
  /**
   * 로깅 설정
   * @param {object} options - 설정 옵션
   */
  configure(options = {}) {
    if (options.prefix !== undefined) this._prefix = options.prefix;
    if (options.debug !== undefined) this._debug = options.debug;
  },
  
  /**
   * 정보 로그
   * @param {...any} args - 로그 인자
   */
  info(...args) {
    console.log(this._prefix, ...args);
  },
  
  /**
   * 경고 로그
   * @param {...any} args - 로그 인자
   */
  warn(...args) {
    console.warn(this._prefix, ...args);
  },
  
  /**
   * 에러 로그
   * @param {...any} args - 로그 인자
   */
  error(...args) {
    console.error(this._prefix, ...args);
  },
  
  /**
   * 디버그 로그
   * @param {...any} args - 로그 인자
   */
  debug(...args) {
    if (this._debug) {
      console.log(`${this._prefix} [DEBUG]`, ...args);
    }
  }
};

// 모듈 내보내기
const utils = {
  generateId,
  deepClone,
  mergeObjects,
  colorUtils,
  templateUtils,
  logger,
  isNode,
  isFigma
};

// Node.js와 브라우저 환경 모두에서 사용 가능하도록 내보내기
if (isNode) {
  module.exports = utils;
} else {
  window.MCPUtils = utils;
}