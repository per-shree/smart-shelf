import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getAIResponse(promptString: string, inventory: any[]) {
  try {
    const inventoryContext = inventory.map(p => 
      `${p.name} (${p.category}) - Expiry: ${p.expiryDate}, Quantity: ${p.quantity}`
    ).join('\n');

    const fullPrompt = `
      You are a Smart Refrigerator Management Assistant. 
      You help users manage their food, suggest recipes, and reduce waste.
      
      Current Inventory:
      ${inventoryContext}
      
      User Question/Request:
      ${promptString}
      
      Provide a helpful, concise, and professional response in plain text only. 
      IMPORTANT: Do not use any markdown formatting like asterisks (**), hashes (##), or bullet points (*). 
      Use simple newlines for structure and stay very clean.
      If suggesting recipes, use the available ingredients first.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: fullPrompt }] }]
    });

    return response.text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.";
  }
}
