import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { prompt, service = "openai", model } = await request.json()

    if (!prompt) {
      console.log("❌ API Error: No prompt provided")
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("🚀 Starting AI evaluation...")
    console.log("🤖 Using service:", service)
    console.log("🤖 Using model:", model)
    console.log("📝 Prompt length:", prompt.length, "characters")
    console.log("📝 Prompt preview:", prompt.substring(0, 200) + "...")

    let aiModel
    switch (service) {
      case "gemini":
        aiModel = google(model || "gemini-1.5-flash")
        break
      case "openai":
      default:
        aiModel = openai(model || "gpt-4o-mini")
        break
    }

    const { text } = await generateText({
      model: aiModel,
      prompt: prompt,
      temperature: 0.1,
      maxTokens: 4000,
    })

    const duration = Date.now() - startTime
    console.log("✅ AI evaluation completed in", duration, "ms")
    console.log("📄 Response length:", text.length, "characters")
    console.log("📄 Response preview:", text.substring(0, 300) + "...")

    return NextResponse.json({
      evaluation: text,
      success: true,
      duration: duration,
      timestamp: new Date().toISOString(),
      service: service,
      model: model,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ Detailed error evaluating quiz:", error)
    console.log("⏱️ Failed after", duration, "ms")

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    const errorDetails = {
      message: errorMessage,
      duration: duration,
      timestamp: new Date().toISOString(),
      service: request.body?.service || "unknown",
      model: request.body?.model || "unknown",
    }

    return NextResponse.json(
      {
        error: "Failed to evaluate quiz answers",
        details: errorMessage,
        success: false,
        ...errorDetails,
      },
      { status: 500 },
    )
  }
}
