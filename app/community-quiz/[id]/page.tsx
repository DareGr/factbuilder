"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase, type UserQuiz, type QuizQuestion } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Star, Users, RotateCcw } from "lucide-react"
import Link from "next/link"

type QuizState = "loading" | "info" | "playing" | "finished"

export default function CommunityQuizPage() {
  const params = useParams()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<UserQuiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [quizState, setQuizState] = useState<QuizState>("loading")
  const [error, setError] = useState<string | null>(null)

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  const fetchQuiz = async () => {
    try {
      setQuizState("loading")
      setError(null)

      const { data: quizData, error: quizError } = await supabase
        .from("user_quizzes")
        .select(`
          *,
          author:users!user_quizzes_author_id_fkey(*),
          questions:quiz_questions(*)
        `)
        .eq("id", quizId)
        .eq("status", "approved")
        .single()

      if (quizError) throw quizError

      if (!quizData) {
        setError("Quiz not found or not approved")
        return
      }

      setQuiz({
        ...quizData,
        average_rating: quizData.rating_count > 0 ? quizData.rating_sum / quizData.rating_count : 0,
      })

      const sortedQuestions = (quizData.questions || []).sort((a, b) => a.order_index - b.order_index)
      setQuestions(sortedQuestions)
      setQuizState("info")
    } catch (err) {
      setError("Failed to load quiz: " + (err as Error).message)
      console.error("Error fetching quiz:", err)
    }
  }

  const startQuiz = () => {
    setQuizState("playing")
    setCurrentQuestionIndex(0)
    setUserAnswers([])
    setUserAnswer("")
  }

  const submitAnswer = () => {
    const updatedAnswers = [...userAnswers, userAnswer.trim()]
    setUserAnswers(updatedAnswers)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setUserAnswer("")
    } else {
      setQuizState("finished")
    }
  }

  const restartQuiz = () => {
    setQuizState("info")
    setCurrentQuestionIndex(0)
    setUserAnswers([])
    setUserAnswer("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && userAnswer.trim() && quizState === "playing") {
      submitAnswer()
    }
  }

  useEffect(() => {
    fetchQuiz()
  }, [quizId])

  if (quizState === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Quiz Not Found</h2>
            <p className="text-gray-600 mb-4">{error || "The requested quiz doesn't exist."}</p>
            <Link href="/community-quizzes">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Community Quizzes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Quiz Info State
  if (quizState === "info") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link href="/community-quizzes">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Community Quizzes
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Quiz Preview</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl mb-4">{quiz.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>by {quiz.author?.full_name || quiz.author?.username || "Anonymous"}</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{quiz.average_rating ? quiz.average_rating.toFixed(1) : "New"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{quiz.play_count} plays</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {quiz.description && <p className="text-gray-700">{quiz.description}</p>}

              <div className="flex items-center gap-2">
                <Badge variant="outline">{questions.length} questions</Badge>
                {quiz.tags &&
                  quiz.tags.slice(0, 5).map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
              </div>

              <div className="pt-4">
                <Button onClick={startQuiz} size="lg" className="w-full">
                  Start Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Finished State
  if (quizState === "finished") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link href="/community-quizzes">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Community Quizzes
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Quiz Complete!</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">"{quiz.title}" Complete!</CardTitle>
              <p className="text-lg text-gray-600">Thank you for playing this community quiz!</p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex gap-4 justify-center flex-wrap">
                <Button onClick={restartQuiz} className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Play Again
                </Button>
                <Link href="/community-quizzes">
                  <Button variant="outline">Browse More Quizzes</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Show answers */}
          <Card>
            <CardHeader>
              <CardTitle>Your Answers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <p className="font-medium text-gray-900 mb-2">
                      {index + 1}. {question.question}
                    </p>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">Your answer:</span>{" "}
                        <span className="text-blue-600">{userAnswers[index] || "(empty)"}</span>
                      </p>
                      <p>
                        <span className="font-medium">Correct answer:</span>{" "}
                        <span className="text-green-600">{question.answer}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Playing State
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/community-quizzes">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            </div>

            <Badge variant="outline">
              {currentQuestionIndex + 1} / {questions.length}
            </Badge>
          </div>

          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer:
                </label>
                <Input
                  id="answer"
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer here..."
                  className="text-lg"
                  autoFocus
                />
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Press Enter to submit your answer</p>
                <Button onClick={submitAnswer} disabled={!userAnswer.trim()} className="flex items-center gap-2">
                  {currentQuestionIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
