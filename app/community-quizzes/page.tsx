"use client"

import { useState, useEffect } from "react"
import { getApprovedCommunityQuizzes, type UserQuiz } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchBar } from "@/components/search-bar"
import { ArrowLeft, Play, Star, Users, Clock, Plus, BookOpen } from "lucide-react"
import Link from "next/link"

export default function CommunityQuizzesPage() {
  const [quizzes, setQuizzes] = useState<UserQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      setError(null)

      const quizzesData = await getApprovedCommunityQuizzes()
      setQuizzes(quizzesData)
    } catch (err) {
      setError("Failed to load community quizzes: " + (err as Error).message)
      console.error("Error fetching quizzes:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      searchQuery === "" ||
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.author?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const formatRating = (rating: number) => {
    return rating > 0 ? rating.toFixed(1) : "New"
  }

  useEffect(() => {
    fetchQuizzes()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="h-8 w-8" />
                  Community Quizzes
                </h1>
                <p className="text-gray-600 mt-1">Discover quizzes created by the community</p>
              </div>
            </div>

            <Link href="/create-quiz">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Quiz
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <BookOpen className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{quizzes.length}</p>
                <p className="text-sm text-gray-600">Community Quizzes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{new Set(quizzes.map((q) => q.author_id)).size}</p>
                <p className="text-sm text-gray-600">Contributors</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Play className="h-8 w-8 text-purple-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {quizzes.reduce((sum, quiz) => sum + quiz.play_count, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Plays</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search quizzes by title, author, or tags..."
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading community quizzes...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="py-4">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Quizzes Grid */}
        {!loading && !error && (
          <>
            {filteredQuizzes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuizzes.map((quiz) => (
                  <Card key={quiz.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2 line-clamp-2">{quiz.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>by {quiz.author?.full_name || quiz.author?.username || "Anonymous"}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>{formatRating(quiz.average_rating || 0)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {quiz.description && <p className="text-gray-600 text-sm line-clamp-3">{quiz.description}</p>}

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{quiz.questions?.length || 0} questions</span>
                        <span>•</span>
                        <span>{quiz.play_count} plays</span>
                      </div>

                      {quiz.tags && quiz.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {quiz.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {quiz.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{quiz.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="pt-2">
                        <Link href={`/community-quiz/${quiz.id}`} className="w-full">
                          <Button className="w-full flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            Play Quiz
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery ? "Try adjusting your search terms." : "Be the first to create a community quiz!"}
                  </p>
                  <Link href="/create-quiz">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Quiz
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}
