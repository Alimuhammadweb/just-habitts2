import type { User, Habit } from "@/types/user"

export async function saveUserToMongoDB(user: User): Promise<void> {
  try {
    const response = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[MongoDB] Error saving user:", error)
      return
    }

    console.log("[MongoDB] User saved successfully:", user.id)
  } catch (error) {
    console.error("[MongoDB] Network error saving user:", error)
  }
}

export async function addHabitToMongoDB(userId: number, habit: Habit): Promise<void> {
  try {
    const response = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, habit }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[MongoDB] Error adding habit:", error)
      return
    }

    console.log("[MongoDB] Habit added successfully")
  } catch (error) {
    console.error("[MongoDB] Network error adding habit:", error)
  }
}

export async function updateHabitInMongoDB(userId: number, habitId: number, updates: Partial<Habit>): Promise<void> {
  try {
    console.log("[MongoDB] Updating habit:", habitId, "fields:", Object.keys(updates))

    const response = await fetch("/api/habits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, habitId, updates }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[MongoDB] Error updating habit:", error)
      return
    }

    console.log("[MongoDB] Habit updated successfully")
  } catch (error) {
    console.error("[MongoDB] Network error updating habit:", error)
  }
}

export async function deleteHabitFromMongoDB(userId: number, habitId: number): Promise<void> {
  try {
    const response = await fetch("/api/habits", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, habitId }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[MongoDB] Error deleting habit:", error)
      return
    }

    console.log("[MongoDB] Habit deleted successfully")
  } catch (error) {
    console.error("[MongoDB] Network error deleting habit:", error)
  }
}

export async function savePomodoroToMongoDB(userId: number, session: any): Promise<void> {
  try {
    const response = await fetch("/api/pomodoro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, session }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[MongoDB] Error saving pomodoro:", error)
      return
    }

    console.log("[MongoDB] Pomodoro session saved successfully")
  } catch (error) {
    console.error("[MongoDB] Network error saving pomodoro:", error)
  }
}

let cachedUsers: User[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 5000 // 5 seconds

export async function fetchAllUsersFromMongoDB(): Promise<User[]> {
  const now = Date.now()

  if (cachedUsers && now - lastFetchTime < CACHE_DURATION) {
    console.log("[MongoDB] Returning cached users")
    return cachedUsers
  }

  try {
    const response = await fetch("/api/users", {
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("[MongoDB] Failed to fetch users, status:", response.status)
      return []
    }

    const users = await response.json()

    cachedUsers = users
    lastFetchTime = now

    console.log("[MongoDB] Users fetched successfully:", users.length)
    return users
  } catch (error) {
    console.error("[MongoDB] Network error fetching users:", error)
    return []
  }
}

export function clearUsersCache() {
  cachedUsers = null
  lastFetchTime = 0
}
