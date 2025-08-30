"use client"

import { useState } from "react"
import OnboardingFlow from "@/components/onboarding-flow"
import MainApp from "@/components/main-app"
import { PWAStatus } from "@/components/pwa-status"

export default function Home() {
  const [isOnboarded, setIsOnboarded] = useState(false)

  if (!isOnboarded) {
    return (
      <div>
        <PWAStatus />
        <OnboardingFlow onComplete={() => setIsOnboarded(true)} />
      </div>
    )
  }

  return (
    <div>
      <PWAStatus />
      <MainApp />
    </div>
  )
}
