"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface CravingsPageProps {
  onComplete: (selectedIngredients: string[]) => void
  onBack: () => void
}

export default function CravingsPage({ onComplete, onBack }: CravingsPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [showCravingsChoice, setShowCravingsChoice] = useState(true)

  const ingredientsData = {
    vegetables: [
      "Tomatoes",
      "Carrots",
      "Spinach",
      "Broccoli",
      "Bell Peppers",
      "Onions",
      "Garlic",
      "Cucumber",
      "Lettuce",
      "Mushrooms",
    ],
    meat: [
      "Chicken Breast",
      "Ground Beef",
      "Salmon",
      "Pork Chops",
      "Turkey",
      "Bacon",
      "Shrimp",
      "Tuna",
      "Lamb",
      "Duck",
    ],
    dairy: [
      "Milk",
      "Cheddar Cheese",
      "Greek Yogurt",
      "Butter",
      "Cream Cheese",
      "Mozzarella",
      "Parmesan",
      "Heavy Cream",
      "Cottage Cheese",
      "Sour Cream",
    ],
    grains: [
      "Brown Rice",
      "Quinoa",
      "Whole Wheat Bread",
      "Oats",
      "Pasta",
      "Barley",
      "Couscous",
      "Bulgur",
      "Wild Rice",
      "Buckwheat",
    ],
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="min-h-screen p-4 pb-8 space-y-6 max-w-md mx-auto">
        {/* Header with back button */}
        <div className="flex items-center space-x-3 sticky top-0 bg-white py-2 -mx-4 px-4 border-b border-gray-100">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onBack()
              setSearchQuery("")
              setSelectedIngredients([])
              setShowCravingsChoice(true)
            }}
            className="text-gray-600 hover:text-gray-800 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">New Meal Plan</h1>
        </div>

        {/* Question */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Any cravings this week?</h2>
          <p className="text-gray-600">Search and select ingredients you'd like to include in your meal plan</p>
        </div>

        {/* Yes/No Choice Buttons */}
        {showCravingsChoice && (
          <div className="flex animate-in fade-in-0 duration-300 space-x-2.5 items-center flex-row justify-center">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-lg rounded-full py-8"
              onClick={() => setShowCravingsChoice(false)}
            >
              Yes
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium text-lg bg-transparent rounded-full py-8"
              onClick={() => {
                console.log("Creating meal plan with no cravings")
                onComplete([])
              }}
            >
              No
            </Button>
          </div>
        )}

        {/* Search Bar - only show when choice is made */}
        {!showCravingsChoice && (
          <div className="relative animate-in slide-in-from-bottom-4 fade-in-0 duration-500">
            <input
              type="text"
              placeholder="Search for ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 focus:border-emerald-500 rounded-2xl bg-white text-lg"
            />
          </div>
        )}

        {/* Recent Cravings */}
        {!showCravingsChoice && !searchQuery && (
          <div className="space-y-3 transition-opacity duration-300">
            <h3 className="font-semibold text-gray-900">Recent Cravings:</h3>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {["Salmon", "Avocado", "Quinoa", "Greek Yogurt", "Spinach", "Chicken Breast", "Sweet Potato"].map(
                (craving) => (
                  <button
                    key={craving}
                    onClick={() =>
                      setSelectedIngredients((prev) => (prev.includes(craving) ? prev : [...prev, craving]))
                    }
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      selectedIngredients.includes(craving)
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    {craving}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        {/* Selected Ingredients */}
        {!showCravingsChoice && selectedIngredients.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Selected Ingredients:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedIngredients.map((ingredient) => (
                <button
                  key={ingredient}
                  onClick={() => setSelectedIngredients((prev) => prev.filter((i) => i !== ingredient))}
                  className="px-3 py-1 rounded-full text-sm font-medium border bg-emerald-100 text-emerald-800 border-emerald-200 hover:opacity-80 transition-opacity"
                >
                  {ingredient} ×
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ingredients List */}
        {!showCravingsChoice && searchQuery && (
          <div className="space-y-2 animate-in slide-in-from-bottom-4 fade-in-0 duration-300">
            <h3 className="font-semibold text-gray-900">All Ingredients:</h3>
            <div className="space-y-1">
              {Object.values(ingredientsData)
                .flat()
                .filter(
                  (ingredient) =>
                    ingredient.toLowerCase().includes(searchQuery.toLowerCase()) &&
                    !selectedIngredients.includes(ingredient),
                )
                .map((ingredient) => (
                  <button
                    key={ingredient}
                    onClick={() => setSelectedIngredients((prev) => [...prev, ingredient])}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  >
                    <span className="text-gray-900">{ingredient}</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        {!showCravingsChoice && selectedIngredients.length > 0 && (
          <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-medium border-slate-300"
              onClick={() => {
                console.log("Creating meal plan with:", selectedIngredients)
                onComplete(selectedIngredients)
              }}
            >
              Create Meal Plan ({selectedIngredients.length} ingredients)
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
