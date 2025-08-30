"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "antd"
import { Package, Shuffle } from "lucide-react"

const PlannerPage: React.FC = () => {
  const [showInventory, setShowInventory] = useState(false)
  const [showRearrange, setShowRearrange] = useState(false)

  return (
    <div>
      <div className="flex space-x-3">
        <Button
          onClick={() => setShowInventory(!showInventory)}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium flex items-center justify-center space-x-2"
        >
          <Package className="w-5 h-5" />
          <span>Inventory</span>
        </Button>
        <Button
          onClick={() => setShowRearrange(!showRearrange)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium flex items-center justify-center space-x-2"
        >
          <Shuffle className="w-5 h-5" />
          <span>Rearrange</span>
        </Button>
      </div>
      {showInventory && <div>{/* Inventory view code here */}</div>}
      {showRearrange && <div>{/* Rearrange view code here */}</div>}
    </div>
  )
}

export default PlannerPage
