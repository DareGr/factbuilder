"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, TestTube, Settings, Zap } from "lucide-react"
import Link from "next/link"
import { getAISettings, saveAISettings, formatPrompt, type AISettings, type AIService } from "@/lib/ai-settings"

export default function AdminPage() {
  const [settings, setSettings] = useState<AISettings>(getAISettings())
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(getAISettings())
  }, [])

  const handleSave = () => {
    saveAISettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleServiceChange = (service: AIService) => {
    setSettings((prev) => ({
      ...prev,
      currentService: service,
    }))
  }

  const handlePromptChange = (service: AIService, prompt: string) => {
    setSettings((prev) => ({
      ...prev,
      prompts: {
        ...prev.prompts,
        [service]: prompt,
      },
    }))
  }

  const handleModelChange = (service: AIService, model: string) => {
    setSettings((prev) => ({
      ...prev,
      models: {
        ...prev.models,
        [service]: model,
      },
    }))
  }

  const testCurrentService = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const testQuestions = [
        {
          question: "What is the capital of France?",
          correctAnswer: "Paris",
          userAnswer: "paris",
        },
        {
          question: "What color is the sky?",
          correctAnswer: "Blue",
          userAnswer: "t",
        },
      ]

      const prompt = formatPrompt(settings.prompts[settings.currentService], testQuestions)

      const response = await fetch("/api/evaluate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          service: settings.currentService,
          model: settings.models[settings.currentService],
        }),
      })

      const data = await response.json()
      setTestResult({
        success: response.ok,
        data,
        status: response.status,
      })
    } catch (error) {
      setTestResult({
        success: false,
        data: { error: error instanceof Error ? error.message : "Unknown error" },
        status: "ERROR",
      })
    } finally {
      setTesting(false)
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
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-6 w-6" />
                AI Settings Admin
              </h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={testCurrentService} disabled={testing} variant="outline">
                {testing ? <TestTube className="h-4 w-4 animate-pulse mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
                Test Current Service
              </Button>
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {saved ? "Saved!" : "Save Settings"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Service Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Service Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="current-service">Current AI Service</Label>
                <Select value={settings.currentService} onValueChange={handleServiceChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">
                      <div className="flex items-center gap-2">
                        <span>OpenAI</span>
                        <Badge variant="secondary">GPT</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="gemini">
                      <div className="flex items-center gap-2">
                        <span>Google Gemini</span>
                        <Badge variant="secondary">Gemini</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* OpenAI Settings */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">OpenAI Configuration</h3>
                  {settings.currentService === "openai" && <Badge variant="default">Active</Badge>}
                </div>
                <div>
                  <Label htmlFor="openai-model">Model</Label>
                  <Select value={settings.models.openai} onValueChange={(value) => handleModelChange("openai", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Most Capable)</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Cost-effective)</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Balanced)</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Fastest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Gemini Settings */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">Google Gemini Configuration</h3>
                  {settings.currentService === "gemini" && <Badge variant="default">Active</Badge>}
                </div>
                <div>
                  <Label htmlFor="gemini-model">Model</Label>
                  <Select value={settings.models.gemini} onValueChange={(value) => handleModelChange("gemini", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (Latest & Fast) ⭐</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Most Capable)</SelectItem>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro (Balanced)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResult && (
            <Card className={testResult.success ? "border-green-200" : "border-red-200"}>
              <CardHeader>
                <CardTitle className={testResult.success ? "text-green-600" : "text-red-600"}>
                  {testResult.success ? "✅ Test Successful" : "❌ Test Failed"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Prompt Configuration */}
        <div className="mt-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Prompt Configuration</h2>

          {/* OpenAI Prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                OpenAI Prompt
                {settings.currentService === "openai" && <Badge variant="default">Active</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.prompts.openai}
                onChange={(e) => handlePromptChange("openai", e.target.value)}
                rows={12}
                className="font-mono text-sm"
                placeholder="Enter OpenAI prompt..."
              />
              <p className="text-xs text-gray-500 mt-2">
                Use {"{QUESTIONS_PLACEHOLDER}"} where you want the questions to be inserted.
              </p>
            </CardContent>
          </Card>

          {/* Gemini Prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Google Gemini Prompt
                {settings.currentService === "gemini" && <Badge variant="default">Active</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.prompts.gemini}
                onChange={(e) => handlePromptChange("gemini", e.target.value)}
                rows={12}
                className="font-mono text-sm"
                placeholder="Enter Gemini prompt..."
              />
              <p className="text-xs text-gray-500 mt-2">
                Use {"{QUESTIONS_PLACEHOLDER}"} where you want the questions to be inserted.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
