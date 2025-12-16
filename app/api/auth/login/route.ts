import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ADMIN_CREDENTIALS } from "@/types/user"
import type { User } from "@/types/user"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Check if admin
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      const adminUser: User = {
        id: 0,
        name: "Admin",
        email: ADMIN_CREDENTIALS.email,
        password: ADMIN_CREDENTIALS.password,
        createdAt: new Date().toISOString(),
        isActive: true,
        isAdmin: true,
        habits: [],
        stats: { totalHabits: 0, completedDays: 0, currentStreak: 0, longestStreak: 0 },
        pomodoroData: { sessions: [], totalPomodoros: 0 },
        xpData: {
          totalXP: 0,
          level: 1,
          rank: null,
          weeklyXP: 0,
          monthlyXP: 0,
          xpHistory: [],
          currentXP: 0,
          lastUpdated: Date.now(),
        },
        publicProfile: false,
      }
      return NextResponse.json(adminUser)
    }

    // Check regular users
    const db = await getDb()
    const user = await db.collection("users").findOne({ email, password })

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("[MongoDB] Error during login:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
