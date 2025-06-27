"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { getAISettings } from "@/lib/ai-settings"
import { Badge } from "@/components/ui/badge"

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const testApiCall = async () => {
    setLoading(true)
    try {
      // Get current AI settings
      const aiSettings = getAISettings()

      const testPrompt = `You are an intelligent assistant that helps evaluate quiz answers. A user has submitted answers to a quiz, and you are to compare them with the correct answers.

Rules:
- Accept minor spelling or grammar mistakes.
- Accept answers even if they are lowercase or uppercase.
- Accept answers if they are semantically equivalent or meaningfully close.
- If the answer is clearly incorrect, mark it as wrong.

For each question, output EXACTLY this format:

Question: <question>
Correct Answer: <system_answer>
User Answer: <user_answer>
Result: Correct / Incorrect
Justification: <short explanation>

Here is the list:

1. Question: What is the capital of France?
   Correct Answer: Paris
   User Answer: paris

2. Question: What color is the sky?
   Correct Answer: Blue
   User Answer: t`

      const response = await fetch("/api/evaluate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: testPrompt,
          service: aiSettings.currentService,
          model: aiSettings.models[aiSettings.currentService],
        }),
      })

      const data = await response.json()

      const newLog = {
        timestamp: new Date().toISOString(),
        status: response.status,
        service: aiSettings.currentService,
        model: aiSettings.models[aiSettings.currentService],
        request: testPrompt,
        response: data,
        success: response.ok,
      }

      setLogs((prev) => [newLog, ...prev])
    } catch (error) {
      const aiSettings = getAISettings()
      const errorLog = {
        timestamp: new Date().toISOString(),
        status: "ERROR",
        service: aiSettings.currentService,
        model: aiSettings.models[aiSettings.currentService],
        request: "Test API call",
        response: { error: error instanceof Error ? error.message : "Unknown error" },
        success: false,
      }
      setLogs((prev) => [errorLog, ...prev])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">API Logs</h1>
            </div>
            <Button onClick={testApiCall} disabled={loading} className="flex items-center gap-2">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Test API Call
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {logs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  No API logs yet. Click "Test API Call" to test the OpenAI integration.
                </p>
                <Button onClick={testApiCall} disabled={loading}>
                  {loading ? "Testing..." : "Test API Call"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            logs.map((log, index) => (
              <Card key={index} className={log.success ? "border-green-200" : "border-red-200"}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className={log.success ? "text-green-600" : "text-red-600"}>
                      {log.success ? "✅ Success" : "❌ Error"} - {log.status}
                      {log.service && (
                        <Badge variant="secondary" className="ml-2">
                          {log.service === "openai" ? "OpenAI" : "Gemini"} • {log.model}
                        </Badge>
                      )}
                    </span>
                    <span className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Request:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                      {typeof log.request === "string" ? log.request : JSON.stringify(log.request, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Response:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(log.response, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
