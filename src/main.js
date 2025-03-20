/**
 * Figma 포트폴리오 생성기 - 메인 애플리케이션
 * MCP 아키텍처 기반의 애플리케이션 진입점
 */

// 환경 변수 로드
require("dotenv").config();

// 필수 모듈 가져오기
const chalk = require("chalk");
const { program } = require("commander");
const inquirer = require("inquirer");
const mcpCore = require("./mcp/core");
const figmaService = require("./services/figma-service");
const claudeService = require("./services/claude-service");
const templateService = require("./templates/portfolio-templates");
const claudeAPI = require("./claude-api");

// MCP 서버 포트 설정
let MCP_PORT = process.env.MCP_PORT || 9000;

// 서버 시작 함수
function startServer() {
  console.log(chalk.blue("🚀 MCP 서버 시작 중..."));

  // MCP 서버 시작
  mcpCore
    .initialize(MCP_PORT)
    .then(() => {
      console.log(
        chalk.green(`✅ MCP 서버가 시작되었습니다 (포트: ${MCP_PORT})`)
      );
      console.log(chalk.yellow("Figma 플러그인을 실행하고 서버에 연결하세요."));
      console.log(chalk.yellow(`연결 URL: ws://localhost:${MCP_PORT}`));

      // Start the Claude API server
      claudeAPI.startAPI();
      console.log(
        chalk.green("✅ Claude API 서버가 시작되었습니다 (포트: 3333)")
      );
    })
    .catch((error) => {
      console.error(chalk.red(`❌ MCP 서버 시작 실패: ${error.message}`));
      process.exit(1);
    });

  // 연결 이벤트 리스너 설정
  mcpCore.messageEvents.on("newConnection", ({ connectionId }) => {
    console.log(
      chalk.green(`📡 새 Figma 플러그인 연결됨 (ID: ${connectionId})`)
    );
  });

  // 연결 해제 이벤트 리스너 설정
  mcpCore.messageEvents.on("connectionClosed", ({ connectionId }) => {
    console.log(
      chalk.yellow(`🔌 Figma 플러그인 연결 해제됨 (ID: ${connectionId})`)
    );
  });

  // 메시지 이벤트 리스너 설정
  mcpCore.messageEvents.on("message", (message) => {
    console.log(
      chalk.blue(
        `📨 Figma 플러그인으로부터 메시지 수신: ${JSON.stringify(message)}`
      )
    );

    // 메시지 유형에 따른 처리
    if (message.type === "command") {
      handleCommand(message.command, message.params, message.connectionId);
    } else if (message.type === "PROCESS_PROMPT") {
      handlePromptRequest(message, message.connectionId);
    }
  });

  // 종료 이벤트 리스너 설정
  process.on("SIGINT", () => {
    console.log(chalk.yellow("서버 종료 중..."));
    mcpCore.shutdown().then(() => {
      console.log(chalk.green("서버가 안전하게 종료되었습니다."));
      process.exit(0);
    });
  });
}

/**
 * 포트폴리오 생성 함수
 * @param {Object} options - 포트폴리오 생성 옵션
 * @param {string} connectionId - 연결 ID
 */
async function generatePortfolio(options, connectionId) {
  try {
    console.log(chalk.blue("🎨 포트폴리오 생성 시작..."));

    // 템플릿 검증
    const template = templateService.getTemplateById(options.templateId);
    if (!template) {
      throw new Error(`템플릿을 찾을 수 없습니다: ${options.templateId}`);
    }

    // 데이터 준비
    const userData = {
      name: options.name || "디자이너 이름",
      title: options.title || "직함",
      bio: options.bio || "자기소개",
      sections: options.sections || Object.keys(template.sections),
    };

    // AI 기반 템플릿 개인화 (설정된 경우)
    if (options.useAI) {
      console.log(chalk.blue("🤖 Claude AI를 사용하여 템플릿 개인화 중..."));
      const personalizedTemplate = await claudeService.personalizeTemplate(
        template,
        userData
      );

      // 포트폴리오 생성
      const result = await figmaService.generatePortfolio(
        options.templateId,
        userData,
        connectionId
      );

      console.log(chalk.green("✅ 포트폴리오가 성공적으로 생성되었습니다!"));
      return result;
    } else {
      // 기본 템플릿으로 포트폴리오 생성
      const result = await figmaService.generatePortfolio(
        options.templateId,
        userData,
        connectionId
      );

      console.log(chalk.green("✅ 포트폴리오가 성공적으로 생성되었습니다!"));
      return result;
    }
  } catch (error) {
    console.error(chalk.red(`❌ 포트폴리오 생성 실패: ${error.message}`));
    throw error;
  }
}

/**
 * AI 프롬프트 처리 함수
 * @param {Object} message - 요청 메시지
 * @param {string} connectionId - 연결 ID
 */
async function handlePromptRequest(message, connectionId) {
  try {
    console.log(chalk.blue(`🧠 AI 프롬프트 처리 중: "${message.prompt}"`));

    // Claude API를 사용하여 프롬프트 처리
    const aiResponse = await claudeService.processDesignPrompt(message.prompt, {
      designerName: message.designerName || "디자이너",
      model: message.settings?.aiModel || "claude-3-sonnet",
      designStyle: message.settings?.designStyle || "modern",
    });

    console.log(chalk.green("✅ AI 응답 생성 완료"));

    // 결과 전송
    mcpCore.sendMessage(
      {
        type: "commandResult",
        command: "PROCESS_PROMPT",
        result: aiResponse,
      },
      connectionId
    );
  } catch (error) {
    console.error(chalk.red(`❌ AI 프롬프트 처리 실패: ${error.message}`));

    // 오류 메시지 전송
    mcpCore.sendMessage(
      {
        type: "commandResult",
        command: "PROCESS_PROMPT",
        error: error.message,
      },
      connectionId
    );
  }
}

/**
 * 명령 처리 함수
 * @param {string} command - 명령 이름
 * @param {Object} params - 명령 매개변수
 * @param {string} connectionId - 연결 ID
 */
async function handleCommand(command, params, connectionId) {
  try {
    console.log(chalk.blue(`🛠️ 명령 처리 중: ${command}`));

    switch (command) {
      case "generatePortfolio":
        const result = await generatePortfolio(params, connectionId);
        mcpCore.sendMessage(
          {
            type: "commandResult",
            command: "generatePortfolio",
            result: result,
          },
          connectionId
        );
        break;

      case "getTemplates":
        const templates = templateService.getTemplateList();
        mcpCore.sendMessage(
          {
            type: "commandResult",
            command: "getTemplates",
            result: templates,
          },
          connectionId
        );
        break;

      case "suggestDesign":
        const designSuggestion = await claudeService.suggestDesign(params);
        mcpCore.sendMessage(
          {
            type: "commandResult",
            command: "suggestDesign",
            result: designSuggestion,
          },
          connectionId
        );
        break;

      case "generateContent":
        const generatedContent = await claudeService.generateContent(
          params.type,
          params.context
        );
        mcpCore.sendMessage(
          {
            type: "commandResult",
            command: "generateContent",
            result: generatedContent,
          },
          connectionId
        );
        break;

      case "PROCESS_PROMPT":
        await handlePromptRequest(params, connectionId);
        break;

      default:
        console.log(chalk.yellow(`알 수 없는 명령: ${command}`));
        mcpCore.sendMessage(
          {
            type: "error",
            command: command,
            error: "알 수 없는 명령",
          },
          connectionId
        );
    }
  } catch (error) {
    console.error(
      chalk.red(`❌ 명령 처리 실패 (${command}): ${error.message}`)
    );
    mcpCore.sendMessage(
      {
        type: "error",
        command: command,
        error: error.message,
      },
      connectionId
    );
  }
}

/**
 * AI 프롬프트 요청 처리
 * @param {Object} params - 프롬프트 매개변수
 * @param {string} connectionId - 연결 ID
 */
async function handlePromptRequest(params, connectionId) {
  try {
    const { prompt, designerName, settings } = params;
    console.log(chalk.blue(`🧠 AI 프롬프트 처리 중: "${prompt}"`));

    // API 키가 설정되어 있는지 먼저 확인
    if (!process.env.CLAUDE_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "Claude API 키가 설정되지 않았습니다. .env 파일에 CLAUDE_API_KEY를 추가하세요."
      );
    }

    // Claude API를 통해 프롬프트 처리
    const result = await claudeService.processDesignPrompt(prompt, {
      model: settings?.aiModel || "claude-3-sonnet",
      userData: {
        name: designerName || "디자이너",
        style: settings?.designStyle || "modern",
      },
    });

    // 결과 반환
    mcpCore.sendMessage(
      {
        type: "commandResult",
        command: "PROCESS_PROMPT",
        result: result,
      },
      connectionId
    );
  } catch (error) {
    console.error(chalk.red(`❌ AI 프롬프트 처리 실패: ${error.message}`));
    mcpCore.sendMessage(
      {
        type: "error",
        command: "PROCESS_PROMPT",
        error: error.message,
      },
      connectionId
    );
  }
}

/**
 * CLI 설정
 */
function setupCLI() {
  program
    .name("figma-portfolio-generator")
    .description("MCP 아키텍처 기반의 Figma 포트폴리오 생성기")
    .version("1.0.0");

  // 서버 시작 명령
  program
    .command("serve")
    .description("MCP 서버 시작")
    .option("-p, --port <number>", "MCP 서버 포트", MCP_PORT)
    .action((options) => {
      // 포트 재설정 (CLI에서 지정된 경우)
      if (options.port) {
        MCP_PORT = options.port;
      }

      startServer();
    });

  // 템플릿 목록 명령
  program
    .command("templates")
    .description("사용 가능한 포트폴리오 템플릿 목록 표시")
    .action(() => {
      const templates = templateService.getAllTemplates();
      console.log(chalk.blue("📋 사용 가능한 포트폴리오 템플릿:"));

      templates.forEach((template) => {
        console.log(`
${chalk.green(template.name)} (${chalk.yellow(template.id)})
${chalk.gray(template.description)}
${chalk.blue("크기:")} ${template.canvasSize.width}x${
          template.canvasSize.height
        }
${chalk.blue("섹션:")} ${Object.keys(template.sections).join(", ")}
---`);
      });
    });

  // 대화형 생성 명령
  program
    .command("create")
    .description("대화형 포트폴리오 생성")
    .action(async () => {
      // 서버 상태 확인
      if (!mcpCore.hasActiveConnections()) {
        console.log(
          chalk.yellow("⚠️ 활성화된 Figma 플러그인 연결이 없습니다.")
        );
        console.log(
          chalk.yellow(
            '먼저 "serve" 명령으로 서버를 시작하고 Figma 플러그인을 연결하세요.'
          )
        );
        return;
      }

      // 템플릿 정보 가져오기
      const templates = templateService.getTemplateList();

      // 사용자 입력 요청
      const answers = await inquirer.prompt([
        {
          type: "list",
          name: "templateId",
          message: "포트폴리오 템플릿을 선택하세요:",
          choices: templates.map((t) => ({
            name: `${t.name} - ${t.description}`,
            value: t.id,
          })),
        },
        {
          type: "input",
          name: "name",
          message: "디자이너 이름을 입력하세요:",
          default: "홍길동",
        },
        {
          type: "input",
          name: "title",
          message: "직함을 입력하세요:",
          default: "UI/UX 디자이너",
        },
        {
          type: "input",
          name: "bio",
          message: "간단한 자기소개를 입력하세요:",
          default: "사용자 중심 디자인과 깔끔한 UI를 구현하는 디자이너입니다.",
        },
        {
          type: "confirm",
          name: "useAI",
          message: "Claude AI를 사용하여 템플릿을 개인화하시겠습니까?",
          default: false,
        },
      ]);

      // 선택된 템플릿의 섹션 선택 질문 생성
      const template = templateService.getTemplateById(answers.templateId);
      const sectionChoices = Object.entries(template.sections)
        .filter(([_, config]) => !config.required) // 필수 섹션은 제외
        .map(([key, config]) => ({
          name: `${config.title} - ${config.description}`,
          value: key,
          checked: true, // 기본적으로 모든 섹션 선택
        }));

      // 필수 섹션 식별
      const requiredSections = Object.entries(template.sections)
        .filter(([_, config]) => config.required)
        .map(([key]) => key);

      // 선택적 섹션 있는 경우에만 물어보기
      let selectedSections = [];
      if (sectionChoices.length > 0) {
        const sectionAnswers = await inquirer.prompt([
          {
            type: "checkbox",
            name: "sections",
            message: "포함할 섹션을 선택하세요:",
            choices: sectionChoices,
          },
        ]);
        selectedSections = [...requiredSections, ...sectionAnswers.sections];
      } else {
        selectedSections = requiredSections;
      }

      // 연결 ID 가져오기
      const connectionIds = mcpCore.getActiveConnectionIds();
      const connectionId = connectionIds[0]; // 첫 번째 연결 사용

      // 포트폴리오 생성
      try {
        console.log(chalk.blue("🎨 포트폴리오 생성 중..."));

        const result = await generatePortfolio(
          {
            templateId: answers.templateId,
            name: answers.name,
            title: answers.title,
            bio: answers.bio,
            sections: selectedSections,
            useAI: answers.useAI,
          },
          connectionId
        );

        console.log(chalk.green("✅ 포트폴리오가 성공적으로 생성되었습니다!"));
        console.log(chalk.gray(`템플릿: ${answers.templateId}`));
        console.log(chalk.gray(`프레임 ID: ${result.frame.id}`));
      } catch (error) {
        console.error(chalk.red(`❌ 포트폴리오 생성 실패: ${error.message}`));
      }
    });

  // AI 프롬프트 명령
  program
    .command("prompt")
    .description("AI 프롬프트로 포트폴리오 생성")
    .action(async () => {
      // 서버 상태 확인
      if (!mcpCore.hasActiveConnections()) {
        console.log(
          chalk.yellow("⚠️ 활성화된 Figma 플러그인 연결이 없습니다.")
        );
        console.log(
          chalk.yellow(
            '먼저 "serve" 명령으로 서버를 시작하고 Figma 플러그인을 연결하세요.'
          )
        );
        return;
      }

      // 사용자 입력 요청
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "designerName",
          message: "디자이너 이름을 입력하세요:",
          default: "홍길동",
        },
        {
          type: "input",
          name: "prompt",
          message: "포트폴리오 요구사항을 자세히 설명해주세요:",
          default:
            "UI/UX 디자이너를 위한 미니멀한 포트폴리오를 만들어주세요. 프로젝트, 스킬, 연락처 섹션이 필요합니다.",
        },
      ]);

      // 연결 ID 가져오기
      const connectionIds = mcpCore.getActiveConnectionIds();
      const connectionId = connectionIds[0]; // 첫 번째 연결 사용

      // AI 프롬프트 처리
      try {
        console.log(chalk.blue("🧠 AI 프롬프트 처리 중..."));

        await handlePromptRequest(
          {
            prompt: answers.prompt,
            designerName: answers.designerName,
            settings: {
              aiModel: "claude-3-sonnet",
              designStyle: "modern",
            },
          },
          connectionId
        );

        console.log(
          chalk.green(
            "✅ AI 프롬프트 요청을 전송했습니다. Figma에서 결과를 확인하세요."
          )
        );
      } catch (error) {
        console.error(chalk.red(`❌ AI 프롬프트 처리 실패: ${error.message}`));
      }
    });

  // CLI 명령 파싱
  program.parse();
}

// 애플리케이션 시작
if (require.main === module) {
  setupCLI();
} else {
  // 모듈로 사용될 때 내보낼 함수들
  module.exports = {
    startServer,
    generatePortfolio,
    handleCommand,
    handlePromptRequest,
  };
}
