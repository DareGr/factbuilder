import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Question = {
  id: number
  question: string
  answer: string
  image_url: string | null
  level?: string
  created_at: string
}

export type MainQuestion = {
  id: string
  category_id: string
  author_id: string | null
  question: string
  answer: string
  image_url: string | null
  difficulty_level: "easy" | "medium" | "hard"
  is_anonymous: boolean
  is_reusable: boolean
  status: "pending" | "approved" | "rejected"
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  category?: MainCategory
  author?: User
  reviewer?: User
}

export type MainCategory = {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  slug: string
  is_active: boolean
  created_at: string
  updated_at: string
  totalQuestions?: number
}

export type User = {
  id: string
  email: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  role: "user" | "contributor" | "admin"
  is_privileged: boolean
  created_at: string
  updated_at: string
}

export type UserQuiz = {
  id: string
  author_id: string
  title: string
  description: string | null
  tags: string[] | null
  is_public: boolean
  is_draft: boolean
  status: "draft" | "pending" | "approved" | "rejected"
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  play_count: number
  rating_sum: number
  rating_count: number
  created_at: string
  updated_at: string
  // Joined fields
  author?: User
  reviewer?: User
  questions?: QuizQuestion[]
  average_rating?: number
}

export type QuizQuestion = {
  id: string
  quiz_id: string
  question: string
  answer: string
  image_url: string | null
  order_index: number
  created_at: string
}

export type QuizCategory = {
  id: string
  name: string
  description: string
  table: string
  icon: string
  color: string
  totalQuestions?: number
  type: "main" | "legacy" // Add type to distinguish
}

// Legacy quiz categories (keeping for backward compatibility)
export const legacyQuizCategories: QuizCategory[] = [
  {
    id: "worldcup",
    name: "World Cup Quiz",
    description: "Test your knowledge about World Cup history, players, and memorable moments",
    table: "wcquizz",
    icon: "🏆",
    color: "bg-green-500",
    totalQuestions: 0,
    type: "legacy",
  },
]

// Main category functions
export async function getMainCategories(): Promise<MainCategory[]> {
  const { data, error } = await supabase.from("main_categories").select("*").eq("is_active", true).order("name")

  if (error) throw error
  return data || []
}

export async function getMainCategoriesWithStats(): Promise<MainCategory[]> {
  const categories = await getMainCategories()

  const categoriesWithStats = await Promise.all(
    categories.map(async (category) => {
      const { count } = await supabase
        .from("main_questions")
        .select("*", { count: "exact", head: true })
        .eq("category_id", category.id)
        .eq("status", "approved")

      return {
        ...category,
        totalQuestions: count || 0,
      }
    }),
  )

  return categoriesWithStats
}

// Get all categories for Quiz Maker (both main and legacy)
export async function getAllCategoriesForQuizMaker(): Promise<QuizCategory[]> {
  const allCategories: QuizCategory[] = []

  // Get main categories
  const mainCategories = await getMainCategoriesWithStats()
  const mainCategoriesAsQuizCategories: QuizCategory[] = mainCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description || "",
    table: "main_questions",
    icon: cat.icon || "📚",
    color: cat.color || "bg-blue-500",
    totalQuestions: cat.totalQuestions || 0,
    type: "main",
  }))

  allCategories.push(...mainCategoriesAsQuizCategories)

  // Get legacy categories with stats
  const updatedLegacyCategories = await Promise.all(
    legacyQuizCategories.map(async (category) => {
      const { count } = await supabase.from(category.table).select("*", { count: "exact", head: true })
      return {
        ...category,
        totalQuestions: count || 0,
      }
    }),
  )

  allCategories.push(...updatedLegacyCategories)

  return allCategories
}

export async function getApprovedQuestionsByCategory(categoryId: string): Promise<MainQuestion[]> {
  const { data, error } = await supabase
    .from("main_questions")
    .select(`
      *,
      category:main_categories(*),
      author:users!main_questions_author_id_fkey(*)
    `)
    .eq("category_id", categoryId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getAllApprovedQuestions(): Promise<MainQuestion[]> {
  const { data, error } = await supabase
    .from("main_questions")
    .select(`
      *,
      category:main_categories(*),
      author:users!main_questions_author_id_fkey(*)
    `)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

// Updated function to handle both main and legacy categories
export async function getRandomQuestionsFromCategories(categoryIds: string[], count: number): Promise<any[]> {
  const allQuestions: any[] = []

  for (const categoryId of categoryIds) {
    // Check if it's a main category
    const mainCategories = await getMainCategories()
    const isMainCategory = mainCategories.some((cat) => cat.id === categoryId)

    if (isMainCategory) {
      // Get questions from main_questions table
      const { data, error } = await supabase
        .from("main_questions")
        .select(`
          *,
          category:main_categories(*),
          author:users!main_questions_author_id_fkey(*)
        `)
        .eq("category_id", categoryId)
        .eq("status", "approved")

      if (error) throw error

      allQuestions.push(...(data || []))
    } else {
      // Check if it's a legacy category
      const legacyCategory = legacyQuizCategories.find((cat) => cat.id === categoryId)
      if (legacyCategory) {
        const { data, error } = await supabase.from(legacyCategory.table).select("*")

        if (error) throw error

        // Transform legacy questions to match the expected format
        const transformedQuestions = (data || []).map((q) => ({
          id: q.id.toString(),
          question: q.question,
          answer: q.answer,
          image_url: q.image_url,
          created_at: q.created_at,
          category: {
            id: legacyCategory.id,
            name: legacyCategory.name,
            icon: legacyCategory.icon,
            slug: legacyCategory.id,
          },
          difficulty_level: q.level || "medium",
        }))

        allQuestions.push(...transformedQuestions)
      }
    }
  }

  // Shuffle and take requested count
  const shuffled = allQuestions.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// Community quiz functions
export async function getApprovedCommunityQuizzes(): Promise<UserQuiz[]> {
  const { data, error } = await supabase
    .from("user_quizzes")
    .select(`
      *,
      author:users!user_quizzes_author_id_fkey(*),
      questions:quiz_questions(*)
    `)
    .eq("status", "approved")
    .eq("is_public", true)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data || []).map((quiz) => ({
    ...quiz,
    average_rating: quiz.rating_count > 0 ? quiz.rating_sum / quiz.rating_count : 0,
  }))
}

// Admin functions
export async function getPendingQuestions(): Promise<MainQuestion[]> {
  const { data, error } = await supabase
    .from("main_questions")
    .select(`
      *,
      category:main_categories(*),
      author:users!main_questions_author_id_fkey(*)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPendingQuizzes(): Promise<UserQuiz[]> {
  const { data, error } = await supabase
    .from("user_quizzes")
    .select(`
      *,
      author:users!user_quizzes_author_id_fkey(*),
      questions:quiz_questions(*)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateUserPrivileges(userId: string, isPrivileged: boolean, role: string): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({
      is_privileged: isPrivileged,
      role: role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) throw error
}

export async function reviewQuestion(
  questionId: string,
  status: "approved" | "rejected",
  reviewerId: string,
  notes?: string,
): Promise<void> {
  const { error } = await supabase
    .from("main_questions")
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", questionId)

  if (error) throw error
}

export async function reviewQuiz(
  quizId: string,
  status: "approved" | "rejected",
  reviewerId: string,
  notes?: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_quizzes")
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quizId)

  if (error) throw error
}

// Question submission for privileged users
export async function submitQuestion(questionData: {
  categoryId: string
  question: string
  answer: string
  imageUrl?: string
  difficultyLevel: "easy" | "medium" | "hard"
  isAnonymous: boolean
  isReusable: boolean
  authorId: string
}): Promise<void> {
  const { error } = await supabase.from("main_questions").insert([
    {
      category_id: questionData.categoryId,
      author_id: questionData.authorId,
      question: questionData.question,
      answer: questionData.answer,
      image_url: questionData.imageUrl || null,
      difficulty_level: questionData.difficultyLevel,
      is_anonymous: questionData.isAnonymous,
      is_reusable: questionData.isReusable,
      status: "pending",
    },
  ])

  if (error) throw error
}

// Community quiz submission
export async function submitCommunityQuiz(quizData: {
  title: string
  description?: string
  tags: string[]
  questions: Array<{ question: string; answer: string; imageUrl?: string }>
  authorId: string
}): Promise<void> {
  // Insert quiz
  const { data: quiz, error: quizError } = await supabase
    .from("user_quizzes")
    .insert([
      {
        author_id: quizData.authorId,
        title: quizData.title,
        description: quizData.description || null,
        tags: quizData.tags,
        is_draft: false,
        status: "pending",
      },
    ])
    .select()
    .single()

  if (quizError) throw quizError

  // Insert questions
  const questions = quizData.questions.map((q, index) => ({
    quiz_id: quiz.id,
    question: q.question,
    answer: q.answer,
    image_url: q.imageUrl || null,
    order_index: index + 1,
  }))

  const { error: questionsError } = await supabase.from("quiz_questions").insert(questions)

  if (questionsError) throw questionsError
}

// Helper function for fuzzy string matching
export function checkAnswerSimilarity(userAnswer: string, correctAnswer: string): boolean {
  if (!userAnswer || !correctAnswer) return false

  // Normalize both answers
  const normalizeString = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .replace(/\s+/g, " ") // Normalize spaces

  const normalizedUser = normalizeString(userAnswer)
  const normalizedCorrect = normalizeString(correctAnswer)

  // If exact match after normalization
  if (normalizedUser === normalizedCorrect) return true

  // Check if user answer contains most of the correct answer
  const correctWords = normalizedCorrect.split(" ").filter((word) => word.length > 2)
  const userWords = normalizedUser.split(" ")

  if (correctWords.length === 0) return normalizedUser.includes(normalizedCorrect)

  // Count how many correct words are found in user answer
  const matchedWords = correctWords.filter((word) =>
    userWords.some((userWord) => userWord.includes(word) || word.includes(userWord)),
  )

  // Consider correct if at least 70% of important words match
  const matchRatio = matchedWords.length / correctWords.length
  return matchRatio >= 0.7
}

export const quizCategories = [
  {
    id: "culture",
    name: "Culture Quiz",
    description: "Test your knowledge about culture",
    table: "culture_questions",
    icon: "🌍",
    color: "bg-blue-500",
  },
]
