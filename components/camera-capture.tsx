"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Utensils, Sunrise, Sun, Apple, Moon, Salad, Fish, Cookie, Heart, Clock, Users } from "lucide-react"

export default function MealInspiration() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = [
    { id: "all", name: "All", icon: <Utensils className="w-5 h-5" /> },
    { id: "breakfast", name: "Breakfast", icon: <Sunrise className="w-5 h-5" /> },
    { id: "lunch", name: "Lunch", icon: <Sun className="w-5 h-5" /> },
    { id: "dinner", name: "Dinner", icon: <Moon className="w-5 h-5" /> },
    { id: "snack", name: "Snacks", icon: <Apple className="w-5 h-5" /> },
  ]

  const mealSuggestions = [
    {
      id: 1,
      name: "Mediterranean Quinoa Bowl",
      category: "lunch",
      time: "25 min",
      servings: 2,
      image: <Salad className="w-8 h-8 text-green-600" />,
      tags: ["Healthy", "Vegetarian", "High Protein"],
      description: "Fresh quinoa bowl with chickpeas, cucumber, tomatoes, and tahini dressing",
    },
    {
      id: 2,
      name: "Overnight Oats with Berries",
      category: "breakfast",
      time: "5 min prep",
      servings: 1,
      image: <Utensils className="w-8 h-8 text-orange-600" />,
      tags: ["Quick", "Make-ahead", "Fiber-rich"],
      description: "Creamy oats soaked overnight with fresh berries and honey",
    },
    {
      id: 3,
      name: "Grilled Salmon with Vegetables",
      category: "dinner",
      time: "30 min",
      servings: 4,
      image: <Fish className="w-8 h-8 text-blue-600" />,
      tags: ["High Protein", "Omega-3", "Low Carb"],
      description: "Perfectly grilled salmon with seasonal roasted vegetables",
    },
    {
      id: 4,
      name: "Energy Balls",
      category: "snack",
      time: "15 min",
      servings: 12,
      image: <Cookie className="w-8 h-8 text-amber-600" />,
      tags: ["No-bake", "Energy boost", "Nuts"],
      description: "Date and nut energy balls perfect for afternoon snacking",
    },
    {
      id: 5,
      name: "Chicken Stir Fry",
      category: "dinner",
      time: "20 min",
      servings: 3,
      image: <Utensils className="w-8 h-8 text-red-600" />,
      tags: ["Quick", "One-pan", "Vegetables"],
      description: "Colorful vegetable and chicken stir fry with ginger soy sauce",
    },
    {
      id: 6,
      name: "Avocado Toast",
      category: "breakfast",
      time: "10 min",
      servings: 1,
      image: <Apple className="w-8 h-8 text-green-600" />,
      tags: ["Quick", "Healthy fats", "Simple"],
      description: "Creamy avocado on whole grain toast with everything seasoning",
    },
  ]

  const filteredMeals = mealSuggestions.filter((meal) => {
    const matchesCategory = selectedCategory === "all" || meal.category === selectedCategory
    const matchesSearch =
      meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const addToMealPlan = (meal: (typeof mealSuggestions)[0]) => {
    console.log("Adding to meal plan:", meal.name)
  }

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Discover Meals</h1>
        <p className="text-gray-600">Find inspiration for your next meal</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search meals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg bg-white"
        />
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
            }`}
          >
            {category.icon}
            <span className="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Meal Cards */}
      <div className="space-y-4">
        {filteredMeals.map((meal) => (
          <Card key={meal.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  {meal.image}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{meal.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{meal.description}</p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{meal.time}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{meal.servings} servings</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {meal.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Heart className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => addToMealPlan(meal)}
                    >
                      Add to Plan
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
