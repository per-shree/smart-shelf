import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getAIResponse(promptString: string, inventory: any[], language: string = 'en') {
  try {
    const inventoryContext = inventory.map(p => 
      `${p.name} (${p.category}) - Expiry: ${p.expiryDate}, Quantity: ${p.quantity}`
    ).join('\n');

    const languageInstruction = language === 'mr' 
      ? "IMPORTANT: You must respond in Marathi (मराठी)." 
      : language === 'hi' 
        ? "IMPORTANT: You must respond in Hindi (हिंदी)." 
        : "IMPORTANT: You must respond in English.";

    const assistantName = language === 'mr' ? 'स्मार्ट शेल्फ सहाय्यक' : language === 'hi' ? 'स्मार्ट शेल्फ सहायक' : 'Smart Shelf Management Assistant';

    const fullPrompt = `
      You are a ${assistantName}. 
      You help users manage their items, suggest recipes, and reduce waste.
      
      Current Inventory:
      ${inventoryContext}
      
      User Question/Request:
      ${promptString}
      
      ${languageInstruction}
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
