import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const geminiKey = process.env.GEMINI_API_KEY!;

const SUPPORTED_MIME_TYPES = ["audio/webm", "audio/mp3", "audio/wav", "audio/mpeg"];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file    = formData.get("file") as File | null;
    const endTime = formData.get("endTime") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Audio file is required", details: "No file in request" },
        { status: 400 }
      );
    }

    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Unsupported audio format",
          details: `Supported formats: ${SUPPORTED_MIME_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Convert file to base64 and send directly to Gemini
    const audioBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `You are tasked with transcribing the audio exactly as it is spoken, without introducing any timestamps. 
              If any part of the audio cannot be transcribed, simply omit that section. The goal is to provide an accurate, 
              word-for-word transcription without altering, summarizing, or rephrasing the original speech.`,
      // @ts-ignore
      safety_settings: {
        [HarmCategory.HARM_CATEGORY_HATE_SPEECH]:       HarmBlockThreshold.BLOCK_NONE,
        [HarmCategory.HARM_CATEGORY_HARASSMENT]:        HarmBlockThreshold.BLOCK_NONE,
        [HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT]: HarmBlockThreshold.BLOCK_NONE,
        [HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT]: HarmBlockThreshold.BLOCK_NONE,
      },
    });

    const chatSession = model.startChat({
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      },
      history: [
        {
          role: "user",
          parts: [{
            text: `Please transcribe the audio recording exactly as it is spoken, capturing all words, phrases, and pauses 
                    to reflect the original content as faithfully as possible.`,
          }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'll transcribe the audio exactly as spoken." }],
        },
      ],
    });

    const result = await chatSession.sendMessage([
      {
        inlineData: {
          mimeType: file.type,
          data: audioBase64,
        },
      },
    ]);

    if (!result?.response?.text) {
      throw new Error("Empty response from Gemini API");
    }

    const transcription = result.response.text();

    return NextResponse.json({
      success: true,
      transcription,
      metadata: {
        duration: endTime,
        fileSize: file.size,
      },
    });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Transcription failed", details: error.message },
      { status: 500 }
    );
  }
}