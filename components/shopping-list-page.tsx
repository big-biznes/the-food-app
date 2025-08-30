"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Package, Trash2, Plus, ArrowLeft } from "lucide-react"

interface ShoppingItem {
  name: string
  quantity: string
}

interface InventoryItem {
  name: string
  category: string
  dateAdded: string
  expiresIn: number
  status: string
}

export default function ShoppingListPage() {
  const [showInventory, setShowInventory] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})

  const shoppingList = {
    vegetables: [
      { name: "Tomatoes", quantity: "4 large" },
      { name: "Spinach", quantity: "1 bag" },
      { name: "Bell Peppers", quantity: "3 pieces" },
      { name: "Onions", quantity: "2 medium" },
      { name: "Carrots", quantity: "1 lb" },
    ],
    dairy: [
      { name: "Greek Yogurt", quantity: "2 containers" },
      { name: "Milk", quantity: "1 gallon" },
      { name: "Cheddar Cheese", quantity: "8 oz block" },
    ],
    meat: [
      { name: "Chicken Breast", quantity: "2 lbs" },
      { name: "Salmon Fillets", quantity: "4 pieces" },
      { name: "Ground Turkey", quantity: "1 lb" },
    ],
    grains: [
      { name: "Quinoa", quantity: "1 bag" },
      { name: "Brown Rice", quantity: "2 lbs" },
      { name: "Whole Wheat Bread", quantity: "1 loaf" },
    ],
  }

  const inventoryItems = [
    { name: "Olive Oil", category: "Pantry", dateAdded: "2024-01-15", expiresIn: 45, status: "fresh" },
    { name: "Garlic", category: "Vegetables", dateAdded: "2024-01-20", expiresIn: 12, status: "warning" },
    { name: "Pasta", category: "Grains", dateAdded: "2024-01-10", expiresIn: 180, status: "fresh" },
    { name: "Yogurt", category: "Dairy", dateAdded: "2024-01-22", expiresIn: 2, status: "expiring" },
    { name: "Chicken Stock", category: "Pantry", dateAdded: "2024-01-18", expiresIn: 30, status: "fresh" },
    { name: "Bananas", category: "Fruits", dateAdded: "2024-01-23", expiresIn: 1, status: "expiring" },
    { name: "Honey", category: "Pantry", dateAdded: "2024-01-05", expiresIn: 365, status: "fresh" },
    { name: "Lettuce", category: "Vegetables", dateAdded: "2024-01-21", expiresIn: 5, status: "warning" },
  ]

  const toggleItem = (category: string, itemName: string) => {
    const key = `${category}-${itemName}`
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const removeItem = (category: string, itemName: string) => {
    // Remove item logic here
    console.log(`Removing ${itemName} from ${category}`)
  }

  const getTotalItems = () => {
    return Object.values(shoppingList).reduce((total, items) => total + items.length, 0)
  }

  const getCheckedItems = () => {
    return Object.values(checkedItems).filter(Boolean).length
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "expiring":
        return "text-red-600 bg-red-50 border-red-200"
      case "warning":
        return "text-orange-600 bg-orange-50 border-orange-200"
      default:
        return "text-green-600 bg-green-50 border-green-200"
    }
  }

  const getStatusText = (expiresIn: number, status: string) => {
    if (status === "expiring") {
      return expiresIn === 1 ? "Expires tomorrow" : `Expires in ${expiresIn} days`
    }
    if (status === "warning") {
      return `${expiresIn} days left`
    }
    return "Fresh"
  }

  if (showInventory) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 sm:p-6 space-y-6 pb-16">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowInventory(false)}
              className="text-gray-600 hover:text-gray-800 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white shadow-sm border-0 rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{inventoryItems.length}</div>
                <div className="text-sm text-gray-600">Items in stock</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border-0 rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {inventoryItems.filter((item) => item.status === "expiring" || item.status === "warning").length}
                </div>
                <div className="text-sm text-gray-600">Expiring soon</div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Items */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Items</h2>
            {inventoryItems.map((item, index) => (
              <Card key={index} className="bg-white shadow-sm border-0 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.category}</p>
                      <p className="text-xs text-gray-500">Added: {new Date(item.dateAdded).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}
                      >
                        {getStatusText(item.expiresIn, item.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 space-y-6 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shopping List</h1>
          <div className="bg-white rounded-full shadow-sm border border-gray-200">
            <Button
              onClick={() => setShowInventory(true)}
              variant="ghost"
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full px-4 py-2 flex items-center space-x-2"
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">Inventory</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white shadow-sm border-0 rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{getCheckedItems()}</div>
              <div className="text-sm text-gray-600">Items bought</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-0 rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{getTotalItems() - getCheckedItems()}</div>
              <div className="text-sm text-gray-600">Items to buy</div>
            </CardContent>
          </Card>
        </div>

        {/* Shopping List */}
        <div className="space-y-6">
          {Object.entries(shoppingList).map(([category, items]) => (
            <Card key={category} className="bg-white shadow-sm border-0 rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg capitalize text-gray-900">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item, index) => {
                  const itemKey = `${category}-${item.name}`
                  const isChecked = checkedItems[itemKey] || false

                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleItem(category, item.name)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <div className={`flex-1 ${isChecked ? "line-through text-gray-500" : "text-gray-900"}`}>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-gray-600 ml-2">({item.quantity})</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(category, item.name)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Item Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => console.log("Add new item")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-full font-medium flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Item</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
