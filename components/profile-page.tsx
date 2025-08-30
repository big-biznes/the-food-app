"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Star, Settings, Award, Target, TrendingUp } from "lucide-react"

export default function ProfilePage() {
  const [selectedRating, setSelectedRating] = useState(0)

  const userStats = {
    name: "Alex Johnson",
    goal: "Lose Weight",
    streak: 12,
    totalMeals: 156,
    avgRating: 4.2,
  }

  const recentMeals = [
    { name: "Grilled Salmon Bowl", rating: 5, date: "Today" },
    { name: "Quinoa Salad", rating: 4, date: "Yesterday" },
    { name: "Chicken Stir Fry", rating: 5, date: "2 days ago" },
    { name: "Veggie Wrap", rating: 3, date: "3 days ago" },
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Profile header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="/placeholder.svg?height=80&width=80" />
              <AvatarFallback className="text-xl bg-emerald-100 text-emerald-700">AJ</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{userStats.name}</h2>
              <p className="text-gray-600">{userStats.goal}</p>
            </div>
            <Button size="sm" variant="outline">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-1 bg-transparent">
          <Target className="w-5 h-5" />
          <span className="text-sm">Update Goals</span>
        </Button>
        <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-1 bg-transparent">
          <TrendingUp className="w-5 h-5" />
          <span className="text-sm">View Progress</span>
        </Button>
      </div>
    </div>
  )
}
