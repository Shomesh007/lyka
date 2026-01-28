import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeCode = async (code: string, instruction: string): Promise<string> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are an expert Senior Software Engineer.
    
    Current Code File:
    \`\`\`
    ${code}
    \`\`\`

    User Instruction: ${instruction}

    Task:
    Provide the modified code based on the user instruction. 
    1. If the instruction is a question, answer it in comments or returns a revised version of the code with comments.
    2. If the instruction is a refactor, output the FULL refactored code.
    3. Do NOT use markdown code blocks (e.g., \`\`\`javascript) in your response, just return the raw code content so it can be directly placed in the editor.
    4. Maintain existing coding style and indentation.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // prioritize speed for interactive editing
      }
    });

    return response.text || "// No response generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate AI response.");
  }
};

export const explainCode = async (code: string): Promise<string> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";

  const prompt = `
    Explain the following code concisely for a developer audience. 
    Focus on logic, flow, and any potential issues.
    
    Code:
    \`\`\`
    ${code.substring(0, 5000)} 
    \`\`\`
    (Code truncated if too long)
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "No explanation generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to explain code.";
  }
};
