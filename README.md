# Figma 포트폴리오 생성기 (MCP 아키텍처)

Figma와 Claude AI를 활용한 아키텍처 포트폴리오 생성기입니다. 이 애플리케이션은 MCP(Multi-Channel Platform) 아키텍처를 사용하여 Node.js 애플리케이션과 Figma 플러그인 간의 양방향 통신을 구현합니다.

## 주요 기능

- **자동화된 포트폴리오 생성**: 미리 정의된 템플릿을 사용하여 몇 번의 클릭만으로 전문적인 포트폴리오 생성
- **다양한 템플릿**: 미니멀리스트, 프로젝트 쇼케이스, 크리에이티브 등 다양한 디자인 템플릿 제공
- **AI 기반 개인화**: Claude AI를 활용한 포트폴리오 콘텐츠 맞춤화 및 디자인 제안
- **양방향 통신**: MCP 아키텍처를 통해 Node.js 앱과 Figma 플러그인 간 효율적인 통신

## 시스템 요구사항

- Node.js 14.0 이상
- Figma 데스크톱 앱
- Anthropic Claude API 키

## 설치 방법

1. 저장소 클론:

```bash
git clone https://github.com/yourusername/figma-portfolio-generator.git
cd figma-portfolio-generator
```

2. 의존성 설치:

```bash
npm install
```

3. `.env` 파일 설정:

```
ANTHROPIC_API_KEY=your_claude_api_key
MCP_PORT=9000
```

4. Figma 플러그인 설치:
   - Figma 앱 열기
   - 플러그인 > 개발 > 새 플러그인 생성 > 존재하는 플러그인에서 불러오기
   - `figma-plugin/manifest.json` 선택

## 사용 방법

### 서버 시작

```bash
npm run serve
```

### 템플릿 목록 보기

```bash
npm run templates
```

### 대화형 포트폴리오 생성

```bash
npm run create
```

## 프로젝트 구조

```
├── figma-plugin/            # Figma 플러그인 코드
│   ├── manifest.json        # 플러그인 매니페스트
│   ├── code.js              # 플러그인 메인 코드
│   ├── ui.html              # 플러그인 UI
│   └── ui.js                # UI 스크립트
├── src/
│   ├── mcp/                 # MCP 아키텍처 코드
│   │   └── core.js          # MCP 핵심 기능
│   ├── services/
│   │   ├── figma-service.js  # Figma 관련 서비스
│   │   └── claude-service.js # Claude AI 서비스
│   ├── templates/
│   │   └── portfolio-templates.js # 포트폴리오 템플릿 정의
│   └── main.js              # 애플리케이션 진입점
├── .env                     # 환경 변수
└── package.json             # 프로젝트 의존성
```

## MCP 아키텍처

MCP(Multi-Channel Platform) 아키텍처는 WebSocket을 통해 Figma 플러그인과 Node.js 애플리케이션 간의 양방향 통신을 가능하게 합니다. 이를 통해 다음과 같은 이점을 얻을 수 있습니다:

1. **네이티브 기능 확장**: Figma 플러그인의 제한된 기능을 Node.js의 강력한 기능으로 확장
2. **AI 통합**: 외부 AI 서비스(Claude)를 Figma 플러그인에 원활하게 통합
3. **실시간 업데이트**: 양방향 통신을 통한 실시간 상태 업데이트 및 명령 처리

## 라이선스

MIT 라이선스

## 연락처

질문이나 제안이 있으시면 [이메일 주소]로 연락 주세요.
