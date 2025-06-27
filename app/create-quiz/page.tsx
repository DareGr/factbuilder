"use client"

import type React from "react"

import { useState } from "react"
import { submitCommunityQuiz } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, Save, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type QuizQuestion = {
  id: string
  question: string
  answer: string
  imageUrl: string
}

export default function CreateQuizPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Quiz metadata
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])

  // Questions
  const [questions, setQuestions] = useState<QuizQuestion[]>([{ id: "1", question: "", answer: "", imageUrl: "" }])

  // Mock user ID - in real app this would come from auth
  const currentUserId = "550e8400-e29b-41d4-a716-446655440002"

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      question: "",
      answer: "",
      imageUrl: "",
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id))
    }
  }

  const updateQuestion = (id: string, field: keyof QuizQuestion, value: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const validateForm = () => {
    if (!title.trim()) {
      setError("Quiz title is required")
      return false
    }

    if (questions.length < 3) {
      setError("Quiz must have at least 3 questions")
      return false
    }

    const validQuestions = questions.filter((q) => q.question.trim() && q.answer.trim())
    if (validQuestions.length < 3) {
      setError("At least 3 questions must have both question and answer filled")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)
      setError(null)

      const validQuestions = questions
        .filter((q) => q.question.trim() && q.answer.trim())
        .map((q) => ({
          question: q.question.trim(),
          answer: q.answer.trim(),
          imageUrl: q.imageUrl.trim() || undefined,
        }))

      await submitCommunityQuiz({
        title: title.trim(),
        description: description.trim() || undefined,
        tags,
        questions: validQuestions,
        authorId: currentUserId,
      })

      // Redirect to community quizzes with success message
      router.push("/community-quizzes?created=true")
    } catch (err) {
      setError("Failed to submit quiz: " + (err as Error).message)
      console.error("Error submitting quiz:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/community-quizzes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Community Quizzes
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New Quiz</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-4">
                <p className="text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Quiz Information */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a catchy title for your quiz"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what your quiz is about..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (optional)</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Add tags to help people find your quiz"
                  />
                  <Button type="button" onClick={addTag} variant="outline" disabled={!tagInput.trim()}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-600">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Questions ({questions.length})</CardTitle>
                <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Question {index + 1}</h3>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`question-${question.id}`}>Question *</Label>
                    <Textarea
                      id={`question-${question.id}`}
                      value={question.question}
                      onChange={(e) => updateQuestion(question.id, "question", e.target.value)}
                      placeholder="Enter your question here..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`answer-${question.id}`}>Answer *</Label>
                    <Textarea
                      id={`answer-${question.id}`}
                      value={question.answer}
                      onChange={(e) => updateQuestion(question.id, "answer", e.target.value)}
                      placeholder="Enter the correct answer..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`image-${question.id}`}>Image URL (optional)</Label>
                    <Input
                      id={`image-${question.id}`}
                      type="url"
                      value={question.imageUrl}
                      onChange={(e) => updateQuestion(question.id, "imageUrl", e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
              ))}

              <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                <p className="font-medium mb-1">📝 Tips for creating great quizzes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Make questions clear and unambiguous</li>
                  <li>Provide specific, accurate answers</li>
                  <li>Add at least 5-10 questions for a good quiz experience</li>
                  <li>Use images to make questions more engaging</li>
                  <li>Test your quiz before submitting</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Card>
            <CardContent className="py-6">
              <div className="flex gap-4 justify-end">
                <Link href="/community-quizzes">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading} className="flex items-center gap-2">
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {loading ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Your quiz will be reviewed by our moderators before being published to the community.
              </p>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  )
}
