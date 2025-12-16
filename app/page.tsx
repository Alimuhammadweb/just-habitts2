"use client"

import { useState, useEffect } from "react"
import { AuthPage } from "@/components/auth-page"
import { MainApp } from "@/components/main-app"
import { AdminPanel } from "@/components/admin-panel"
import type { User } from "@/types/user"

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const loggedInUser = localStorage.getItem("currentUser")
    if (loggedInUser) {
      const user = JSON.parse(loggedInUser)
      const migratedUser = migrateUserData(user)
      // Sync with MongoDB
      syncUserToMongoDB(migratedUser)
      setCurrentUser(migratedUser)
    }
    setIsLoading(false)
  }, [])

  const syncUserToMongoDB = async (user: User) => {
    try {
      console.log("[v0] Syncing user to MongoDB:", user.email)
      await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      })
      console.log("[v0] User synced successfully")
    } catch (error) {
      console.error("[v0] Error syncing user to MongoDB:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    )
  }

  if (isAdmin && currentUser) {
    return (
      <AdminPanel
        currentUser={currentUser}
        onBack={() => setIsAdmin(false)}
        onLogout={() => {
          setCurrentUser(null)
          setIsAdmin(false)
          localStorage.removeItem("currentUser")
        }}
      />
    )
  }

  if (currentUser) {
    return (
      <MainApp
        currentUser={currentUser}
        setCurrentUser={(user) => {
          console.log("[v0] Updating current user:", user.email, "XP:", user.xpData.totalXP)
          setCurrentUser(user)
          localStorage.setItem("currentUser", JSON.stringify(user))
          syncUserToMongoDB(user)
        }}
        onAdminClick={() => setIsAdmin(true)}
        onLogout={() => {
          setCurrentUser(null)
          localStorage.removeItem("currentUser")
        }}
      />
    )
  }

  return (
    <AuthPage
      onLogin={(user) => {
        console.log("[v0] User logged in:", user.email)
        setCurrentUser(user)
        localStorage.setItem("currentUser", JSON.stringify(user))
        syncUserToMongoDB(user)
      }}
    />
  )
}

function migrateUserData(user: User): User {
  const migratedUser = { ...user }

  // Add xpData if missing
  if (!migratedUser.xpData) {
    migratedUser.xpData = {
      totalXP: 0,
      level: 1,
      rank: null,
      weeklyXP: 0,
      monthlyXP: 0,
      xpHistory: [],
      currentXP: 0,
      lastUpdated: Date.now(),
    }
  }

  // Add pomodoroData if missing
  if (!migratedUser.pomodoroData) {
    migratedUser.pomodoroData = { sessions: [], totalPomodoros: 0 }
  }

  // Add publicProfile if missing
  if (migratedUser.publicProfile === undefined) {
    migratedUser.publicProfile = false
  }

  // Ensure habits have dayLocks and missReasons
  if (migratedUser.habits) {
    migratedUser.habits = migratedUser.habits.map((habit) => ({
      ...habit,
      dayLocks: habit.dayLocks || {},
      missReasons: habit.missReasons || {},
    }))
  }

  // Save migrated user back to localStorage
  localStorage.setItem("currentUser", JSON.stringify(migratedUser))

  return migratedUser
}
