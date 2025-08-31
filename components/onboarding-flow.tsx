"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NumberPicker } from "@/components/ui/number-picker"
import {
  ArrowLeft,
  User,
  Calendar,
  Salad,
  Zap,
  TrendingDown,
  Dumbbell,
  CheckCircle,
  XCircle,
  Leaf,
  Sprout,
  Wheat,
  Milk,
  AlertTriangle,
  Fish,
} from "lucide-react"
import CravingsPage from "@/components/cravings-page"
import MealPlanCreation from "@/components/meal-plan-creation"

interface OnboardingFlowProps {
  onComplete: () => void
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    gender: "",
    age: "",
    height: "",
    weight: "",
    heightMetric: "metric", // "metric" for cm, "imperial" for inches
    weightMetric: "metric", // "metric" for kg, "imperial" for lb
    hasDietaryRestrictions: "",
    dietaryRestrictions: [] as string[],
  })

  // Helper function to convert between metric and imperial
  const convertHeight = (value: number, fromMetric: string, toMetric: string) => {
    if (fromMetric === toMetric) return value
    if (fromMetric === "metric" && toMetric === "imperial") {
      return Math.round(value / 2.54) // cm to inches
    } else {
      return Math.round(value * 2.54) // inches to cm
    }
  }

  const convertWeight = (value: number, fromMetric: string, toMetric: string) => {
    if (fromMetric === toMetric) return value
    if (fromMetric === "metric" && toMetric === "imperial") {
      return Math.round(value * 2.20462) // kg to lb
    } else {
      return Math.round(value / 2.20462) // lb to kg
    }
  }

  const handleHeightMetricChange = (metric: string) => {
    const currentHeight = Number.parseInt(formData.height || "170")
    const convertedHeight = convertHeight(currentHeight, formData.heightMetric, metric)
    
    // Ensure the converted value is within the new metric's range
    let finalHeight = convertedHeight
    if (metric === "imperial") {
      finalHeight = Math.max(55, Math.min(87, convertedHeight))
    } else {
      finalHeight = Math.max(140, Math.min(220, convertedHeight))
    }
    
    setFormData({ 
      ...formData, 
      heightMetric: metric,
      height: finalHeight.toString()
    })
  }

  const handleWeightMetricChange = (metric: string) => {
    const currentWeight = Number.parseInt(formData.weight || "70")
    const convertedWeight = convertWeight(currentWeight, formData.weightMetric, metric)
    
    // Ensure the converted value is within the new metric's range
    let finalWeight = convertedWeight
    if (metric === "imperial") {
      finalWeight = Math.max(88, Math.min(330, convertedWeight))
    } else {
      finalWeight = Math.max(40, Math.min(150, convertedWeight))
    }
    
    setFormData({ 
      ...formData, 
      weightMetric: metric,
      weight: finalWeight.toString()
    })
  }

  const [showCravingsPage, setShowCravingsPage] = useState(false)
  const [showMealPlanCreation, setShowMealPlanCreation] = useState(false)
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])

  const steps = [
    {
      title: "What's your name?",
      subtitle: "Let's get to know you better",
      content: (
        <div className="space-y-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-2xl mx-auto flex items-center justify-center">
            <User className="w-10 h-10 text-emerald-600" />
          </div>
          <Input
            placeholder="Enter your first name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="text-center text-lg p-4 border-2 border-gray-300 focus:border-emerald-500 rounded-2xl bg-white"
          />
        </div>
      ),
    },
    {
      title: `Nice to meet you, ${formData.name}!`,
      subtitle: "What are your goals here?",
      content: (
        <div className="space-y-4">
          {[
            { label: "Gain muscle, lose fat", icon: <Zap className="w-6 h-6" />, color: "bg-orange-500" },
            { label: "Lose weight", icon: <TrendingDown className="w-6 h-6" />, color: "bg-blue-500" },
            { label: "Gain muscle", icon: <Dumbbell className="w-6 h-6" />, color: "bg-green-500" },
            {
              label: "Eat healthier without losing weight",
              icon: <Salad className="w-6 h-6" />,
              color: "bg-emerald-500",
            },
          ].map((goal) => (
            <button
              key={goal.label}
              onClick={() => setFormData({ ...formData, goal: goal.label })}
              className={`w-full p-4 rounded-2xl text-left transition-colors border-2 ${
                formData.goal === goal.label
                  ? `${goal.color} text-white border-transparent`
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={formData.goal === goal.label ? "text-white" : "text-gray-600"}>{goal.icon}</div>
                <span className="font-medium">{goal.label}</span>
              </div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "What is your gender?",
      subtitle: "Help us personalize your experience",
      content: (
        <div className="w-full space-y-4">
          {[
            { value: "male", emoji: "👨", label: "Male" },
            { value: "female", emoji: "👩", label: "Female" },
            { value: "non-binary", emoji: "🧑", label: "Non-Binary" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFormData({ ...formData, gender: option.value })}
              className={`w-full p-6 rounded-2xl transition-colors border-2 flex items-center space-x-4 ${
                formData.gender === option.value
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-300"
              }`}
            >
              <div className="text-4xl">{option.emoji}</div>
              <span className="text-xl font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "How old are you?",
      subtitle: "This helps us calculate your nutritional needs",
      content: (
        <div className="w-full">
          <div className="relative flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-8">years old</div>
              <NumberPicker
                value={Number.parseInt(formData.age || "25")}
                onChange={(value) => setFormData({ ...formData, age: value.toString() })}
                min={16}
                max={80}
                step={1}
                className="mx-auto"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "How tall are you?",
      subtitle: "We'll use this to calculate your BMR",
      content: (
        <div className="w-full">
          <div className="relative flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-8">Height</div>
              <NumberPicker
                value={Number.parseInt(formData.height || "170")}
                onChange={(value) => setFormData({ ...formData, height: value.toString() })}
                min={formData.heightMetric === "metric" ? 140 : 55}
                max={formData.heightMetric === "metric" ? 220 : 87}
                step={1}
                unit="cm"
                showMetricSelector={true}
                onMetricChange={handleHeightMetricChange}
                currentMetric={formData.heightMetric}
                className="mx-auto"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "How much do you weigh?",
      subtitle: "This helps us determine your caloric needs",
      content: (
        <div className="w-full">
          <div className="relative flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-8">Weight</div>
              <NumberPicker
                value={Number.parseInt(formData.weight || "70")}
                onChange={(value) => setFormData({ ...formData, weight: value.toString() })}
                min={formData.weightMetric === "metric" ? 40 : 88}
                max={formData.weightMetric === "metric" ? 150 : 330}
                step={1}
                unit="kg"
                showMetricSelector={true}
                onMetricChange={handleWeightMetricChange}
                currentMetric={formData.weightMetric}
                className="mx-auto"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Do you have any dietary restrictions or food allergies?",
      subtitle: "This helps us suggest better meals for you",
      content: (
        <div className="space-y-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-2xl mx-auto flex items-center justify-center">
            <Salad className="w-10 h-10 text-emerald-600" />
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setFormData({ ...formData, hasDietaryRestrictions: "yes" })}
              className={`px-8 py-4 rounded-2xl transition-colors border-2 ${
                formData.hasDietaryRestrictions === "yes"
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-300"
              }`}
            >
              <div className="text-center">
                <CheckCircle
                  className={`w-8 h-8 mb-2 mx-auto ${
                    formData.hasDietaryRestrictions === "yes" ? "text-white" : "text-gray-600"
                  }`}
                />
                <div className="font-medium">Yes</div>
              </div>
            </button>
            <button
              onClick={() => setFormData({ ...formData, hasDietaryRestrictions: "no" })}
              className={`px-8 py-4 rounded-2xl transition-colors border-2 ${
                formData.hasDietaryRestrictions === "no"
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-300"
              }`}
            >
              <div className="text-center">
                <XCircle
                  className={`w-8 h-8 mb-2 mx-auto ${
                    formData.hasDietaryRestrictions === "no" ? "text-white" : "text-gray-600"
                  }`}
                />
                <div className="font-medium">No</div>
              </div>
            </button>
          </div>
        </div>
      ),
    },
    {
      title: "Which restrictions/allergies do you have?",
      subtitle: "Select all that apply to you",
      content: (
        <div className="space-y-4">
          {[
            { label: "Vegetarian", icon: <Leaf className="w-6 h-6" />, color: "bg-green-500" },
            { label: "Vegan", icon: <Sprout className="w-6 h-6" />, color: "bg-emerald-500" },
            { label: "Gluten-free", icon: <Wheat className="w-6 h-6" />, color: "bg-yellow-500" },
            { label: "Dairy-free", icon: <Milk className="w-6 h-6" />, color: "bg-blue-500" },
            { label: "Nut allergies", icon: <AlertTriangle className="w-6 h-6" />, color: "bg-orange-500" },
            { label: "Shellfish allergies", icon: <Fish className="w-6 h-6" />, color: "bg-red-500" },
          ].map((restriction) => (
            <button
              key={restriction.label}
              onClick={() => {
                const isSelected = formData.dietaryRestrictions.includes(restriction.label)
                if (isSelected) {
                  setFormData({
                    ...formData,
                    dietaryRestrictions: formData.dietaryRestrictions.filter((r) => r !== restriction.label),
                  })
                } else {
                  setFormData({
                    ...formData,
                    dietaryRestrictions: [...formData.dietaryRestrictions, restriction.label],
                  })
                }
              }}
              className={`w-full p-4 rounded-2xl text-left transition-colors border-2 ${
                formData.dietaryRestrictions.includes(restriction.label)
                  ? `${restriction.color} text-white border-transparent`
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={formData.dietaryRestrictions.includes(restriction.label) ? "text-white" : "text-gray-600"}
                >
                  {restriction.icon}
                </div>
                <span className="font-medium">{restriction.label}</span>
                {formData.dietaryRestrictions.includes(restriction.label) && <span className="ml-auto text-xl">✓</span>}
              </div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Okay great! Now it's time to create your meal plan for this week",
      subtitle: "Let's build a personalized meal plan based on your preferences",
      content: (
        <div className="space-y-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-2xl mx-auto flex items-center justify-center">
            <Calendar className="w-10 h-10 text-emerald-600" />
          </div>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              We'll create a customized meal plan that fits your goals and dietary preferences.
            </p>
          </div>
        </div>
      ),
    },
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setShowCravingsPage(true)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() !== ""
      case 1:
        return formData.goal !== ""
      case 2:
        return formData.gender !== ""
      case 3:
        return formData.age !== ""
      case 4:
        return formData.height !== ""
      case 5:
        return formData.weight !== ""
      case 6:
        return formData.hasDietaryRestrictions !== ""
      case 7:
        return formData.hasDietaryRestrictions === "no" || formData.dietaryRestrictions.length > 0
      case 8:
        return true // Always allow proceeding from the meal plan intro step
      default:
        return false
    }
  }

  if (showMealPlanCreation) {
    return (
      <MealPlanCreation
        selectedIngredients={selectedIngredients}
        onComplete={() => {
          setShowMealPlanCreation(false)
          setSelectedIngredients([])
          onComplete()
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        {/* Progress indicator */}
        <div className="flex justify-center pt-8 pb-4">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index <= currentStep ? "bg-emerald-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col px-6 py-8">
          {/* Question at top */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{steps[currentStep].title}</h1>
            {steps[currentStep].subtitle && <p className="text-gray-600 text-base">{steps[currentStep].subtitle}</p>}
          </div>

          {/* Content area */}
          <div className="flex-1 flex items-center justify-center">{steps[currentStep].content}</div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          {currentStep > 0 ? (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex items-center space-x-2 border-gray-300 hover:bg-gray-50 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          ) : (
            <div></div>
          )}

          <div className="flex space-x-3">
            <Button
              variant="ghost"
              onClick={onComplete}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              Skip
            </Button>
            <Button
              onClick={() => {
                if (currentStep === 6 && formData.hasDietaryRestrictions === "no") {
                  // Skip dietary restrictions selection and go to meal plan intro
                  setCurrentStep(8)
                } else if (currentStep === 8) {
                  // Show cravings page instead of completing
                  setShowCravingsPage(true)
                } else if (currentStep === steps.length - 1) {
                  onComplete()
                } else {
                  nextStep()
                }
              }}
              disabled={!canProceed()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed px-8"
            >
              {currentStep === steps.length - 1
                ? "Create Plan"
                : currentStep === 8
                  ? "Start Planning"
                  : currentStep === 6 && formData.hasDietaryRestrictions === "no"
                    ? "Continue"
                    : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
