"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Users,
  FileQuestion,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Star,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import {
  getPendingQuestions,
  getPendingQuizzes,
  getAllUsers,
  getMainCategories,
  updateUserPrivileges,
  reviewQuestion,
  reviewQuiz,
  type MainQuestion,
  type UserQuiz,
  type User,
  type MainCategory,
} from "@/lib/supabase"

export default function AdminDashboard() {
  const [pendingQuestions, setPendingQuestions] = useState<MainQuestion[]>([])
  const [pendingQuizzes, setPendingQuizzes] = useState<UserQuiz[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<MainCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock current admin user - in real app this would come from auth
  const currentAdminId = "550e8400-e29b-41d4-a716-446655440001"

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [questionsData, quizzesData, usersData, categoriesData] = await Promise.all([
        getPendingQuestions(),
        getPendingQuizzes(),
        getAllUsers(),
        getMainCategories(),
      ])

      setPendingQuestions(questionsData)
      setPendingQuizzes(quizzesData)
      setUsers(usersData)
      setCategories(categoriesData)
    } catch (err) {
      setError("Failed to load admin data: " + (err as Error).message)
      console.error("Admin dashboard error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewQuestion = async (questionId: string, status: "approved" | "rejected", notes?: string) => {
    try {
      await reviewQuestion(questionId, status, currentAdminId, notes)
      await fetchData() // Refresh data
    } catch (err) {
      setError("Failed to review question: " + (err as Error).message)
    }
  }

  const handleReviewQuiz = async (quizId: string, status: "approved" | "rejected", notes?: string) => {
    try {
      await reviewQuiz(quizId, status, currentAdminId, notes)
      await fetchData() // Refresh data
    } catch (err) {
      setError("Failed to review quiz: " + (err as Error).message)
    }
  }

  const handleUpdateUserPrivileges = async (userId: string, isPrivileged: boolean, role: string) => {
    try {
      await updateUserPrivileges(userId, isPrivileged, role)
      await fetchData() // Refresh data
    } catch (err) {
      setError("Failed to update user privileges: " + (err as Error).message)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Admin Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-orange-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingQuestions.length}</p>
                <p className="text-sm text-gray-600">Pending Questions</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <BookOpen className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingQuizzes.length}</p>
                <p className="text-sm text-gray-600">Pending Quizzes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <FileQuestion className="h-8 w-8 text-purple-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                <p className="text-sm text-gray-600">Categories</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <FileQuestion className="h-4 w-4" />
              Review Questions ({pendingQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Review Quizzes ({pendingQuizzes.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Manage Users
            </TabsTrigger>
          </TabsList>

          {/* Pending Questions Tab */}
          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <CardTitle>Pending Questions Review</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingQuestions.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">No pending questions to review!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingQuestions.map((question) => (
                      <div key={question.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{question.category?.name}</Badge>
                              <Badge variant="secondary">{question.difficulty_level}</Badge>
                              {question.is_anonymous ? (
                                <Badge variant="outline">Anonymous</Badge>
                              ) : (
                                <span className="text-sm text-gray-600">
                                  by {question.author?.full_name || question.author?.username}
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{question.question}</h3>
                            <p className="text-gray-700 mb-2">
                              <span className="font-medium">Answer:</span> {question.answer}
                            </p>
                            <p className="text-xs text-gray-500">
                              Submitted: {new Date(question.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleReviewQuestion(question.id, "approved")}
                            className="flex items-center gap-2"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReviewQuestion(question.id, "rejected", "Needs improvement")}
                            variant="destructive"
                            className="flex items-center gap-2"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Quizzes Tab */}
          <TabsContent value="quizzes">
            <Card>
              <CardHeader>
                <CardTitle>Pending Quizzes Review</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingQuizzes.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">No pending quizzes to review!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingQuizzes.map((quiz) => (
                      <div key={quiz.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-gray-600">
                                by {quiz.author?.full_name || quiz.author?.username}
                              </span>
                              <Badge variant="outline">{quiz.questions?.length || 0} questions</Badge>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                            {quiz.description && <p className="text-gray-700 mb-2">{quiz.description}</p>}
                            {quiz.tags && quiz.tags.length > 0 && (
                              <div className="flex gap-1 mb-2">
                                {quiz.tags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-500">
                              Submitted: {new Date(quiz.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleReviewQuiz(quiz.id, "approved")}
                            className="flex items-center gap-2"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReviewQuiz(quiz.id, "rejected", "Needs improvement")}
                            variant="destructive"
                            className="flex items-center gap-2"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{user.full_name || user.username}</h3>
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : user.role === "contributor" ? "secondary" : "outline"
                            }
                          >
                            {user.role}
                          </Badge>
                          {user.is_privileged && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              <Star className="h-3 w-3 mr-1" />
                              Privileged
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {user.role !== "admin" && (
                          <>
                            <Button
                              onClick={() => handleUpdateUserPrivileges(user.id, !user.is_privileged, user.role)}
                              variant={user.is_privileged ? "outline" : "default"}
                              size="sm"
                            >
                              {user.is_privileged ? "Remove Privileges" : "Grant Privileges"}
                            </Button>
                            <Button
                              onClick={() =>
                                handleUpdateUserPrivileges(
                                  user.id,
                                  user.is_privileged,
                                  user.role === "contributor" ? "user" : "contributor",
                                )
                              }
                              variant="outline"
                              size="sm"
                            >
                              {user.role === "contributor" ? "Make User" : "Make Contributor"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
