"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { Question } from "@/lib/supabase"
import { Loader2, Save, RotateCcw } from "lucide-react"

interface AddQuestionFormProps {
  onSubmit: (data: Omit<Question, "id" | "created_at">) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
}

export function AddQuestionForm({ onSubmit, onCancel }: AddQuestionFormProps) {
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    image_url: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.question.trim() || !formData.answer.trim()) {
      setError("Question and answer are required")
      return
    }

    setLoading(true)
    setError(null)

    const result = await onSubmit({
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      image_url: formData.image_url.trim() || null,
    })

    if (!result.success) {
      setError(result.error || "Failed to add question")
    } else {
      // Reset form on success
      setFormData({ question: "", answer: "", image_url: "" })
    }

    setLoading(false)
  }

  const handleReset = () => {
    setFormData({ question: "", answer: "", image_url: "" })
    setError(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Add New Question
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="question">Question *</Label>
            <Textarea
              id="question"
              value={formData.question}
              onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
              placeholder="Enter your question here..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">Answer *</Label>
            <Textarea
              id="answer"
              value={formData.answer}
              onChange={(e) => setFormData((prev) => ({ ...prev, answer: e.target.value }))}
              placeholder="Enter the answer here..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL (optional)</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {loading ? "Adding..." : "Add Question"}
            </Button>

            <Button type="button" variant="outline" onClick={handleReset} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>

            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
