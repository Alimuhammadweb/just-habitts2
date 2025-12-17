export interface User {
  id: number
  name: string
  email: string
  password: string
  createdAt: string
  isActive: boolean
  isAdmin: boolean
  habits: Habit[]
  stats: UserStats
  pomodoroData: PomodoroData
  xpData: XPData
  avatar?: string
  publicProfile: boolean
}

export interface Habit {
  id: number
  name: string
  duration: number
  days: Record<number, DayStatus>
  colors: Record<number, string> // Stores the actual color: "green", "yellow", "red"
  dayLocks: Record<number, DayLock>
  time: { hour: number; minute: number } | null
  notifications: boolean
  startDate: {
    day: number
    month: number
    year: number
    timestamp: number
  }
  scheduledStartTime?: number
  why: string // Why is this habit important?
  missReasons: Record<number, string>
}

export interface DayLock {
  status: DayStatus
  markedAt: number // timestamp when marked
  dateString: string // YYYY-MM-DD format for day boundary checking
  xpAwarded: number // how much XP was given
  locked: boolean // prevents further changes after day ends
}

export type DayStatus = "completed" | "partial" | "missed"

export interface XPData {
  totalXP: number
  level: number
  rank: number | null // Rank can be null for new users temporarily
  weeklyXP: number
  monthlyXP: number
  xpHistory: XPHistory[]
  currentXP: number
  lastUpdated: number
}

export interface XPHistory {
  date: string // YYYY-MM-DD
  xpEarned: number
  habitId: number
  dayIndex: number // which day of the habit
  status: DayStatus
  timestamp: number
}

export interface MissReason {
  date: string // YYYY-MM-DD
  reason: "forgot" | "no-time" | "low-motivation" | "health" | "mental-overload" | "custom"
  customReason?: string
}

export interface UserStats {
  totalHabits: number
  completedDays: number
  currentStreak: number
  longestStreak: number
}

export interface PomodoroSession {
  id: number
  date: string // YYYY-MM-DD format
  count: number // number of pomodoros completed
}

export interface PomodoroData {
  sessions: PomodoroSession[]
  totalPomodoros: number
}

export const ADMIN_CREDENTIALS = {
  email: "admin@mail.com",
  password: "admin",
}

export const LEVEL_THRESHOLDS = {
  BEGINNER: { min: 1, max: 4, name: "Beginner" },
  DISCIPLINE: { min: 5, max: 9, name: "Discipline" },
  ATOMIC_MAN: { min: 10, max: 19, name: "Atomic Man" },
  IRON_MIND: { min: 20, max: 29, name: "Iron Mind" },
  ELITE: { min: 30, max: Number.POSITIVE_INFINITY, name: "Elite" },
} as const

export const XP_REWARDS = {
  completed: 10,
  partial: 5,
  missed: 0, // Changed from "skipped" to "missed"
} as const
