"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { getApprovedQuestionsByCategory, getMainCategories, type MainQuestion, type MainCategory } from "@/lib/supabase"
import { QuestionCard } from "@/components/question-card"
import { SearchBar } from "@/components/search-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play, Plus, BookOpen, Target } from "lucide-react"
import Link from "next/link"

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string

  const [category, setCategory] = useState<MainCategory | null>(null)
  const [questions, setQuestions] = useState<MainQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get all categories to find the one with matching slug
      const categories = await getMainCategories()
      const foundCategory = categories.find((cat) => cat.slug === slug)

      if (!foundCategory) {
        setError("Category not found")
        return
      }

      setCategory(foundCategory)

      // Get questions for this category
      const questionsData = await getApprovedQuestionsByCategory(foundCategory.id)
      setQuestions(questionsData)
    } catch (err) {
      setError("Failed to load category: " + (err as Error).message)
      console.error("Error fetching category:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestions = questions.filter(
    (q) =>
      searchQuery === "" ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  useEffect(() => {
    fetchData()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading category...</p>
        </div>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Category Not Found</h2>
            <p className="text-gray-600 mb-4">{error || "The requested category doesn't exist."}</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  {category.name}
                </h1>
                <p className="text-gray-600 mt-1">{category.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">{questions.length} questions</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Quick Quiz */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Quick Quiz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-100 mb-4">
                Take a quick 20-question quiz from this category to test your knowledge!
              </p>
              <Link href={`/quiz-maker?categories=${category.id}`}>
                <Button className="bg-white text-blue-600 hover:bg-gray-100">
                  <Target className="h-4 w-4 mr-2" />
                  Start Quiz
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Browse All */}
          <Card className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Study Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-100 mb-4">
                Browse all questions in this category to study and learn at your own pace.
              </p>
              <Button
                onClick={() => document.getElementById("questions-section")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-white text-green-600 hover:bg-gray-100"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Questions
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Search and Questions */}
        <div id="questions-section" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">All Questions</h2>
            <div className="w-full max-w-md">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search questions..." />
            </div>
          </div>

          {filteredQuestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? "Try adjusting your search terms."
                    : "This category doesn't have any approved questions yet."}
                </p>
                {!searchQuery && (
                  <Link href="/admin/dashboard">
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Questions
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
