#!/usr/bin/env node

/**
 * 메인 CLI 엔트리 포인트
 * Claude와 Figma API를 통합하여 건축 포트폴리오 생성을 위한 명령줄 인터페이스
 */

require("dotenv").config();
const { program } = require("commander");
const chalk = require("chalk");
const figmaClaudeService = require("./figma-claude");
const claudeService = require("./claude-service");

// 버전 및 설명 설정
program
  .name("figma-claude-architecture")
  .description("건축 포트폴리오 생성을 위한 Claude와 Figma 통합 CLI")
  .version("1.0.0");

// 명령어 설정
program
  .command("create")
  .description("새로운 건축 포트폴리오 요소 생성")
  .argument(
    "<instruction>",
    '자연어 명령어 (예: "3x3 그리드를 가진 평면도 프레임 생성")'
  )
  .option("-f, --file <fileKey>", "Figma 파일 키 (기본값: .env 파일의 값)")
  .option(
    "-p, --page <pageName>",
    "작업할 Figma 페이지 이름",
    "Architecture Portfolio"
  )
  .action(async (instruction, options) => {
    try {
      console.log(chalk.blue("🧠 Claude에 명령어 처리 중..."));

      const fileKey = options.file || process.env.FIGMA_FILE_KEY;
      if (!fileKey) {
        console.error(
          chalk.red(
            "오류: Figma 파일 키가 제공되지 않았습니다. --file 옵션 또는 .env 파일에 FIGMA_FILE_KEY를 설정하세요."
          )
        );
        return;
      }

      // Claude로 명령어 처리
      const structuredData = await claudeService.processArchitecturePrompt(
        instruction
      );

      // Figma에 명령어 전송
      console.log(chalk.blue("🎨 Figma에 변경사항 적용 중..."));
      const result = await figmaClaudeService.executeInFigma(
        structuredData,
        fileKey,
        options.page
      );

      console.log(chalk.green("✅ 완료!"), chalk.grey(`(${result.message})`));
    } catch (error) {
      console.error(chalk.red("오류 발생:"), error.message);
      process.exit(1);
    }
  });

program
  .command("templates")
  .description("사전 정의된 건축 템플릿 목록 표시")
  .action(() => {
    const templates = require("../examples/architecture-templates");
    console.log(chalk.blue("📐 사용 가능한 건축 템플릿:"));

    Object.entries(templates).forEach(([name, details]) => {
      console.log(chalk.green(`- ${name}:`), chalk.grey(details.description));
    });
  });

program
  .command("apply-template")
  .description("사전 정의된 건축 템플릿 적용")
  .argument("<templateName>", "적용할 템플릿 이름")
  .option("-f, --file <fileKey>", "Figma 파일 키 (기본값: .env 파일의 값)")
  .option(
    "-p, --page <pageName>",
    "작업할 Figma 페이지 이름",
    "Architecture Portfolio"
  )
  .action(async (templateName, options) => {
    try {
      const templates = require("../examples/architecture-templates");

      if (!templates[templateName]) {
        console.error(
          chalk.red(
            `오류: '${templateName}' 템플릿을 찾을 수 없습니다. 'templates' 명령어로 사용 가능한 템플릿을 확인하세요.`
          )
        );
        return;
      }

      const fileKey = options.file || process.env.FIGMA_FILE_KEY;
      if (!fileKey) {
        console.error(
          chalk.red(
            "오류: Figma 파일 키가 제공되지 않았습니다. --file 옵션 또는 .env 파일에 FIGMA_FILE_KEY를 설정하세요."
          )
        );
        return;
      }

      console.log(chalk.blue(`🎨 '${templateName}' 템플릿 적용 중...`));
      const result = await figmaClaudeService.applyTemplate(
        templateName,
        fileKey,
        options.page
      );

      console.log(chalk.green("✅ 완료!"), chalk.grey(`(${result.message})`));
    } catch (error) {
      console.error(chalk.red("오류 발생:"), error.message);
      process.exit(1);
    }
  });

// 프로그램 실행
program.parse(process.argv);

// 명령어가 제공되지 않은 경우 도움말 표시
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
