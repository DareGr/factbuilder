"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Question, MainQuestion } from "@/lib/supabase"
import { Calendar, Eye, EyeOff } from "lucide-react"

interface QuestionCardProps {
  question: Question | MainQuestion
}

export function QuestionCard({ question }: QuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [imageError, setImageError] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Handle both Question and MainQuestion types
  const isMainQuestion = "category" in question
  const displayQuestion = question.question
  const displayAnswer = question.answer
  const displayImageUrl = question.image_url
  const displayDate = question.created_at

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
      onClick={() => setShowAnswer(!showAnswer)}
    >
      {/* Image */}
      {displayImageUrl && !imageError && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img
            src={displayImageUrl || "/placeholder.svg"}
            alt={`Image for: ${displayQuestion}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      <CardContent className="p-6">
        {/* Question */}
        <div className="mb-4">
          {isMainQuestion && question.category && (
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {question.category.icon} {question.category.name}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {question.difficulty_level}
              </Badge>
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-tight">{displayQuestion}</h3>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(displayDate)}
          </div>
        </div>

        {/* Answer Section */}
        <div className="border-t pt-4">
          {showAnswer ? (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-2">
                <EyeOff className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-600">Answer:</p>
              </div>
              <p className="text-gray-800 leading-relaxed">{displayAnswer}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <Eye className="h-4 w-4" />
              <p className="text-sm italic">Click to reveal answer</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
