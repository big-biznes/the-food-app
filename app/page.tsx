"use client"

import { useState } from "react"
import OnboardingFlow from "@/components/onboarding-flow"
import MainApp from "@/components/main-app"

export default function Home() {
  const [isOnboarded, setIsOnboarded] = useState(false)

  if (!isOnboarded) {
    return <OnboardingFlow onComplete={() => setIsOnboarded(true)} />
  }

  return <MainApp />
}
