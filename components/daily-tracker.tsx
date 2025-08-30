"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ArrowLeft, ArrowRight, Sunrise, Sun, Apple, Moon, Calendar } from "lucide-react"
import CalendarView from "@/components/calendar-view"
import RecipeDetails from "@/components/recipe-details"

interface WeeklyMealPlannerProps {
  onRecipeDetailsChange?: (isShowing: boolean) => void
}

export default function WeeklyMealPlanner({ onRecipeDetailsChange }: WeeklyMealPlannerProps = {}) {
  const [selectedDay, setSelectedDay] = useState(0)
  const [currentWeek, setCurrentWeek] = useState(0)
  const [showCalendarView, setShowCalendarView] = useState(false)
  const [showRatingPopup, setShowRatingPopup] = useState(false)
  const [ratingMeal, setRatingMeal] = useState<{ type: string; name: string } | null>(null)
  const [selectedRating, setSelectedRating] = useState(0)
  const [mealRatings, setMealRatings] = useState<Record<string, number>>({})

  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<{ name: string; type: string } | null>(null)

  const [showDailySummary, setShowDailySummary] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [summaryHeight, setSummaryHeight] = useState(0)
  const [isClosingSummary, setIsClosingSummary] = useState(false)

  const mealTypes = [
    {
      name: "Breakfast",
      icon: <Sunrise className="w-8 h-8 text-orange-500" />,
      color: "bg-orange-50 border-orange-200",
    },
    { name: "Lunch", icon: <Sun className="w-8 h-8 text-yellow-500" />, color: "bg-yellow-50 border-yellow-200" },
    { name: "Snack", icon: <Apple className="w-8 h-8 text-green-500" />, color: "bg-green-50 border-green-200" },
    { name: "Dinner", icon: <Moon className="w-8 h-8 text-purple-500" />, color: "bg-purple-50 border-purple-200" },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDirection = currentScrollY > lastScrollY ? "down" : "up"
      const scrollDelta = Math.abs(currentScrollY - lastScrollY)

      // Show summary only when at very top (0-5px), scrolling up with momentum (>15px delta), and not already showing
      if (currentScrollY <= 5 && scrollDirection === "up" && scrollDelta > 15 && !showDailySummary) {
        setShowDailySummary(true)
      }

      // Hide summary when scrolling down with significant momentum or when scrolled well past threshold
      if ((scrollDirection === "down" && scrollDelta > 25 && currentScrollY > 20) || currentScrollY > 100) {
        if (showDailySummary && !isClosingSummary) {
          setIsClosingSummary(true)
          setTimeout(() => {
            setShowDailySummary(false)
            setIsClosingSummary(false)
          }, 300) // Match animation duration
        }
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY, showDailySummary, isClosingSummary])

  const weekDates = [
    { day: "Mon", date: "Jan 1" },
    { day: "Tue", date: "Jan 2" },
    { day: "Wed", date: "Jan 3" },
    { day: "Thu", date: "Jan 4" },
    { day: "Fri", date: "Jan 5" },
    { day: "Sat", date: "Jan 6" },
    { day: "Sun", date: "Jan 7" },
  ]

  // Sample meal plan data
  const mealPlan = {
    Mon: {
      breakfast: "Overnight Oats with Berries",
      lunch: "Mediterranean Quinoa Bowl",
      snack: "Greek Yogurt with Almonds",
      dinner: "Grilled Salmon with Vegetables",
    },
    Tue: {
      breakfast: "Avocado Toast with Eggs",
      lunch: "Chicken Caesar Salad",
      snack: "Apple with Peanut Butter",
      dinner: "Vegetable Stir Fry with Tofu",
    },
    Wed: {
      breakfast: "Smoothie Bowl",
      lunch: "Turkey and Hummus Wrap",
      snack: "Mixed Nuts",
      dinner: "Pasta with Marinara Sauce",
    },
    Thu: {
      breakfast: "Greek Yogurt Parfait",
      lunch: "Lentil Soup with Bread",
      snack: "Carrot Sticks with Hummus",
      dinner: "Grilled Chicken with Sweet Potato",
    },
    Fri: {
      breakfast: "Pancakes with Fresh Fruit",
      lunch: "Sushi Bowl",
      snack: "Protein Smoothie",
      dinner: "Fish Tacos with Coleslaw",
    },
    Sat: {
      breakfast: "Weekend Brunch Special",
      lunch: "Caprese Salad with Baguette",
      snack: "Dark Chocolate & Berries",
      dinner: "Homemade Pizza Night",
    },
    Sun: {
      breakfast: "French Toast",
      lunch: "Roast Chicken Salad",
      snack: "Trail Mix",
      dinner: "Sunday Roast with Vegetables",
    },
  }

  const rerollMeal = (category: string, index: number) => {
    const randomMeal = mealOptions[Math.floor(Math.random() * mealOptions.length)]

    const setGeneratedMealPlan = (prev: any) => ({
      ...prev,
      [category]: prev[category as keyof typeof prev].map((meal: any, i: number) =>
        i === index
          ? {
              ...meal,
              name: randomMeal,
              image: `/placeholder.svg?height=120&width=120&query=${randomMeal.toLowerCase()}`,
            }
          : meal,
      ),
    })

    // Assuming setGeneratedMealPlan is a function that updates the state
    // Here we just log it for demonstration purposes
    console.log(setGeneratedMealPlan(mealPlan))
  }

  const mealOptions = [
    "Healthy Power Bowl",
    "Fresh Garden Salad",
    "Protein Packed Meal",
    "Nutritious Delight",
    "Wholesome Creation",
  ]

  if (showCalendarView) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 sm:p-6 space-y-6 pb-16">
          {/* Header with back button */}
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCalendarView(false)}
              className="text-gray-600 hover:text-gray-800 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Calendar</h1>
          </div>
          <CalendarView />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Rating Popup Overlay */}
      {showRatingPopup && ratingMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Rate Your Meal</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowRatingPopup(false)
                    setRatingMeal(null)
                    setSelectedRating(0)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium text-gray-900">{ratingMeal.name}</h3>
                <p className="text-sm text-gray-600">{ratingMeal.type}</p>
              </div>

              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button key={rating} onClick={() => setSelectedRating(rating)} className="p-2">
                    <Star
                      className={`w-8 h-8 ${
                        rating <= selectedRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {selectedRating > 0 && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    // Save the rating
                    const mealKey = `${weekDates[selectedDay].day}-${ratingMeal.type}`
                    setMealRatings((prev) => ({ ...prev, [mealKey]: selectedRating }))
                    console.log(`Rated ${ratingMeal.name}: ${selectedRating} stars`)
                    setShowRatingPopup(false)
                    setRatingMeal(null)
                    setSelectedRating(0)
                  }}
                >
                  Submit Rating
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recipe Page */}
      {showRecipeModal && selectedRecipe && (
        <RecipeDetails
          recipe={selectedRecipe}
          onBack={() => {
            setShowRecipeModal(false)
            setSelectedRecipe(null)
            onRecipeDetailsChange?.(false)
          }}
        />
      )}

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-16">
        {/* Header */}
        <div className="text-left">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {selectedDay < 3 ? "Part 1" : selectedDay < 6 ? "Part 2" : "Leftover Day"}
            </h1>
            <div className="flex items-center space-x-3">
              {/* Arrow buttons group */}
              <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-200">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (selectedDay < 3) {
                      // From Part 1, go to Leftover Day
                      setSelectedDay(6)
                    } else if (selectedDay < 6) {
                      // From Part 2, go to Part 1 (first day of Part 1)
                      setSelectedDay(0)
                    } else {
                      // From Leftover Day, go to Part 2 (first day of Part 2)
                      setSelectedDay(3)
                    }
                  }}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-l-full px-3 py-2"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (selectedDay < 3) {
                      // From Part 1, go to Part 2 (first day of Part 2)
                      setSelectedDay(3)
                    } else if (selectedDay < 6) {
                      // From Part 2, go to Leftover Day
                      setSelectedDay(6)
                    } else {
                      // From Leftover Day, go to Part 1 (first day of Part 1)
                      setSelectedDay(0)
                    }
                  }}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-r-full px-3 py-2"
                >
                  <ArrowRight className="w-5 h-5 sm:w-4 sm:h-4" />
                </Button>
              </div>

              {/* Calendar button separate */}
              <div className="bg-white rounded-full shadow-sm border border-gray-200">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCalendarView(true)}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full px-3 py-2"
                >
                  <Calendar className="w-5 h-5 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Days Navigation */}
          <div className="bg-white rounded-full shadow-sm border border-gray-200 flex items-center space-x-1 overflow-x-auto p-1 w-fit h-fit">
            {(() => {
              let daysToShow = []
              if (selectedDay < 3) {
                // Part 1: days 0, 1, 2
                daysToShow = weekDates.slice(0, 3)
              } else if (selectedDay < 6) {
                // Part 2: days 3, 4, 5
                daysToShow = weekDates.slice(3, 6)
              } else {
                // Leftover Day: day 6
                daysToShow = [weekDates[6]]
              }

              return (
                <div className="flex items-center space-x-1 overflow-x-auto p-1">
                  {daysToShow.map((dayInfo, index) => {
                    const actualIndex = selectedDay < 3 ? index : selectedDay < 6 ? index + 3 : 6
                    return (
                      <button
                        key={dayInfo.day}
                        onClick={() => setSelectedDay(actualIndex)}
                        className={`px-4 py-2 text-sm font-medium transition-colors min-w-[60px] rounded-full flex-shrink-0 ${
                          actualIndex === selectedDay
                            ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-300"
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold">{dayInfo.day}</div>
                          <div className="text-xs opacity-75">{dayInfo.date}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Today's Meals */}
        <div className="space-y-3 sm:space-y-4">
          {mealTypes.map((mealType) => {
            const mealKey = mealType.name.toLowerCase() as keyof typeof mealPlan.Mon
            const currentDayKey = Object.keys(mealPlan)[selectedDay] as keyof typeof mealPlan
            const plannedMeal = mealPlan[currentDayKey]?.[mealKey]
            const calories = Math.floor(Math.random() * 200) + 300

            return (
              <Card
                key={mealType.name}
                className="bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border-0 rounded-2xl overflow-hidden"
                onClick={(e) => {
                  // Check if the clicked element is the star rating button or its children
                  const target = e.target as HTMLElement
                  if (target.closest("button[data-rating-button]")) {
                    return // Don't navigate to recipe page if star button was clicked
                  }

                  if (plannedMeal) {
                    setSelectedRecipe({ name: plannedMeal, type: mealType.name })
                    setShowRecipeModal(true)
                    onRecipeDetailsChange?.(true)
                  }
                }}
              >
                <CardContent className="p-0">
                  <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4">
                    {/* Meal Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img
                        src={`/abstract-geometric-shapes.png?key=b624n&height=80&width=80&query=${plannedMeal?.toLowerCase().replace(/\s+/g, "-")}`}
                        alt={plannedMeal || "Meal"}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Meal Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight">
                            {mealType.name}
                          </h3>
                          <p className="text-gray-600 text-sm truncate">{plannedMeal || "Not planned yet"}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-yellow-500 p-1 flex-shrink-0"
                          data-rating-button="true"
                          onClick={(e) => {
                            e.stopPropagation()
                            setRatingMeal({ type: mealType.name, name: plannedMeal || "Not planned yet" })
                            setShowRatingPopup(true)
                            const mealKey = `${weekDates[selectedDay].day}-${mealType.name}`
                            setSelectedRating(mealRatings[mealKey] || 0)
                          }}
                          disabled={!plannedMeal}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Calorie Display */}
                      <div className="flex justify-end">
                        <div className="text-xs sm:text-sm font-semibold text-emerald-600">{calories} cal</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Static Summary Card - Always visible at bottom with extra spacing */}
        <div className="pb-12">
          <Card className="bg-white shadow-sm border-0 rounded-2xl border border-gray-100">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Today's Summary</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">1847</div>
                  <div className="text-gray-500 text-sm">calories planned</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Protein:</span>
                    <span className="font-medium text-gray-900">89g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fats:</span>
                    <span className="font-medium text-gray-900">67g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Carbs:</span>
                    <span className="font-medium text-gray-900">203g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fiber:</span>
                    <span className="font-medium text-gray-900">28g</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
