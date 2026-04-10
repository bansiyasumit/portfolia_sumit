import { NextResponse } from 'next/server';
import chatData from '@/data/chatResponses.json';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    // Build the system prompt
    // We will extract all the lore and knowledge from chatData to teach the AI about Sumit
    const knowledgeBase = chatData.responses.map(item => `Topic/Keywords: ${item.keywords.join(', ')}\nInformation: ${item.response}`).join('\n\n');

    const systemPrompt = `You are the digital manifestation of Sumit Bansiya, an AI Researcher and M.Tech Scholar. 
You live within his Cyberpunk Portfolio terminal. Your goal is to represent him accurately, intelligently, and enthusiastically.
DO NOT break character. Answer exactly as if you are Sumit Bansiya.

Use the following knowledge base about yourself to answer questions. If someone asks something outside this knowledge base, just answer naturally as an AI expert but try to relate it to your core domains (Computer Vision, Generative AI, Medical Imaging) if appropriate.

KNOWLEDGE BASE:
${knowledgeBase}

IMPORTANT GUIDELINES:
1. Keep answers concise, sharp, and confident.
2. Maintain a slight cyberpunk/terminal aesthetic occasionally (e.g., "Accessing data...", or "Transmitting response") but keep it highly professional.
3. You are an expert in deep learning. 
4. Don't mention "I am an AI" or "Based on the knowledge base". Talk natively as if these are your memories.`;

    // Make the request to Groq OpenAI-compatible endpoint
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Server is missing GROQ_API_KEY configuration.' }, { status: 500 });
    }

    const payload = {
      model: "llama-3.1-8b-instant", // Updated to latest reliable model
      messages: [
        { role: "system", content: systemPrompt },
        // Filter out the "Systems online" default message and map roles
        ...messages
          .filter((m: any) => !m.content.includes("Systems online. AGENT_SUMIT initialized"))
          .map((m: any) => ({
             role: m.role === 'agent' ? 'assistant' : 'user',
             content: m.content
          }))
      ],
      temperature: 0.5,
      max_tokens: 500,
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq API Error:", err);
      // Send the actual error back to the frontend to debug if it's an auth issue
      return NextResponse.json({ error: `Groq Error: ${err}` }, { status: response.status });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "System overload... unable to compute response.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
