"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import Button from "@/components/ui/button"

interface CalendarViewProps {
  onBackToDay?: () => void
}

export default function CalendarView({ onBackToDay }: CalendarViewProps = {}) {
  const [selectedDate, setSelectedDate] = useState(15)

  const generateCalendarDays = () => {
    const days = []
    for (let i = 1; i <= 31; i++) {
      days.push(i)
    }
    return days
  }

  const getDailyInfo = (date: number) => {
    // Sample data that varies by date
    const baseCalories = 1800
    const variation = (date % 7) * 50
    return {
      calories: baseCalories + variation,
      meals: 4,
      water: Math.min(8, 4 + (date % 5)),
      exercise: date % 3 === 0 ? "Rest day" : date % 2 === 0 ? "30 min run" : "45 min yoga",
    }
  }

  const dailyInfo = getDailyInfo(selectedDate)

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">January 2025</h1>
          <div className="flex items-center space-x-1">
            <ChevronLeft className="w-5 h-5 text-gray-400" />
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        {onBackToDay && (
          <Button
            onClick={onBackToDay}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 p-0"
            variant="ghost"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Button>
        )}
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                  day === selectedDate
                    ? "bg-emerald-600 text-white"
                    : day === 15
                      ? "bg-emerald-100 text-emerald-700"
                      : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Info - Always shown below calendar */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">January {selectedDate}, 2025</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">{dailyInfo.calories}</div>
                <div className="text-sm text-gray-600">Calories</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meal History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                // Generate meal history based on selected date
                const mealHistory = {
                  1: {
                    breakfast: "Overnight Oats with Berries",
                    lunch: "Mediterranean Quinoa Bowl",
                    snack: "Greek Yogurt with Almonds",
                    dinner: "Grilled Salmon with Vegetables",
                  },
                  2: {
                    breakfast: "Avocado Toast with Eggs",
                    lunch: "Chicken Caesar Salad",
                    snack: "Apple with Peanut Butter",
                    dinner: "Vegetable Stir Fry with Tofu",
                  },
                  3: {
                    breakfast: "Smoothie Bowl",
                    lunch: "Turkey and Hummus Wrap",
                    snack: "Mixed Nuts",
                    dinner: "Pasta with Marinara Sauce",
                  },
                }

                const dayMeals = mealHistory[selectedDate as keyof typeof mealHistory] || {
                  breakfast: "Oatmeal with Fruit",
                  lunch: "Grilled Chicken Salad",
                  snack: "Protein Bar",
                  dinner: "Baked Fish with Rice",
                }

                return Object.entries(dayMeals).map(([mealType, mealName]) => (
                  <div key={mealType} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium capitalize">{mealType}</span>
                      <div className="text-sm text-gray-600">{mealName}</div>
                    </div>
                    <span className="text-sm text-gray-600">{Math.floor(dailyInfo.calories / 4)} cal</span>
                  </div>
                ))
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
