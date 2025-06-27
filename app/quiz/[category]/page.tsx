"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase, quizCategories, type Question } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Eye, EyeOff, RotateCcw, Home } from "lucide-react"
import Link from "next/link"

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.category as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const category = quizCategories.find((cat) => cat.id === categoryId)
  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  const fetchQuestions = async () => {
    if (!category) {
      setError("Category not found")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from(category.table)
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      // Shuffle questions randomly
      const shuffledQuestions = (data || []).sort(() => Math.random() - 0.5)
      setQuestions(shuffledQuestions)
    } catch (err) {
      setError("Failed to load questions: " + (err as Error).message)
      console.error("Error fetching questions:", err)
    } finally {
      setLoading(false)
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setShowAnswer(false)
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
      setShowAnswer(false)
    }
  }

  const shuffleQuestions = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5)
    setQuestions(shuffled)
    setCurrentQuestionIndex(0)
    setShowAnswer(false)
  }

  useEffect(() => {
    fetchQuestions()
  }, [categoryId])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent default behavior if we're handling the key
      if (event.code === "Enter" || event.code === "Space") {
        event.preventDefault()
      }

      if (event.code === "Enter") {
        setShowAnswer(!showAnswer)
      } else if (event.code === "Space") {
        if (currentQuestionIndex < questions.length - 1) {
          nextQuestion()
        }
      }
    }

    // Add event listener
    window.addEventListener("keydown", handleKeyPress)

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [showAnswer, currentQuestionIndex, questions.length])

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Category Not Found</h2>
            <p className="text-gray-600 mb-4">The requested quiz category doesn't exist.</p>
            <Link href="/">
              <Button>
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  {category.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentQuestionIndex + 1} / {questions.length}
              </Badge>
              <Button onClick={shuffleQuestions} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {questions.length > 0 && (
            <div className="mt-4">
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading questions...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="text-center py-8">
              <p className="text-red-800 mb-4">{error}</p>
              <Button onClick={fetchQuestions} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Available</h3>
              <p className="text-gray-500 mb-4">This category doesn't have any questions yet.</p>
              <Link href={`/manage/${categoryId}`}>
                <Button>Add Questions</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Question Card */}
            <Card className="hover:shadow-lg transition-shadow">
              {currentQuestion?.image_url && (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <img
                    src={currentQuestion.image_url || "/placeholder.svg"}
                    alt="Question image"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-xl leading-relaxed">{currentQuestion?.question}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Answer Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      onClick={() => setShowAnswer(!showAnswer)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showAnswer ? "Hide Answer" : "Show Answer"}
                    </Button>

                    <div className="text-xs text-gray-500 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd>
                        Show/Hide
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Space</kbd>
                        Next
                      </span>
                    </div>
                  </div>

                  {showAnswer && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-sm font-medium text-green-600 mb-2">Answer:</p>
                      <p className="text-gray-800 font-medium">{currentQuestion?.answer}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button onClick={previousQuestion} disabled={currentQuestionIndex === 0} variant="outline">
                Previous
              </Button>

              <div className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>

              <Button onClick={nextQuestion} disabled={currentQuestionIndex === questions.length - 1}>
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
