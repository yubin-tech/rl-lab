
import { GoogleGenAI } from "@google/genai";
import { Cell, SimulationParams } from "../types";

export const getBellmanExplanation = async (
  cell: Cell,
  neighbors: { action: string; value: number; probability: number }[],
  params: SimulationParams
) => {
  // Always use a named parameter for apiKey and obtain it exclusively from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Context: We are visualizing the Bellman Equation in a Gridworld.
    Target Cell: (${cell.x}, ${cell.y})
    Current Value: ${cell.value.toFixed(4)}
    Reward at this cell: ${cell.reward}
    Discount Factor (Gamma): ${params.gamma}
    Transitions (Noise included): ${JSON.stringify(neighbors)}

    Explain how the Bellman Equation determines the value of this specific cell. 
    Use clear, educational language. Mention the concept of "Expected Return" and "Discounting".
    Keep it concise but mathematically intuitive.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Correctly access the .text property (it is not a method)
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to fetch AI explanation. Please check your connection or API key.";
  }
};
