"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Calculator,
  User,
  Smartphone,
  Info,
  LogOut,
  ChevronRight,
  Target,
  Scale,
  RotateCcw,
  Mail,
  UserCircle,
  Utensils,
  Ruler,
  Bell,
  Palette,
  FileText,
  Shield,
  Trash2,
} from "lucide-react"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  const handleLogout = () => {
    console.log("Logging out...")
    // Handle logout logic here
  }

  const handleDeleteAccount = () => {
    console.log("Delete account requested...")
    // Handle account deletion logic here
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 space-y-6 pb-16">
        {/* Header */}
        <div className="text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        {/* Plan Settings */}
        <Card className="bg-white shadow-sm border-0 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <span>Plan Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Daily Calories</div>
                  <div className="text-sm text-gray-600">1,847 calories</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center space-x-3">
                <Scale className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Macro Balance</div>
                  <div className="text-sm text-gray-600">Protein 25% • Carbs 45% • Fat 30%</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center space-x-3">
                <RotateCcw className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Recalculate Plan</div>
                  <div className="text-sm text-gray-600">Update preferences and goals</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="bg-white shadow-sm border-0 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Account Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Email</div>
                  <div className="text-sm text-gray-600">alex.johnson@email.com</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center space-x-3">
                <UserCircle className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Personal Details</div>
                  <div className="text-sm text-gray-600">Name, age, height, weight</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center space-x-3">
                <Utensils className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Eating Preferences</div>
                  <div className="text-sm text-gray-600">Dietary restrictions and allergies</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </CardContent>
        </Card>

        {/* Application Settings */}
        <Card className="bg-white shadow-sm border-0 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-purple-600" />
              <span>Application Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center space-x-3">
                <Ruler className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Measurement System</div>
                  <div className="text-sm text-gray-600">Metric (kg, cm)</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <div className="flex items-center justify-between p-3">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Notifications</div>
                  <div className="text-sm text-gray-600">Meal reminders and updates</div>
                </div>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>

            <div className="flex items-center justify-between p-3">
              <div className="flex items-center space-x-3">
                <Palette className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Theme</div>
                  <div className="text-sm text-gray-600">Light mode</div>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card className="bg-white shadow-sm border-0 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Info className="w-5 h-5 text-gray-600" />
              <span>App Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">App Version</div>
                  <div className="text-sm text-gray-600">1.2.3</div>
                </div>
              </div>
            </div>

            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Terms of Service</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Privacy Policy</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-xl transition-colors"
              onClick={handleDeleteAccount}
            >
              <div className="flex items-center space-x-3">
                <Trash2 className="w-5 h-5 text-red-600" />
                <div className="text-left">
                  <div className="font-medium text-red-600">Delete Account</div>
                  <div className="text-sm text-red-500">Permanently delete your account</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400" />
            </button>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <div className="pt-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full py-3 rounded-2xl border-2 border-gray-300 hover:border-red-300 hover:bg-red-50 text-gray-700 hover:text-red-600 font-medium bg-transparent"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  )
}
