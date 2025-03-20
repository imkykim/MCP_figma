const { Anthropic } = require("@anthropic-ai/sdk");
require("dotenv").config();

const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

console.log("API Key found in environment:", apiKey ? "YES" : "NO");
console.log("API Key length:", apiKey ? apiKey.length : 0);

if (!apiKey) {
  console.error("ERROR: No API key found in environment variables!");
  process.exit(1);
}

async function testApi() {
  try {
    console.log("Creating Anthropic client...");
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    console.log("Anthropic client created:", anthropic ? "YES" : "NO");
    console.log(
      "Anthropic messages property exists:",
      anthropic.messages ? "YES" : "NO"
    );

    console.log("Sending test request to Claude API...");
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: "Say hello in Korean",
        },
      ],
    });

    console.log("API Response received:");
    console.log(JSON.stringify(response, null, 2));
    console.log("\nAPI TEST SUCCESSFUL!");
  } catch (error) {
    console.error("ERROR during API test:");
    console.error(error);

    if (error.message.includes("401")) {
      console.error(
        "\nThis appears to be an authentication error. Your API key may be invalid."
      );
    }
    if (error.message.includes("403")) {
      console.error(
        "\nThis appears to be an authorization error. Your API key may not have permission to use this model."
      );
    }
  }
}

testApi();
