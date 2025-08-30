"use client"

import { useState } from "react"
import { Home, ShoppingCart, Settings, Plus } from "lucide-react"
import WeeklyMealPlanner from "@/components/daily-tracker"
import ShoppingListPage from "@/components/shopping-list-page"
import SettingsPage from "@/components/settings-page"
import CravingsPage from "@/components/cravings-page"
import MealPlanCreation from "@/components/meal-plan-creation"

export default function MainApp() {
  const [activeTab, setActiveTab] = useState("home")
  const [showCravingsPage, setShowCravingsPage] = useState(false)
  const [showMealPlanCreation, setShowMealPlanCreation] = useState(false)
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [showRecipeDetails, setShowRecipeDetails] = useState(false)

  if (showMealPlanCreation) {
    return (
      <MealPlanCreation
        selectedIngredients={selectedIngredients}
        onComplete={() => {
          setShowMealPlanCreation(false)
          setSelectedIngredients([])
        }}
        onBack={() => {
          setShowMealPlanCreation(false)
          setShowCravingsPage(true)
        }}
      />
    )
  }

  if (showCravingsPage) {
    return (
      <CravingsPage
        onComplete={(ingredients) => {
          setSelectedIngredients(ingredients)
          setShowCravingsPage(false)
          setShowMealPlanCreation(true)
        }}
        onBack={() => {
          setShowCravingsPage(false)
        }}
      />
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="relative">
            <WeeklyMealPlanner onRecipeDetailsChange={setShowRecipeDetails} />
            {/* Floating New Plan Button - Only on Home tab and when recipe details are not shown */}
            {!showRecipeDetails && (
              <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50">
                <button
                  onClick={() => {
                    console.log("Creating new meal plan...")
                    setShowCravingsPage(true)
                  }}
                  className="px-6 py-3 bg-white/20 backdrop-blur-md border rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 hover:bg-white/30 hover:scale-105 border-[rgba(185,185,185,0.9)]"
                >
                  <Plus className="w-5 h-5 text-slate-700" />
                  <span className="font-medium text-slate-700">New Plan</span>
                </button>
              </div>
            )}
          </div>
        )
      case "shopping":
        return <ShoppingListPage />
      case "settings":
        return <SettingsPage />
      default:
        return <WeeklyMealPlanner />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="pb-16">{renderContent()}</div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
              activeTab === "home" ? "text-emerald-600 bg-emerald-50" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => setActiveTab("shopping")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
              activeTab === "shopping" ? "text-emerald-600 bg-emerald-50" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs font-medium">Shopping</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
              activeTab === "settings" ? "text-emerald-600 bg-emerald-50" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}
