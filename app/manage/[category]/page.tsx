"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase, quizCategories, type Question } from "@/lib/supabase"
import { AddQuestionForm } from "@/components/add-question-form"
import { QuestionCard } from "@/components/question-card"
import { SearchBar } from "@/components/search-bar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"

export default function ManageCategoryPage() {
  const params = useParams()
  const categoryId = params.category as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const category = quizCategories.find((cat) => cat.id === categoryId)

  const fetchQuestions = async () => {
    if (!category) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from(category.table)
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setQuestions(data || [])
    } catch (err) {
      setError("Failed to load questions: " + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = async (questionData: Omit<Question, "id" | "created_at">) => {
    if (!category) return { success: false, error: "Category not found" }

    try {
      const { data, error: insertError } = await supabase.from(category.table).insert([questionData]).select().single()

      if (insertError) throw insertError

      setQuestions((prev) => [data, ...prev])
      setShowAddForm(false)

      return { success: true }
    } catch (err) {
      console.error("Error adding question:", err)
      return { success: false, error: (err as Error).message }
    }
  }

  const filteredQuestions = questions.filter(
    (q) =>
      searchQuery === "" ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  useEffect(() => {
    fetchQuestions()
  }, [categoryId])

  if (!category) {
    return <div>Category not found</div>
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
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                Manage {category.name}
              </h1>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              {showAddForm ? "Cancel" : "Add Question"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showAddForm && (
          <div className="mb-8">
            <AddQuestionForm onSubmit={addQuestion} onCancel={() => setShowAddForm(false)} />
          </div>
        )}

        <div className="mb-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search questions..." />
        </div>

        {filteredQuestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? "Try adjusting your search terms." : "Get started by adding your first question!"}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
