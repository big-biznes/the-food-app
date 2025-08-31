"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface NumberPickerProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  unit?: string
  className?: string
  showMetricSelector?: boolean
  onMetricChange?: (metric: string) => void
  currentMetric?: string
}

export function NumberPicker({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  className,
  showMetricSelector = false,
  onMetricChange,
  currentMetric = "metric"
}: NumberPickerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [startValue, setStartValue] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [touchStartY, setTouchStartY] = useState(0)
  const [touchStartValue, setTouchStartValue] = useState(0)

  // Metric selector state - now using same logic as main picker
  const [isMetricDragging, setIsMetricDragging] = useState(false)
  const [metricStartY, setMetricStartY] = useState(0)
  const [metricStartIndex, setMetricStartIndex] = useState(0)
  const metricContainerRef = useRef<HTMLDivElement>(null)
  const [metricTouchStartY, setMetricTouchStartY] = useState(0)
  const [metricTouchStartIndex, setMetricTouchStartIndex] = useState(0)

  const itemHeight = 80 // Increased from 60
  const visibleItems = 5
  const centerIndex = Math.floor(visibleItems / 2)

  // Metric selector constants
  const metricItemHeight = 40
  const metricVisibleItems = 3

  const generateNumbers = () => {
    const numbers = []
    for (let i = min; i <= max; i += step) {
      numbers.push(i)
    }
    return numbers
  }

  const numbers = generateNumbers()
  const currentIndex = numbers.indexOf(value)

  // Metric options
  const metrics = ["metric", "imperial"]
  const currentMetricIndex = metrics.indexOf(currentMetric)

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 1 : -1
    const newIndex = Math.max(0, Math.min(numbers.length - 1, currentIndex + delta))
    onChange(numbers[newIndex])
  }, [currentIndex, numbers, onChange])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartY(e.clientY)
    setStartValue(value)
    e.preventDefault()
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    const deltaY = e.clientY - startY
    const deltaValue = Math.round(deltaY / (itemHeight / 2)) * step
    const newValue = Math.max(min, Math.min(max, startValue - deltaValue))
    onChange(newValue)
  }, [isDragging, startY, startValue, step, min, max, onChange])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY)
    setTouchStartValue(value)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    const deltaY = e.touches[0].clientY - touchStartY
    const deltaValue = Math.round(deltaY / (itemHeight / 2)) * step
    const newValue = Math.max(min, Math.min(max, touchStartValue - deltaValue))
    onChange(newValue)
  }

  const handleTouchEnd = () => {
    // Snap to nearest value
    const nearestIndex = Math.round((value - min) / step)
    const snappedValue = min + (nearestIndex * step)
    onChange(snappedValue)
  }

  // Metric selector handlers - now using same logic as main picker
  const handleMetricMouseDown = (e: React.MouseEvent) => {
    setIsMetricDragging(true)
    setMetricStartY(e.clientY)
    setMetricStartIndex(currentMetricIndex)
    e.preventDefault()
  }

  const handleMetricMouseMove = useCallback((e: MouseEvent) => {
    if (!isMetricDragging || !onMetricChange) return
    
    const deltaY = e.clientY - metricStartY
    const deltaIndex = Math.round(deltaY / (metricItemHeight / 2))
    const newIndex = Math.max(0, Math.min(metrics.length - 1, metricStartIndex - deltaIndex))
    
    if (newIndex !== currentMetricIndex) {
      onMetricChange(metrics[newIndex])
    }
  }, [isMetricDragging, metricStartY, metricStartIndex, onMetricChange, currentMetricIndex, metrics])

  const handleMetricMouseUp = useCallback(() => {
    setIsMetricDragging(false)
  }, [])

  const handleMetricTouchStart = (e: React.TouchEvent) => {
    setMetricTouchStartY(e.touches[0].clientY)
    setMetricTouchStartIndex(currentMetricIndex)
  }

  const handleMetricTouchMove = (e: React.TouchEvent) => {
    if (!onMetricChange) return
    e.preventDefault()
    
    const deltaY = e.touches[0].clientY - metricTouchStartY
    const deltaIndex = Math.round(deltaY / (metricItemHeight / 2))
    const newIndex = Math.max(0, Math.min(metrics.length - 1, metricTouchStartIndex - deltaIndex))
    
    if (newIndex !== currentMetricIndex) {
      onMetricChange(metrics[newIndex])
    }
  }

  const handleMetricTouchEnd = () => {
    // Snap to nearest metric
    const nearestIndex = Math.round((currentMetricIndex))
    const snappedMetric = metrics[nearestIndex]
    if (snappedMetric !== currentMetric && onMetricChange) {
      onMetricChange(snappedMetric)
    }
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  useEffect(() => {
    if (isMetricDragging) {
      document.addEventListener('mousemove', handleMetricMouseMove)
      document.addEventListener('mouseup', handleMetricMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMetricMouseMove)
        document.removeEventListener('mouseup', handleMetricMouseUp)
      }
    }
  }, [isMetricDragging, handleMetricMouseMove, handleMetricMouseUp])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  return (
    <div className={cn("relative select-none", className)}>
      <div className="flex items-center space-x-6">
        {/* Number Picker Container */}
        <div
          ref={containerRef}
          className="relative h-[400px] overflow-hidden bg-gradient-to-b from-transparent via-gray-50/50 to-transparent rounded-2xl"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Selection Indicator - Made bigger */}
          <div className="absolute top-1/2 left-0 right-0 h-[80px] transform -translate-y-1/2 bg-emerald-100/50 border-2 border-emerald-200 rounded-xl z-10" />
          
          {/* Numbers */}
          <div 
            className="relative transition-transform duration-200 ease-out"
            style={{
              transform: `translateY(${(containerRef.current?.clientHeight || 400) / 2 - (currentIndex * itemHeight) - (itemHeight / 2)}px)`
            }}
          >
            {numbers.map((number, index) => (
              <div
                key={number}
                className={cn(
                  "h-[80px] flex items-center justify-center text-3xl font-medium transition-all duration-200",
                  index === currentIndex
                    ? "text-emerald-600 font-bold text-4xl"
                    : index === currentIndex - 1 || index === currentIndex + 1
                    ? "text-gray-600 text-2xl opacity-70"
                    : "text-gray-400 text-xl opacity-40"
                )}
              >
                {number}
              </div>
            ))}
          </div>
        </div>

        {/* Metric Selector - Now works exactly like main picker */}
        {showMetricSelector && onMetricChange && (
          <div 
            ref={metricContainerRef}
            className="relative h-[120px] overflow-hidden bg-gradient-to-b from-transparent via-gray-50/50 to-transparent rounded-xl w-20"
            onMouseDown={handleMetricMouseDown}
            onTouchStart={handleMetricTouchStart}
            onTouchMove={handleMetricTouchMove}
            onTouchEnd={handleMetricTouchEnd}
          >
            <div className="absolute top-1/2 left-0 right-0 h-[40px] transform -translate-y-1/2 bg-emerald-100/50 border border-emerald-200 rounded-lg z-10" />
            <div 
              className="relative transition-transform duration-200 ease-out"
              style={{
                transform: `translateY(${(metricContainerRef.current?.clientHeight || 120) / 2 - (currentMetricIndex * metricItemHeight) - (metricItemHeight / 2)}px)`
              }}
            >
              {metrics.map((metric, index) => (
                <div
                  key={metric}
                  className={cn(
                    "h-[40px] flex items-center justify-center text-sm font-medium transition-all duration-200",
                    index === currentMetricIndex
                      ? "text-emerald-600 font-bold"
                      : index === currentMetricIndex - 1 || index === currentMetricIndex + 1
                      ? "text-gray-600 opacity-70"
                      : "text-gray-400 opacity-40"
                  )}
                >
                  {metric === "metric" ? unit : (unit === "cm" ? "in" : "lb")}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 