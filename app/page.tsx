"use client"

import { useState, useEffect } from "react"
import {
  supabase,
  legacyQuizCategories,
  getMainCategoriesWithStats,
  type MainCategory,
  type QuizCategory,
} from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Users, Clock, Trophy, Settings, Shield, Target, BookOpen } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([])
  const [legacyCategories, setLegacyCategories] = useState<QuizCategory[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch main categories with stats
      const mainCategoriesData = await getMainCategoriesWithStats()
      setMainCategories(mainCategoriesData)

      // Fetch legacy category stats
      const updatedLegacyCategories = await Promise.all(
        legacyQuizCategories.map(async (category) => {
          const { count } = await supabase.from(category.table).select("*", { count: "exact", head: true })
          return {
            ...category,
            totalQuestions: count || 0,
          }
        }),
      )
      setLegacyCategories(updatedLegacyCategories)
    } catch (error) {
      console.error("Error fetching data:", error)
      setMainCategories([])
      setLegacyCategories(legacyQuizCategories)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const totalQuestions =
    mainCategories.reduce((sum, cat) => sum + (cat.totalQuestions || 0), 0) +
    legacyCategories.reduce((sum, cat) => sum + (cat.totalQuestions || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">FactBuilder</h1>
              <p className="text-lg text-gray-600">Choose your quiz category and test your knowledge!</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  AI Settings
                </Button>
              </Link>
              <Link href="/admin/dashboard">
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="flex items-center p-6">
              <Trophy className="h-8 w-8 text-yellow-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
                <p className="text-sm text-gray-600">Total Questions</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{mainCategories.length + legacyCategories.length}</p>
                <p className="text-sm text-gray-600">Quiz Categories</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">∞</p>
                <p className="text-sm text-gray-600">Practice Time</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Main Categories</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mainCategories.map((category) => (
                <Card key={category.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-3xl">{category.icon}</span>
                      <div>
                        <h3 className="text-xl font-bold">{category.name}</h3>
                        <Badge variant="secondary" className="mt-1">
                          {category.totalQuestions} questions
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-gray-600">{category.description}</p>

                    <div className="flex gap-2">
                      <Link href={`/category/${category.slug}`} className="flex-1">
                        <Button className="w-full flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Browse Questions
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quiz Maker Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quiz Maker</h2>
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Target className="h-8 w-8" />
                <div>
                  <h3 className="text-2xl font-bold">Custom Quiz Generator</h3>
                  <p className="text-purple-100 mt-1">Create personalized quizzes from multiple categories</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-purple-100">
                Select questions from different main categories and choose how many questions you want (10, 20, 30, 40,
                or 50). Perfect for comprehensive testing across multiple subjects!
              </p>
              <Link href="/quiz-maker">
                <Button className="bg-white text-purple-600 hover:bg-gray-100">
                  <Target className="h-4 w-4 mr-2" />
                  Create Custom Quiz
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Community Quizzes Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Quizzes</h2>
          <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BookOpen className="h-8 w-8" />
                <div>
                  <h3 className="text-2xl font-bold">User-Created Quizzes</h3>
                  <p className="text-blue-100 mt-1">Discover quizzes created by the community</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-blue-100">
                Explore quizzes created by other users, rate them, and create your own to share with the community. All
                community quizzes are reviewed before publication.
              </p>
              <div className="flex gap-2">
                <Link href="/community-quizzes">
                  <Button className="bg-white text-blue-600 hover:bg-gray-100">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Community Quizzes
                  </Button>
                </Link>
                <Link href="/create-quiz">
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
                  >
                    Create Your Quiz
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legacy Categories (if any) */}
        {legacyCategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Special Quizzes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {legacyCategories.map((category) => (
                <Card key={category.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-3xl">{category.icon}</span>
                      <div>
                        <h3 className="text-xl font-bold">{category.name}</h3>
                        <Badge variant="secondary" className="mt-1">
                          {category.totalQuestions} questions
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-gray-600">{category.description}</p>

                    <div className="flex gap-2">
                      <Link href={`/quiz/${category.id}`} className="flex-1">
                        <Button className="w-full flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Start Quiz
                        </Button>
                      </Link>
                      <Link href={`/manage/${category.id}`}>
                        <Button variant="outline" size="icon">
                          ⚙️
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Coming Soon */}
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">More Features Coming Soon!</h3>
            <p className="text-gray-500">We're working on adding more exciting features and quiz types.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
