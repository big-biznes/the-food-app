"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChefHat, CheckCircle } from "lucide-react"

interface RecipeDetailsProps {
  recipe: { name: string; type: string }
  onBack: () => void
}

export default function RecipeDetails({ recipe, onBack }: RecipeDetailsProps) {
  const [showCookingSteps, setShowCookingSteps] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const mockRecipes = {
    "Overnight Oats with Berries": {
      ingredients: ["1 cup rolled oats", "1 cup milk", "1/2 cup mixed berries", "1 tbsp honey", "1 tbsp chia seeds"],
      instructions: [
        "Mix oats and milk in a jar",
        "Add honey and chia seeds",
        "Refrigerate overnight",
        "Top with berries before serving",
      ],
      prepTime: "5 min",
      cookTime: "0 min",
      calories: 320,
    },
    "Mediterranean Quinoa Bowl": {
      ingredients: [
        "1 cup cooked quinoa",
        "1/2 cup chickpeas",
        "1/4 cup cucumber",
        "1/4 cup tomatoes",
        "2 tbsp tahini",
      ],
      instructions: [
        "Cook quinoa according to package instructions",
        "Dice cucumber and tomatoes into small pieces",
        "Drain and rinse chickpeas",
        "Mix all ingredients in a bowl",
        "Drizzle with tahini and serve",
      ],
      prepTime: "10 min",
      cookTime: "15 min",
      calories: 450,
    },
    "Greek Yogurt with Almonds": {
      ingredients: ["1 cup Greek yogurt", "1/4 cup sliced almonds", "1 tbsp honey", "1/2 tsp vanilla"],
      instructions: [
        "Place yogurt in a serving bowl",
        "Top with sliced almonds",
        "Drizzle with honey",
        "Add vanilla and mix gently",
      ],
      prepTime: "2 min",
      cookTime: "0 min",
      calories: 280,
    },
  }

  const recipeData = mockRecipes[recipe.name as keyof typeof mockRecipes] || {
    ingredients: ["Recipe not found"],
    instructions: ["Recipe details not available"],
    prepTime: "N/A",
    cookTime: "N/A",
    calories: 0,
  }

  const nextStep = () => {
    if (currentStep < recipeData.instructions.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const finishCooking = () => {
    setShowCookingSteps(false)
    setCurrentStep(0)
    onBack()
  }

  if (showCookingSteps) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="min-h-screen max-w-sm mx-auto bg-white">
          {/* Cooking Steps Header */}
          <div className="flex items-center space-x-3 sticky top-0 bg-white/95 backdrop-blur-sm py-4 px-4 border-b border-gray-100 z-10">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowCookingSteps(false)
                setCurrentStep(0)
              }}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900 truncate flex-1">Cooking Steps</h1>
            <div className="text-sm text-gray-500">
              {currentStep + 1}/{recipeData.instructions.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-4 py-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / recipeData.instructions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Current Step */}
          <div className="px-4 py-8 space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <ChefHat className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Step {currentStep + 1}</h2>
              <p className="text-gray-700 text-lg leading-relaxed">{recipeData.instructions[currentStep]}</p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto">
            <div className="flex space-x-3">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-300 bg-transparent"
                >
                  Previous
                </Button>
              )}

              {currentStep < recipeData.instructions.length - 1 ? (
                <Button
                  onClick={nextStep}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  onClick={finishCooking}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Finish Cooking</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="min-h-screen max-w-sm mx-auto bg-white">
        {/* Header with back button */}
        <div className="flex items-center space-x-3 sticky top-0 bg-white/95 backdrop-blur-sm py-4 px-4 border-b border-gray-100 z-10">
          <Button
            size="sm"
            variant="ghost"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900 truncate flex-1">{recipe.name}</h1>
        </div>

        {/* Hero Image */}
        <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-teal-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <div className="text-3xl">🍽️</div>
            </div>
          </div>
        </div>

        {/* Recipe content */}
        <div className="px-4 py-4 space-y-4 pb-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="text-xl font-bold text-emerald-600 mb-1">{recipeData.prepTime}</div>
              <div className="text-xs text-emerald-700 font-medium">Prep</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-100">
              <div className="text-xl font-bold text-orange-600 mb-1">{recipeData.cookTime}</div>
              <div className="text-xs text-orange-700 font-medium">Cook</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="text-xl font-bold text-blue-600 mb-1">{recipeData.calories}</div>
              <div className="text-xs text-blue-700 font-medium">Calories</div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Ingredients</h3>
            </div>
            <div className="px-4 py-3">
              <div className="space-y-2">
                {recipeData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed">{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Start Cooking Button */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Ready to Cook?</h3>
            </div>
            <div className="px-4 py-4">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium"
                onClick={() => {
                  setShowCookingSteps(true)
                  setCurrentStep(0)
                }}
              >
                Start Cooking
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
