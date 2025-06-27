<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900">FactBuilder</h1>
          <button
            @click="showAddForm = !showAddForm"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {{ showAddForm ? 'Cancel' : 'Add Question' }}
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Add Question Form -->
      <div v-if="showAddForm" class="mb-8">
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Add New Question</h2>
          <form @submit.prevent="addQuestion" class="space-y-4">
            <div>
              <label for="question" class="block text-sm font-medium text-gray-700 mb-2">
                Question *
              </label>
              <textarea
                id="question"
                v-model="newQuestion.question"
                required
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your question here..."
              ></textarea>
            </div>
            
            <div>
              <label for="answer" class="block text-sm font-medium text-gray-700 mb-2">
                Answer *
              </label>
              <textarea
                id="answer"
                v-model="newQuestion.answer"
                required
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter the answer here..."
              ></textarea>
            </div>
            
            <div>
              <label for="image_url" class="block text-sm font-medium text-gray-700 mb-2">
                Image URL (optional)
              </label>
              <input
                id="image_url"
                v-model="newQuestion.image_url"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div class="flex gap-3">
              <button
                type="submit"
                :disabled="loading"
                class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {{ loading ? 'Adding...' : 'Add Question' }}
              </button>
              <button
                type="button"
                @click="resetForm"
                class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="mb-6">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search questions..."
            class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && questions.length === 0" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading questions...</p>
      </div>

      <!-- Error State -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <!-- Questions Grid -->
      <div v-if="filteredQuestions.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="question in filteredQuestions"
          :key="question.id"
          class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          @click="toggleAnswer(question.id)"
        >
          <!-- Image -->
          <div v-if="question.image_url" class="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              :src="question.image_url"
              :alt="'Image for: ' + question.question"
              class="w-full h-full object-cover"
              @error="handleImageError"
            />
          </div>
          
          <!-- Content -->
          <div class="p-6">
            <!-- Question -->
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                {{ question.question }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ formatDate(question.created_at) }}
              </p>
            </div>
            
            <!-- Answer (toggleable) -->
            <div
              v-if="revealedAnswers.has(question.id)"
              class="border-t pt-4 mt-4 animate-fadeIn"
            >
              <p class="text-sm font-medium text-gray-600 mb-2">Answer:</p>
              <p class="text-gray-800">{{ question.answer }}</p>
            </div>
            
            <!-- Click hint -->
            <div v-else class="border-t pt-4 mt-4">
              <p class="text-sm text-gray-500 italic">Click to reveal answer</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900">No questions found</h3>
        <p class="mt-2 text-gray-500">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Get started by adding your first question!' }}
        </p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { createClient } from '@supabase/supabase-js'

// Supabase client setup
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

// Reactive data
const questions = ref([])
const loading = ref(false)
const error = ref('')
const showAddForm = ref(false)
const searchQuery = ref('')
const revealedAnswers = ref(new Set())

const newQuestion = ref({
  question: '',
  answer: '',
  image_url: ''
})

// Computed properties
const filteredQuestions = computed(() => {
  if (!searchQuery.value) return questions.value
  
  const query = searchQuery.value.toLowerCase()
  return questions.value.filter(q => 
    q.question.toLowerCase().includes(query) || 
    q.answer.toLowerCase().includes(query)
  )
})

// Methods
const fetchQuestions = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const { data, error: fetchError } = await supabase
      .from('culture_questions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (fetchError) throw fetchError
    
    questions.value = data || []
  } catch (err) {
    error.value = 'Failed to load questions: ' + err.message
    console.error('Error fetching questions:', err)
  } finally {
    loading.value = false
  }
}

const addQuestion = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const questionData = {
      question: newQuestion.value.question.trim(),
      answer: newQuestion.value.answer.trim(),
      image_url: newQuestion.value.image_url.trim() || null
    }
    
    const { data, error: insertError } = await supabase
      .from('culture_questions')
      .insert([questionData])
      .select()
    
    if (insertError) throw insertError
    
    // Add new question to the beginning of the list
    if (data && data[0]) {
      questions.value.unshift(data[0])
    }
    
    // Reset form and hide it
    resetForm()
    showAddForm.value = false
    
  } catch (err) {
    error.value = 'Failed to add question: ' + err.message
    console.error('Error adding question:', err)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  newQuestion.value = {
    question: '',
    answer: '',
    image_url: ''
  }
}

const toggleAnswer = (questionId) => {
  if (revealedAnswers.value.has(questionId)) {
    revealedAnswers.value.delete(questionId)
  } else {
    revealedAnswers.value.add(questionId)
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// Lifecycle
onMounted(() => {
  fetchQuestions()
})
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
</style>
