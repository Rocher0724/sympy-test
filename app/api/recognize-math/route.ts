import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Missing 'image' in request body" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are a mathematical handwriting recognition system. Analyze the handwritten mathematical expression in this image and convert it to LaTeX format.

Rules:
1. Output ONLY the LaTeX code, nothing else
2. Do not include any explanation, markdown formatting, or surrounding text
3. Do not wrap the output in $ signs or \`\`\` blocks
4. If the handwriting is unclear, make your best interpretation
5. Use standard LaTeX math notation (e.g., \\frac{}{}, \\sqrt{}, ^{}, _{}, etc.)
6. If you cannot recognize any mathematical expression, respond with exactly: ERROR_CANNOT_RECOGNIZE

Example outputs:
- x^2 + 3x + 1
- \\frac{d}{dx}(x^2)
- \\int_0^1 x^2 dx
- \\sqrt{a^2 + b^2}`,
            },
            {
              inlineData: {
                mimeType: "image/png",
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 256,
      },
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { error: `Gemini API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data: GeminiResponse = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message },
        { status: 500 }
      );
    }

    const latex = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!latex || latex === "ERROR_CANNOT_RECOGNIZE") {
      return NextResponse.json(
        { 
          latex: "", 
          success: false, 
          error: "Could not recognize the mathematical expression" 
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      latex,
      success: true,
    });
  } catch (error) {
    console.error("Recognition error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
