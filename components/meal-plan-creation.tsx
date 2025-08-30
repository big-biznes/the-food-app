"use client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RotateCcw, Sunrise, Sun, Apple, Moon } from "lucide-react"

interface MealPlanCreationProps {
  selectedIngredients: string[]
  onComplete: () => void
  onBack: () => void
}

export default function MealPlanCreation({ selectedIngredients, onComplete, onBack }: MealPlanCreationProps) {
  const generatedMealPlan = {
    breakfast: [
      { name: "Salmon Avocado Toast", image: "/placeholder.svg?height=120&width=120" },
      { name: "Greek Yogurt Bowl", image: "/placeholder.svg?height=120&width=120" },
      { name: "Quinoa Breakfast Bowl", image: "/placeholder.svg?height=120&width=120" },
    ],
    lunch: [
      { name: "Grilled Chicken Salad", image: "/placeholder.svg?height=120&width=120" },
      { name: "Quinoa Power Bowl", image: "/placeholder.svg?height=120&width=120" },
      { name: "Salmon Poke Bowl", image: "/placeholder.svg?height=120&width=120" },
    ],
    snack: [
      { name: "Greek Yogurt Parfait", image: "/placeholder.svg?height=120&width=120" },
      { name: "Avocado Toast Bites", image: "/placeholder.svg?height=120&width=120" },
      { name: "Spinach Smoothie", image: "/placeholder.svg?height=120&width=120" },
    ],
    dinner: [
      { name: "Grilled Salmon Dinner", image: "/placeholder.svg?height=120&width=120" },
      { name: "Chicken Quinoa Bowl", image: "/placeholder.svg?height=120&width=120" },
      { name: "Sweet Potato Chicken", image: "/placeholder.svg?height=120&width=120" },
    ],
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="min-h-screen p-4 pb-8 space-y-6 max-w-md mx-auto">
        {/* Header with back button */}
        <div className="flex items-center space-x-3 sticky top-0 bg-white py-2 -mx-4 px-4 border-b border-gray-100 z-10">
          <Button size="sm" variant="ghost" onClick={onBack} className="text-gray-600 hover:text-gray-800 p-3">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Your Meal Plan</h1>
        </div>

        {/* Plan Overview */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Here's your personalized meal plan!</h2>
          {selectedIngredients.length > 0 && (
            <p className="text-gray-600">Based on your selected ingredients: {selectedIngredients.join(", ")}</p>
          )}
        </div>

        {/* Meal Sections */}
        <div className="space-y-8">
          {Object.entries(generatedMealPlan).map(([category, meals]) => {
            const categoryIcons = {
              breakfast: <Sunrise className="w-6 h-6 text-orange-500" />,
              lunch: <Sun className="w-6 h-6 text-yellow-500" />,
              snack: <Apple className="w-6 h-6 text-green-500" />,
              dinner: <Moon className="w-6 h-6 text-purple-500" />,
            }

            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center space-x-2">
                  {categoryIcons[category as keyof typeof categoryIcons]}
                  <h3 className="text-xl font-bold text-gray-900 capitalize">{category}</h3>
                </div>

                <div className="flex space-x-4 overflow-x-auto pb-2">
                  {meals.map((meal, index) => (
                    <div
                      key={index}
                      className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex-shrink-0 w-40"
                    >
                      <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                        <img
                          src={meal.image || "/placeholder.svg"}
                          alt={meal.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Servings pill */}
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full font-medium">
                          {Math.floor(Math.random() * 3) + 2} servings
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-gray-900 text-sm text-center">{meal.name}</h4>
                      </div>

                      {/* Reroll Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 w-8 h-8 p-0 bg-white/80 hover:bg-white rounded-full shadow-sm"
                        onClick={() => console.log(`Rerolling ${category} meal ${index}`)}
                      >
                        <RotateCcw className="w-4 h-4 text-gray-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Confirm Button */}
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto">
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-medium border-slate-300"
            onClick={() => {
              console.log("Confirming meal plan:", generatedMealPlan)
              onComplete()
            }}
          >
            Confirm Meal Plan
          </Button>
        </div>
      </div>
    </div>
  )
}
