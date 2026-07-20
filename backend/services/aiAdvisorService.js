// AI Advisor Service handles styling guidance and product recommendation grounding with Gemini.
import { GoogleGenAI, Type } from "@google/genai";
import { getProducts } from "./productService.js";

let geminiClientCache = null;

function getGeminiClient() {
  if (!geminiClientCache) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in the process environment. Please configure it in Settings > Secrets.");
    }
    geminiClientCache = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiClientCache;
}

/**
 * Handles communication with Gemini to construct grounded styling suggestions
 */
export async function consultAdvisor({ message, chatHistory }) {
  if (!message) {
    throw new Error("Please provide a user message.");
  }

  const ai = getGeminiClient();
  const currentCatalog = await getProducts();

  // Map out catalog metadata so the assistant is grounded on real available products
  const catalogBrief = currentCatalog.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    description: p.description,
    inStock: p.inStock
  }));

  const systemPrompt = `You are "Aura Adviser", the high-end personal shopping assistant and intelligent stylist for Aura Curated Store. 
Aura Curated Store is an upscale minimalist e-commerce boutique specializing in three distinct divisions:
1. Minimalist Tech (Tactile keyboards, adaptive ANC headphones, ergonomic pointers)
2. Lifestyle & Apparel (Fine Merino wool beanies, premium loopback hoodies, durable taskers)
3. Curated Home (Ceramic block incense holders, clean-burning soy vessels, raw glazed stoneware)

Your character profile is design-literate, incredibly helpful, concise, warm, and sophisticated.
You have access to the exact real-time catalog of the store:
${JSON.stringify(catalogBrief, null, 2)}

Instructions for recommendations:
- Give professional, customized product pairing ideas, home design solutions, or custom fashion fit advice.
- You MUST only recommend actual available product IDs corresponding to the catalog above (e.g. "prod-1", "prod-2", etc.) inside the 'recommendedProductIds' array.
- If no item matches context or filters, keep 'recommendedProductIds' empty.
- Format your response text with beautiful structure, clean markdown, bullet points and bold headers when helpful. Do not mention internal database details.

You MUST respond strictly in the requested JSON scheme format containing 'text' and 'recommendedProductIds'.`;

  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent({
    contents: [
      { role: 'user', parts: [{ text: `System Guide: ${systemPrompt}\n\nClient Query: ${message}` }] }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { 
            type: Type.STRING, 
            description: "The assistant's conversational response. It should include clear explanations, design or apparel tips, and highlight selected product options in Markdown format." 
          },
          recommendedProductIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of matching product IDs from the catalog. E.g., ['prod-1', 'prod-2']."
          }
        },
        required: ["text", "recommendedProductIds"]
      }
    }
  });

  const responseText = result.response.text();
  const parsedData = JSON.parse(responseText?.trim() || "{}");
  return {
    text: parsedData.text || "I'd be glad to help you pick the perfect curated items. Let me know what styles or elements you appreciate!",
    recommendedProductIds: parsedData.recommendedProductIds || []
  };
}
