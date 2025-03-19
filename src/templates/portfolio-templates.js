/**
 * 포트폴리오 템플릿
 * 다양한 포트폴리오 레이아웃 템플릿을 정의합니다.
 */

// 기본 섹션 정의
const defaultSections = {
  intro: {
    title: "소개",
    required: true,
    description: "디자이너 소개 및 작업 철학",
    minHeight: 300,
  },
  projects: {
    title: "프로젝트",
    required: true,
    description: "주요 프로젝트 전시",
    minHeight: 500,
  },
  skills: {
    title: "기술",
    required: false,
    description: "기술 및 역량",
    minHeight: 200,
  },
  experience: {
    title: "경력",
    required: false,
    description: "직업 경력 및 경험",
    minHeight: 200,
  },
  education: {
    title: "교육",
    required: false,
    description: "학력 및 교육 배경",
    minHeight: 150,
  },
  contact: {
    title: "연락처",
    required: true,
    description: "연락처 정보",
    minHeight: 150,
  },
};

// 미니멀리스트 템플릿
const minimalistTemplate = {
  id: "minimalist",
  name: "미니멀리스트",
  description: "깔끔하고 간결한 미니멀 디자인",
  canvasSize: {
    width: 1200,
    height: 2400,
  },
  style: {
    colors: {
      background: "#FFFFFF",
      primary: "#000000",
      secondary: "#CCCCCC",
      accent: "#3D5AF1",
    },
    fonts: {
      heading: {
        family: "Inter",
        weight: "Bold",
        size: 32,
      },
      subheading: {
        family: "Inter",
        weight: "Medium",
        size: 24,
      },
      body: {
        family: "Inter",
        weight: "Regular",
        size: 16,
      },
      caption: {
        family: "Inter",
        weight: "Regular",
        size: 12,
      },
    },
    spacing: {
      pagePadding: 100,
      sectionGap: 80,
      elementGap: 24,
    },
  },
  layout: {
    contentWidth: 900, // 중앙 정렬된 콘텐츠의 너비
    columns: 1, // 기본 1열 레이아웃
    gridGap: 24, // 그리드 요소 간 간격
  },
  sections: {
    intro: {
      ...defaultSections.intro,
      layout: {
        type: "centered",
        featuredImage: true,
      },
    },
    projects: {
      ...defaultSections.projects,
      layout: {
        type: "grid",
        columns: 2,
      },
    },
    skills: {
      ...defaultSections.skills,
      layout: {
        type: "horizontal-list",
      },
    },
    contact: {
      ...defaultSections.contact,
      layout: {
        type: "centered",
        compact: true,
      },
    },
  },
};

// 프로젝트 쇼케이스 템플릿
const projectShowcaseTemplate = {
  id: "project-showcase",
  name: "프로젝트 쇼케이스",
  description: "프로젝트 중심 레이아웃",
  canvasSize: {
    width: 1440,
    height: 3000,
  },
  style: {
    colors: {
      background: "#F5F5F5",
      primary: "#212121",
      secondary: "#757575",
      accent: "#FF5722",
    },
    fonts: {
      heading: {
        family: "Montserrat",
        weight: "Bold",
        size: 40,
      },
      subheading: {
        family: "Montserrat",
        weight: "SemiBold",
        size: 28,
      },
      body: {
        family: "Roboto",
        weight: "Regular",
        size: 18,
      },
      caption: {
        family: "Roboto",
        weight: "Light",
        size: 14,
      },
    },
    spacing: {
      pagePadding: 120,
      sectionGap: 100,
      elementGap: 32,
    },
  },
  layout: {
    contentWidth: 1080,
    columns: 1,
    gridGap: 32,
  },
  sections: {
    intro: {
      ...defaultSections.intro,
      layout: {
        type: "split",
        imagePosition: "right",
      },
    },
    projects: {
      ...defaultSections.projects,
      layout: {
        type: "full-width",
        imageSize: "large",
      },
    },
    skills: {
      ...defaultSections.skills,
      layout: {
        type: "card-grid",
        columns: 3,
      },
    },
    experience: {
      ...defaultSections.experience,
      layout: {
        type: "timeline",
      },
    },
    contact: {
      ...defaultSections.contact,
      layout: {
        type: "split",
        compact: false,
      },
    },
  },
};

// 크리에이티브 템플릿
const creativeTemplate = {
  id: "creative",
  name: "크리에이티브",
  description: "창의적이고 예술적인 디자인",
  canvasSize: {
    width: 1500,
    height: 3200,
  },
  style: {
    colors: {
      background: "#232323",
      primary: "#FFFFFF",
      secondary: "#AAAAAA",
      accent: "#FFD166",
    },
    fonts: {
      heading: {
        family: "Playfair Display",
        weight: "Bold",
        size: 48,
      },
      subheading: {
        family: "Playfair Display",
        weight: "Regular",
        size: 32,
      },
      body: {
        family: "Lato",
        weight: "Regular",
        size: 18,
      },
      caption: {
        family: "Lato",
        weight: "Light",
        size: 14,
      },
    },
    spacing: {
      pagePadding: 150,
      sectionGap: 120,
      elementGap: 36,
    },
  },
  layout: {
    contentWidth: 1100,
    columns: 1,
    gridGap: 40,
  },
  sections: {
    intro: {
      ...defaultSections.intro,
      layout: {
        type: "overlay",
        backgroundImage: true,
      },
    },
    projects: {
      ...defaultSections.projects,
      layout: {
        type: "masonry",
        columns: 2,
      },
    },
    skills: {
      ...defaultSections.skills,
      layout: {
        type: "circular",
      },
    },
    experience: {
      ...defaultSections.experience,
      layout: {
        type: "staggered",
      },
    },
    education: {
      ...defaultSections.education,
      layout: {
        type: "horizontal-list",
      },
    },
    contact: {
      ...defaultSections.contact,
      layout: {
        type: "centered",
        stylized: true,
      },
    },
  },
};

// 모든 템플릿 맵
const templates = {
  minimalist: minimalistTemplate,
  "project-showcase": projectShowcaseTemplate,
  creative: creativeTemplate,
};

/**
 * ID로 템플릿 가져오기
 * @param {string} id - 템플릿 ID
 * @returns {Object|null} - 해당 ID의 템플릿 또는 없는 경우 null
 */
function getTemplateById(id) {
  return templates[id] || null;
}

/**
 * 사용 가능한 모든 템플릿 가져오기
 * @returns {Array} - 템플릿 객체 배열
 */
function getAllTemplates() {
  return Object.values(templates);
}

/**
 * 템플릿 목록 가져오기 (간단한 정보만)
 * @returns {Array} - 간단한 템플릿 정보 배열 (id, name, description)
 */
function getTemplateList() {
  return Object.values(templates).map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
  }));
}

/**
 * 템플릿에 섹션 추가 (사용자 지정 템플릿용)
 * @param {string} templateId - 템플릿 ID
 * @param {string} sectionKey - 섹션 키
 * @param {Object} sectionConfig - 섹션 구성
 * @returns {boolean} - 성공 여부
 */
function addSectionToTemplate(templateId, sectionKey, sectionConfig) {
  if (!templates[templateId]) {
    return false;
  }

  templates[templateId].sections[sectionKey] = {
    ...sectionConfig,
  };

  return true;
}

/**
 * 템플릿에서 섹션 제거 (사용자 지정 템플릿용)
 * @param {string} templateId - 템플릿 ID
 * @param {string} sectionKey - 섹션 키
 * @returns {boolean} - 성공 여부
 */
function removeSectionFromTemplate(templateId, sectionKey) {
  if (!templates[templateId] || !templates[templateId].sections[sectionKey]) {
    return false;
  }

  delete templates[templateId].sections[sectionKey];
  return true;
}

/**
 * 템플릿 복제 및 사용자 지정
 * @param {string} sourceTemplateId - 원본 템플릿 ID
 * @param {string} newTemplateId - 새 템플릿 ID
 * @param {string} newTemplateName - 새 템플릿 이름
 * @param {Object} customizations - 사용자 지정 속성 (선택사항)
 * @returns {Object|null} - 새 템플릿 또는 실패 시 null
 */
function cloneTemplate(
  sourceTemplateId,
  newTemplateId,
  newTemplateName,
  customizations = {}
) {
  const sourceTemplate = templates[sourceTemplateId];
  if (!sourceTemplate) {
    return null;
  }

  // 기존 템플릿 깊은 복사
  const newTemplate = JSON.parse(JSON.stringify(sourceTemplate));

  // 필수 속성 업데이트
  newTemplate.id = newTemplateId;
  newTemplate.name = newTemplateName;

  // 사용자 지정 속성 적용
  if (customizations.style) {
    newTemplate.style = {
      ...newTemplate.style,
      ...customizations.style,
    };
  }

  if (customizations.layout) {
    newTemplate.layout = {
      ...newTemplate.layout,
      ...customizations.layout,
    };
  }

  // 새 템플릿 저장
  templates[newTemplateId] = newTemplate;

  return newTemplate;
}

// 모듈 내보내기
module.exports = {
  getTemplateById,
  getAllTemplates,
  getTemplateList,
  addSectionToTemplate,
  removeSectionFromTemplate,
  cloneTemplate,
  defaultSections,
};
