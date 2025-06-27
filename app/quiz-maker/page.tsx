"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getAllCategoriesForQuizMaker, getRandomQuestionsFromCategories, type QuizCategory } from "@/lib/supabase"
import { getAISettings, formatPrompt } from "@/lib/ai-settings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Home, Target, Settings, Play } from "lucide-react"
import Link from "next/link"

type QuizState = "setup" | "loading" | "playing" | "evaluating" | "finished"

type UserAnswer = {
  questionId: string
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect?: boolean
  justification?: string
}

type EvaluationResult = {
  question: string
  correctAnswer: string
  userAnswer: string
  result: "Correct" | "Incorrect"
  justification?: string
}

const QUESTION_COUNT_OPTIONS = [10, 20, 30, 40, 50]

export default function QuizMakerPage() {
  const [categories, setCategories] = useState<QuizCategory[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(20)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [quizState, setQuizState] = useState<QuizState>("setup")
  const [error, setError] = useState<string | null>(null)
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([])
  const [aiSettings, setAiSettings] = useState(getAISettings())
  const [rawAiResponse, setRawAiResponse] = useState<string>("")

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0
  const correctAnswers = evaluationResults.filter((result) => result.result === "Correct").length

  useEffect(() => {
    fetchCategories()
    setAiSettings(getAISettings())
  }, [])

  // Handle URL parameters for pre-selected categories
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const categoriesParam = urlParams.get("categories")

    if (categoriesParam) {
      const categoryIds = categoriesParam.split(",").filter((id) => categories.some((cat) => cat.id === id))
      if (categoryIds.length > 0) {
        setSelectedCategories(categoryIds)
      }
    }
  }, [categories])

  const fetchCategories = async () => {
    try {
      const categoriesData = await getAllCategoriesForQuizMaker()
      setCategories(categoriesData)
    } catch (err) {
      setError("Failed to load categories: " + (err as Error).message)
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const startQuiz = async () => {
    if (selectedCategories.length === 0) {
      setError("Please select at least one category")
      return
    }

    try {
      setQuizState("loading")
      setError(null)

      const questionsData = await getRandomQuestionsFromCategories(selectedCategories, questionCount)

      if (questionsData.length === 0) {
        setError("No questions found for selected categories")
        setQuizState("setup")
        return
      }

      if (questionsData.length < questionCount) {
        setError(`Only ${questionsData.length} questions available for selected categories`)
      }

      setQuestions(questionsData)
      setCurrentQuestionIndex(0)
      setUserAnswers([])
      setUserAnswer("")
      setEvaluationResults([])
      setRawAiResponse("")
      setQuizState("playing")
    } catch (err) {
      setError("Failed to load questions: " + (err as Error).message)
      setQuizState("setup")
    }
  }

  const submitAnswer = () => {
    if (!currentQuestion) return

    const newAnswer: UserAnswer = {
      questionId: currentQuestion.id.toString(),
      question: currentQuestion.question,
      userAnswer: userAnswer.trim(),
      correctAnswer: currentQuestion.answer,
    }

    const updatedAnswers = [...userAnswers, newAnswer]
    setUserAnswers(updatedAnswers)

    // Move to next question or finish quiz
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setUserAnswer("")
    } else {
      // All questions answered, start evaluation
      evaluateAnswersWithAI(updatedAnswers)
    }
  }

  const evaluateAnswersWithAI = async (answers: UserAnswer[]) => {
    try {
      setQuizState("evaluating")
      setError(null)

      const currentSettings = getAISettings()

      const questionsForPrompt = answers.map((answer) => ({
        question: answer.question,
        correctAnswer: answer.correctAnswer,
        userAnswer: answer.userAnswer,
      }))

      const prompt = formatPrompt(currentSettings.prompts[currentSettings.currentService], questionsForPrompt)

      const response = await fetch("/api/evaluate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          service: currentSettings.currentService,
          model: currentSettings.models[currentSettings.currentService],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to evaluate answers")
      }

      const evaluation = data.evaluation
      setRawAiResponse(evaluation)

      const results = parseEvaluationResponse(evaluation, answers)
      setEvaluationResults(results)
      setQuizState("finished")
    } catch (err) {
      console.error("AI evaluation failed:", err)
      setError(`AI evaluation failed using ${aiSettings.currentService}. Please try again or contact support.`)
      setQuizState("playing")
    }
  }

  const parseEvaluationResponse = (evaluation: string, answers: UserAnswer[]): EvaluationResult[] => {
    // Use the same parsing logic from the original quiz-maker
    const results: EvaluationResult[] = []

    try {
      if (evaluation.includes("===QUESTION")) {
        return parseGeminiFormat(evaluation, answers)
      }

      const questionBlocks = evaluation.split(/(?=Question:)/i).filter((block) => block.trim())

      questionBlocks.forEach((block, index) => {
        if (index >= answers.length) return

        const questionMatch = block.match(/Question:\s*(.+?)(?=\nCorrect Answer:|$)/is)
        const correctAnswerMatch = block.match(/Correct Answer:\s*(.+?)(?=\nUser Answer:|$)/is)
        const userAnswerMatch = block.match(/User Answer:\s*(.+?)(?=\nResult:|$)/is)
        const resultMatch = block.match(/Result:\s*(Correct|Incorrect)/i)
        const justificationMatch = block.match(/Justification:\s*(.+?)(?=\n\n|$)/is)

        const resultText = resultMatch?.[1]?.trim() || "Incorrect"
        const justification = justificationMatch?.[1]?.trim() || "Evaluation completed"
        const isCorrect = resultText.toLowerCase() === "correct"

        const result: EvaluationResult = {
          question: answers[index].question,
          correctAnswer: answers[index].correctAnswer,
          userAnswer: answers[index].userAnswer,
          result: isCorrect ? "Correct" : "Incorrect",
          justification: justification,
        }

        results.push(result)
      })

      return results
    } catch (parseError) {
      console.error("Parsing error:", parseError)
      return answers.map((answer, index) => ({
        question: answer.question,
        correctAnswer: answer.correctAnswer,
        userAnswer: answer.userAnswer,
        result: "Incorrect" as const,
        justification: `Parsing failed - Question ${index + 1}`,
      }))
    }
  }

  const parseGeminiFormat = (evaluation: string, answers: UserAnswer[]): EvaluationResult[] => {
    try {
      const questionBlocks = evaluation.split(/===QUESTION \d+===/i).filter((block) => block.trim())
      const results: EvaluationResult[] = []

      questionBlocks.forEach((block, index) => {
        if (index >= answers.length) return

        const questionMatch = block.match(/Question:\s*(.+?)(?=\nCorrect Answer:|$)/is)
        const correctAnswerMatch = block.match(/Correct Answer:\s*(.+?)(?=\nUser Answer:|$)/is)
        const userAnswerMatch = block.match(/User Answer:\s*(.+?)(?=\nResult:|$)/is)
        const resultMatch = block.match(/Result:\s*(Correct|Incorrect)/i)
        const justificationMatch = block.match(/Justification:\s*(.+?)(?=\n===|$)/is)

        const resultText = resultMatch?.[1]?.trim() || "Incorrect"
        const justification = justificationMatch?.[1]?.trim() || "Evaluation completed"
        const isCorrect = resultText.toLowerCase() === "correct"

        const result: EvaluationResult = {
          question: answers[index].question,
          correctAnswer: answers[index].correctAnswer,
          userAnswer: answers[index].userAnswer,
          result: isCorrect ? "Correct" : "Incorrect",
          justification: justification,
        }

        results.push(result)
      })

      return results
    } catch (error) {
      console.error("Gemini format parsing failed:", error)
      return answers.map((answer, index) => ({
        question: answer.question,
        correctAnswer: answer.correctAnswer,
        userAnswer: answer.userAnswer,
        result: "Incorrect" as const,
        justification: `Parsing failed - Question ${index + 1}`,
      }))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && userAnswer.trim() && quizState === "playing") {
      submitAnswer()
    }
  }

  const restartQuiz = () => {
    setQuizState("setup")
    setQuestions([])
    setUserAnswers([])
    setEvaluationResults([])
    setCurrentQuestionIndex(0)
    setUserAnswer("")
    setError(null)
  }

  // Setup State
  if (quizState === "setup") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="h-6 w-6" />
                Quiz Maker Setup
              </h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="py-4">
                <p className="text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Categories</CardTitle>
                <p className="text-sm text-gray-600">Choose which categories to include in your quiz</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Categories */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Main Categories</h3>
                  {categories
                    .filter((cat) => cat.type === "main")
                    .map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <Checkbox
                          id={category.id}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <Label htmlFor={category.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{category.icon}</span>
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-xs text-gray-500">{category.totalQuestions} questions available</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                </div>

                {/* Legacy Categories */}
                {categories.filter((cat) => cat.type === "legacy").length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-medium text-gray-900">Special Quiz Pools</h3>
                    {categories
                      .filter((cat) => cat.type === "legacy")
                      .map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 bg-gradient-to-r from-yellow-50 to-orange-50"
                        >
                          <Checkbox
                            id={category.id}
                            checked={selectedCategories.includes(category.id)}
                            onCheckedChange={() => handleCategoryToggle(category.id)}
                          />
                          <Label htmlFor={category.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{category.icon}</span>
                              <div>
                                <p className="font-medium">{category.name}</p>
                                <p className="text-xs text-gray-500">
                                  {category.totalQuestions} questions available • Legacy Pool
                                </p>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCategories(categories.map((c) => c.id))}
                    >
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedCategories([])}>
                      Clear All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quiz Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Quiz Settings</CardTitle>
                <p className="text-sm text-gray-600">Configure your quiz preferences</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Number of Questions</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {QUESTION_COUNT_OPTIONS.map((count) => (
                      <Button
                        key={count}
                        variant={questionCount === count ? "default" : "outline"}
                        size="sm"
                        onClick={() => setQuestionCount(count)}
                      >
                        {count}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Selected Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.length === 0 ? (
                      <p className="text-sm text-gray-500">No categories selected</p>
                    ) : (
                      selectedCategories.map((categoryId) => {
                        const category = categories.find((c) => c.id === categoryId)
                        return category ? (
                          <Badge
                            key={categoryId}
                            variant={category.type === "legacy" ? "default" : "secondary"}
                            className={category.type === "legacy" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                          >
                            {category.icon} {category.name}
                            {category.type === "legacy" && " ⭐"}
                          </Badge>
                        ) : null
                      })
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={startQuiz} className="w-full" size="lg" disabled={selectedCategories.length === 0}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Quiz ({questionCount} questions)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // Loading State
  if (quizState === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your custom quiz...</p>
        </div>
      </div>
    )
  }

  // Evaluating State
  if (quizState === "evaluating") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Results...</h2>
          <p className="text-sm text-gray-500 mt-2">Please wait</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error && quizState !== "setup") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button onClick={restartQuiz} variant="outline">
                Try Again
              </Button>
              <Link href="/admin">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Link href="/">
                <Button>
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Finished State
  if (quizState === "finished") {
    const percentage = Math.round((correctAnswers / questions.length) * 100)
    const getScoreColor = () => {
      if (percentage >= 80) return "text-green-600"
      if (percentage >= 60) return "text-yellow-600"
      return "text-red-600"
    }

    const getScoreMessage = () => {
      if (percentage >= 90) return "Outstanding! 🏆"
      if (percentage >= 80) return "Excellent work! 🌟"
      if (percentage >= 70) return "Good job! 👍"
      if (percentage >= 60) return "Not bad! 👌"
      return "Keep practicing! 💪"
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="h-6 w-6" />
                Quiz Results
              </h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">Quiz Complete!</CardTitle>
              <div className={`text-6xl font-bold ${getScoreColor()}`}>
                {correctAnswers}/{questions.length}
              </div>
              <p className="text-xl text-gray-600 mt-2">{percentage}% Correct</p>
              <p className="text-lg mt-2">{getScoreMessage()}</p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex gap-4 justify-center flex-wrap">
                <Button onClick={restartQuiz} className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Create New Quiz
                </Button>
                <Link href="/">
                  <Button variant="outline">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {evaluationResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {result.result === "Correct" ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">
                          {index + 1}. {result.question}
                        </p>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="font-medium">Your answer:</span>{" "}
                            <span className={result.result === "Correct" ? "text-green-600" : "text-red-600"}>
                              {result.userAnswer || "(empty)"}
                            </span>
                          </p>
                          <p>
                            <span className="font-medium">Correct answer:</span>{" "}
                            <span className="text-green-600">{result.correctAnswer}</span>
                          </p>
                          {result.justification && (
                            <p className="text-xs text-gray-500 italic mt-2">
                              <span className="font-medium">Note:</span> {result.justification}
                            </p>
                          )}
                        </div>
                      </div>
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
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="h-6 w-6" />
                Custom Quiz
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentQuestionIndex + 1} / {questions.length}
              </Badge>
              <Badge variant="secondary">{aiSettings.currentService === "openai" ? "OpenAI" : "Gemini"}</Badge>
            </div>
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
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{currentQuestion?.category?.name}</Badge>
              <Badge variant="secondary">{currentQuestion?.difficulty_level || "medium"}</Badge>
            </div>
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
