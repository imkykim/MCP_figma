/**
 * 건축 프로젝트를 위한 사전 정의된 Figma 템플릿 모음
 * 각 템플릿은 건축 도면의 특정 유형을 생성하기 위한 구조화된 지침 제공
 */

module.exports = {
  /**
   * 기본 주거 평면도 템플릿
   * 축척 1:100 단위의 주거용 평면도 생성
   */
  "residential-floor-plan": {
    name: "주거 평면도",
    description:
      "1:100 축척의 주거용 평면도 템플릿으로, 일반적인 주택 배치를 위한 그리드 포함",
    figmaInstructions: {
      type: "createFloorPlan",
      properties: {
        name: "주거 평면도",
        width: 1000,
        height: 700,
        scale: "1:100",
        showGrid: true,
        showDimensions: true,
      },
    },
  },

  /**
   * 상업 공간 평면도 템플릿
   * 넓은 상업 공간을 위한 대형 평면도 템플릿
   */
  "commercial-floor-plan": {
    name: "상업 공간 평면도",
    description:
      "상업 공간을 위한 대형 평면도 템플릿으로, 상업 공간 레이아웃에 적합한 그리드 시스템 포함",
    figmaInstructions: {
      type: "createFloorPlan",
      properties: {
        name: "상업 공간 평면도",
        width: 1500,
        height: 1000,
        scale: "1:200",
        showGrid: true,
        showDimensions: true,
      },
    },
  },

  /**
   * 건축 입면도 템플릿
   * 건물 전면의 입면도 생성
   */
  "front-elevation": {
    name: "전면 입면도",
    description: "건물 전면의 입면도를 위한 템플릿으로, 높이 마커와 축척 포함",
    figmaInstructions: {
      type: "createElevation",
      properties: {
        name: "전면 입면도",
        width: 1200,
        height: 600,
        scale: "1:100",
        orientation: "front",
      },
    },
  },

  /**
   * 건축 단면도 템플릿
   * 건물의 수직 단면을 보여주는 템플릿
   */
  "building-section": {
    name: "건물 단면도",
    description:
      "건물의 수직 단면을 위한 템플릿으로, 층 높이와 구조 요소 표시에 적합",
    figmaInstructions: {
      type: "createElevation", // 입면도 기능을 단면도에도 사용
      properties: {
        name: "건물 단면도",
        width: 1200,
        height: 600,
        scale: "1:100",
        orientation: "section",
      },
    },
  },

  /**
   * 건축 사이트 계획 템플릿
   * 부지 전체 레이아웃을 위한 대형 템플릿
   */
  "site-plan": {
    name: "사이트 계획",
    description:
      "건축 부지 계획을 위한 대형 템플릿으로, 부지 경계 및 주변 환경 표시에 적합",
    figmaInstructions: {
      type: "createFloorPlan",
      properties: {
        name: "사이트 계획",
        width: 2000,
        height: 1500,
        scale: "1:500",
        showGrid: true,
        showDimensions: true,
      },
    },
  },

  /**
   * A1 건축 프레젠테이션 시트 템플릿
   * 프로젝트 정보가 포함된 완전한 A1 프레젠테이션 시트
   */
  "a1-presentation-sheet": {
    name: "A1 프레젠테이션 시트",
    description:
      "건축 프레젠테이션을 위한 완전한 A1 시트로, 제목 블록 및 프로젝트 정보 포함",
    figmaInstructions: {
      type: "createSheet",
      properties: {
        name: "건축 프레젠테이션",
        size: "A1",
        orientation: "landscape",
        projectName: "건축 프로젝트",
        projectNumber: "ARCH-001",
        client: "클라이언트명",
        architect: "건축가명",
        scale: "표시됨",
      },
    },
  },

  /**
   * 건축 디테일 도면 템플릿
   * 세부 건축 디테일을 표현하기 위한 템플릿
   */
  "architectural-detail": {
    name: "건축 디테일",
    description:
      "건축 디테일을 위한 확대 도면 템플릿으로, 정밀한 표현을 위한 상세 축척 포함",
    figmaInstructions: {
      type: "createFloorPlan",
      properties: {
        name: "건축 디테일",
        width: 800,
        height: 600,
        scale: "1:20",
        showGrid: true,
        showDimensions: true,
      },
    },
  },

  /**
   * 복합 프레젠테이션 템플릿
   * 평면도, 입면도, 단면도가 포함된 복합 레이아웃
   */
  "comprehensive-presentation": {
    name: "종합 프레젠테이션",
    description:
      "평면도, 입면도, 단면도가 하나의 레이아웃에 포함된 종합 프레젠테이션 템플릿",
    figmaInstructions: {
      type: "composite",
      commands: [
        {
          type: "createSheet",
          properties: {
            name: "종합 프레젠테이션",
            size: "A1",
            orientation: "landscape",
            projectName: "종합 건축 프로젝트",
            projectNumber: "ARCH-COMP-001",
            client: "클라이언트명",
            architect: "건축가명",
          },
        },
        {
          type: "createFloorPlan",
          properties: {
            name: "프로젝트 평면도",
            width: 800,
            height: 600,
            x: 50,
            y: 50,
            scale: "1:100",
            showGrid: true,
          },
        },
        {
          type: "createElevation",
          properties: {
            name: "프로젝트 입면도",
            width: 800,
            height: 300,
            x: 900,
            y: 50,
            scale: "1:100",
            orientation: "front",
          },
        },
        {
          type: "createElevation",
          properties: {
            name: "프로젝트 단면도",
            width: 800,
            height: 300,
            x: 900,
            y: 400,
            scale: "1:100",
            orientation: "section",
          },
        },
        {
          type: "createTextStyle",
          properties: {
            name: "프로젝트 제목",
            type: "title",
            x: 50,
            y: 700,
          },
        },
      ],
    },
  },

  /**
   * 건축 다이어그램 템플릿
   * 개념 다이어그램을 위한 간소화된 템플릿
   */
  "concept-diagram": {
    name: "개념 다이어그램",
    description:
      "건축 개념과 다이어그램을 위한 간소화된 템플릿으로, 동선과 관계 표현에 적합",
    figmaInstructions: {
      type: "createFrame",
      properties: {
        name: "개념 다이어그램",
        width: 800,
        height: 800,
        backgroundColor: { r: 0.98, g: 0.98, b: 0.98, a: 1 },
      },
    },
  },

  /**
   * 건축 포트폴리오 레이아웃 템플릿
   * 건축 포트폴리오를 위한 멀티페이지 레이아웃
   */
  "portfolio-layout": {
    name: "포트폴리오 레이아웃",
    description:
      "건축 포트폴리오를 위한 멀티페이지 레이아웃 템플릿으로, 프로젝트 설명과 이미지 배치에 적합",
    figmaInstructions: {
      type: "composite",
      commands: [
        {
          type: "createFrame",
          properties: {
            name: "포트폴리오 커버",
            width: 1000,
            height: 1200,
            backgroundColor: { r: 0.95, g: 0.95, b: 0.95, a: 1 },
          },
        },
        {
          type: "createFrame",
          properties: {
            name: "포트폴리오 내용 페이지",
            width: 1000,
            height: 1200,
            x: 1100,
            y: 0,
            backgroundColor: { r: 1, g: 1, b: 1, a: 1 },
          },
        },
        {
          type: "createFrame",
          properties: {
            name: "프로젝트 갤러리 페이지",
            width: 1000,
            height: 1200,
            x: 2200,
            y: 0,
            backgroundColor: { r: 1, g: 1, b: 1, a: 1 },
          },
        },
        {
          type: "createTextStyle",
          properties: {
            name: "포트폴리오 제목",
            type: "title",
            x: 100,
            y: 100,
          },
        },
      ],
    },
  },
};
