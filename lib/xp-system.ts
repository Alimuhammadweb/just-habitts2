import type { User, XPData, DayStatus, DayLock } from "@/types/user"
import { XP_REWARDS, LEVEL_THRESHOLDS } from "@/types/user"

/**
 * XP SYSTEM - DATE-BASED TRACKING
 *
 * NEW: Days are now tied to actual calendar dates!
 * - Day 1 marked on Dec 16 → Day 2 opens on Dec 17
 * - Each day corresponds to a real calendar date
 * - No more cheating by changing days quickly
 */

// export function getCurrentDateString(): string {
//   const now = new Date()
//   const year = now.getFullYear()
//   const month = String(now.getMonth() + 1).padStart(2, "0")
//   const day = String(now.getDate()).padStart(2, "0")
//   return `${year}-${month}-${day}`
// }


export function getCurrentDateString(): string {
  const now = new Date()
  now.setHours(now.getHours() + 5) // O‘zbekiston UTC+5
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getDateString(date: Date): string {
  date.setHours(date.getHours() + 5) // UTC+5
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}


export function isDateTodayOrFuture(dateString: string): boolean {
  const today = getCurrentDateString()
  return dateString >= today
}

// export function getExpectedDateForDay(habitStartTimestamp: number, dayIndex: number): string {
//   const startDate = new Date(habitStartTimestamp)
//   const expectedDate = new Date(startDate)
//   expectedDate.setDate(expectedDate.getDate() + dayIndex)
//   return getDateString(expectedDate)
// }


export function getExpectedDateForDay(habitStartTimestamp: number, dayIndex: number): string {
  const startDate = new Date(habitStartTimestamp)
  startDate.setHours(startDate.getHours() + 5) // UTC+5
  const expectedDate = new Date(startDate)
  expectedDate.setDate(expectedDate.getDate() + dayIndex)
  return getDateString(expectedDate)
}

export function calculateXP(status: DayStatus): number {
  return XP_REWARDS[status]
}

export function calculateLevel(totalXP: number): number {
  return Math.floor(totalXP / 100) + 1
}

export function getLevelName(level: number): string {
  if (level >= 30) return LEVEL_THRESHOLDS.ELITE.name
  if (level >= 20) return LEVEL_THRESHOLDS.IRON_MIND.name
  if (level >= 10) return LEVEL_THRESHOLDS.ATOMIC_MAN.name
  if (level >= 5) return LEVEL_THRESHOLDS.DISCIPLINE.name
  return LEVEL_THRESHOLDS.BEGINNER.name
}

export function getXPForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1
  return nextLevel * 100
}

export function calculateRanks(users: User[]): User[] {
  const sorted = [...users].sort((a, b) => {
    if (b.xpData.totalXP !== a.xpData.totalXP) {
      return b.xpData.totalXP - a.xpData.totalXP
    }
    if (b.xpData.weeklyXP !== a.xpData.weeklyXP) {
      return b.xpData.weeklyXP - a.xpData.weeklyXP
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  return sorted.map((user, index) => ({
    ...user,
    xpData: {
      ...user.xpData,
      rank: index + 1,
    },
  }))
}

export function getRankTitle(rank: number | null): string {
  if (rank === null) return "Unranked"
  if (rank === 1) return "Legend"
  if (rank <= 10) return "Elite"
  if (rank <= 50) return "Master"
  if (rank <= 200) return "Warrior"
  return "Challenger"
}

export function getRankEmoji(rank: number | null): string {
  if (rank === null) return "🎯"
  if (rank === 1) return "🥇"
  if (rank === 2) return "🥈"
  if (rank === 3) return "🥉"
  if (rank <= 10) return "🏆"
  if (rank <= 50) return "⭐"
  return "🎯"
}

export function getLevelBadge(level: number): string {
  if (level >= 30) return "👑"
  if (level >= 20) return "💎"
  if (level >= 10) return "⭐"
  if (level >= 5) return "🔥"
  return "🌱"
}

/**
 * CHECK IF STATUS CAN BE CHANGED - DATE-BASED
 * Now checks if the expected calendar date has arrived
 */
export function canChangeStatus(
  dayLock: DayLock | undefined,
  habitStartDate: number,
  dayIndex: number,
): { allowed: boolean; reason: string } {
  const currentDate = getCurrentDateString()
  const expectedDate = getExpectedDateForDay(habitStartDate, dayIndex)

  // If day is not marked yet, check if expected date has arrived
  if (!dayLock) {
    if (currentDate >= expectedDate) {
      return { allowed: true, reason: "" }
    } else {
      return {
        allowed: false,
        reason: `This day opens on ${expectedDate}. Current date: ${currentDate}`,
      }
    }
  }

  const markedDate = dayLock.dateString

  // Can only change on the same day it was marked
  if (currentDate === markedDate) {
    return {
      allowed: true,
      reason: "Status can be changed (same day)",
    }
  }

  return {
    allowed: false,
    reason: "Status locked. You can only change status on the same day it was marked.",
  }
}

/**
 * UPDATE HABIT STATUS - OPTIMIZED
 * Improved performance and clarity
 */
export function updateHabitStatus(
  user: User,
  habitId: number,
  dayIndex: number,
  newStatus: DayStatus | "none",
  missReason?: string,
): {
  success: boolean
  message: string
  updatedUser?: User
  xpChange?: number
} {
  const habitIndex = user.habits.findIndex((h) => h.id === habitId)
  if (habitIndex === -1) {
    return { success: false, message: "Habit not found" }
  }

  const habit = user.habits[habitIndex]
  const currentDayLock = habit.dayLocks?.[dayIndex]

  const validation = canChangeStatus(currentDayLock, habit.startDate.timestamp, dayIndex)

  if (!validation.allowed) {
    return { success: false, message: validation.reason }
  }

  const currentDate = getCurrentDateString()
  const now = Date.now()

  // Calculate XP delta
  const oldXP = currentDayLock?.xpAwarded || 0
  let xpChange = 0

  if (newStatus === "none") {
    xpChange = -oldXP
  } else {
    const newXP = calculateXP(newStatus)
    xpChange = newXP - oldXP
  }

  // Update habit
  const updatedHabits = [...user.habits]
  const updatedHabit = { ...habit }

  if (newStatus === "none") {
    const { [dayIndex]: removed, ...restDays } = updatedHabit.days
    updatedHabit.days = restDays

    if (updatedHabit.colors) {
      const { [dayIndex]: removedColor, ...restColors } = updatedHabit.colors
      updatedHabit.colors = restColors
    }

    if (updatedHabit.dayLocks) {
      const { [dayIndex]: removedLock, ...restLocks } = updatedHabit.dayLocks
      updatedHabit.dayLocks = restLocks
    }

    if (updatedHabit.missReasons) {
      const { [dayIndex]: removedReason, ...restReasons } = updatedHabit.missReasons
      updatedHabit.missReasons = restReasons
    }
  } else {
    updatedHabit.days = {
      ...updatedHabit.days,
      [dayIndex]: newStatus,
    }

    const colorMap = {
      completed: "green",
      partial: "yellow",
      missed: "red",
    }
    updatedHabit.colors = {
      ...updatedHabit.colors,
      [dayIndex]: colorMap[newStatus],
    }

    updatedHabit.dayLocks = {
      ...updatedHabit.dayLocks,
      [dayIndex]: {
        status: newStatus,
        markedAt: now,
        dateString: currentDate,
        xpAwarded: calculateXP(newStatus),
        locked: false,
      },
    }

    if (newStatus === "missed" && missReason) {
      updatedHabit.missReasons = {
        ...updatedHabit.missReasons,
        [dayIndex]: missReason,
      }
    }
  }

  updatedHabits[habitIndex] = updatedHabit

  // Update XP data
  const newTotalXP = Math.max(0, user.xpData.totalXP + xpChange)
  const newWeeklyXP = Math.max(0, user.xpData.weeklyXP + xpChange)
  const newMonthlyXP = Math.max(0, user.xpData.monthlyXP + xpChange)
  const newLevel = calculateLevel(newTotalXP)
  const currentXP = user.xpData.currentXP || 0
  const newCurrentXP = Math.max(0, currentXP + xpChange)

  // Update XP history (optimized)
  const updatedHistory = user.xpData.xpHistory.filter((h) => !(h.habitId === habitId && h.dayIndex === dayIndex))

  if (xpChange !== 0) {
    updatedHistory.push({
      date: currentDate,
      xpEarned: xpChange,
      habitId,
      dayIndex,
      status: newStatus === "none" ? "missed" : newStatus,
      timestamp: now,
    })
  }

  const updatedXPData: XPData = {
    ...user.xpData,
    totalXP: newTotalXP,
    currentXP: newCurrentXP,
    level: newLevel,
    weeklyXP: newWeeklyXP,
    monthlyXP: newMonthlyXP,
    xpHistory: updatedHistory,
    lastUpdated: now,
  }

  const updatedUser: User = {
    ...user,
    habits: updatedHabits,
    xpData: updatedXPData,
  }

  return {
    success: true,
    message: xpChange > 0 ? `+${xpChange} XP` : xpChange < 0 ? `${xpChange} XP` : "Status updated",
    updatedUser,
    xpChange,
  }
}

/**
 * LOCK OLD DAYS - OPTIMIZED
 * More efficient locking mechanism
 */
export function lockOldDays(user: User): User {
  const currentDate = getCurrentDateString()

  const updatedHabits = user.habits.map((habit) => {
    if (!habit.dayLocks || Object.keys(habit.dayLocks).length === 0) return habit

    const updatedLocks = { ...habit.dayLocks }
    let hasChanges = false

    for (const [dayIndexStr, lock] of Object.entries(updatedLocks)) {
      if (lock.dateString !== currentDate && !lock.locked) {
        updatedLocks[Number(dayIndexStr)] = { ...lock, locked: true }
        hasChanges = true
      }
    }

    return hasChanges ? { ...habit, dayLocks: updatedLocks } : habit
  })

  return { ...user, habits: updatedHabits }
}

export function resetWeeklyXP(user: User): User {
  return {
    ...user,
    xpData: {
      ...user.xpData,
      weeklyXP: 0,
    },
  }
}

export function resetMonthlyXP(user: User): User {
  return {
    ...user,
    xpData: {
      ...user.xpData,
      monthlyXP: 0,
    },
  }
}

export function checkRankChange(oldRank: number | null, newRank: number | null) {
  if (oldRank === null || newRank === null) {
    return { changed: false, direction: null, oldRank, newRank }
  }

  if (oldRank > newRank) {
    return { changed: true, direction: "up" as const, oldRank, newRank }
  } else if (oldRank < newRank) {
    return { changed: true, direction: "down" as const, oldRank, newRank }
  }

  return { changed: false, direction: null, oldRank, newRank }
}

/**
 * GET NEXT AVAILABLE DAY - DATE-BASED
 * Now returns the next day that corresponds to today's date or future
 */
export function getNextAvailableDay(
  habit: {
    days: Record<number, DayStatus>
    dayLocks?: Record<number, DayLock>
    startDate: { timestamp: number }
  },
  totalDuration: number,
): { dayIndex: number | null; hoursRemaining?: number; lastMarkedDay?: number } {
  const currentDate = getCurrentDateString()

  // Find the last marked day
  const markedDays = Object.keys(habit.days)
    .map(Number)
    .filter((index) => habit.days[index])
    .sort((a, b) => b - a)

  // If no days marked yet, check if day 0 can be marked today
  if (markedDays.length === 0) {
    const expectedDate = getExpectedDateForDay(habit.startDate.timestamp, 0)

    if (currentDate >= expectedDate) {
      return { dayIndex: 0 }
    } else {
      // Calculate hours until day 0 opens
      const today = new Date(currentDate)
      const expected = new Date(expectedDate)
      const hoursDiff = Math.ceil((expected.getTime() - today.getTime()) / (1000 * 60 * 60))

      return {
        dayIndex: null,
        hoursRemaining: hoursDiff / 24, // Convert to days
        lastMarkedDay: -1,
      }
    }
  }

  const lastMarkedDay = markedDays[0]

  // If all days are marked, no more days available
  if (lastMarkedDay >= totalDuration - 1) {
    return { dayIndex: null, lastMarkedDay }
  }

  const nextDay = lastMarkedDay + 1
  const expectedDate = getExpectedDateForDay(habit.startDate.timestamp, nextDay)

  // Check if the expected calendar date has arrived
  if (currentDate >= expectedDate) {
    return { dayIndex: nextDay, lastMarkedDay }
  }

  // Calculate hours until next day opens
  const today = new Date()
  const expected = new Date(expectedDate + "T00:00:00")
  const hoursDiff = (expected.getTime() - today.getTime()) / (1000 * 60 * 60)

  return {
    dayIndex: null,
    hoursRemaining: Math.max(0, hoursDiff),
    lastMarkedDay,
  }
}
