"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, Calendar, Award, Target, Flame } from "lucide-react"
import { translations, type Language } from "@/lib/translations"
import type { Habit } from "@/types/user"

interface StatisticsPageProps {
  onBack: () => void
  language: Language
  habits: Habit[]
}

export function StatisticsPage({ onBack, language, habits }: StatisticsPageProps) {
  const t = translations[language]

  // Calculate weekly stats
  const getWeeklyStats = () => {
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    let weeklyCompleted = 0
    let weeklyPartial = 0
    let weeklySkipped = 0

    habits.forEach((habit) => {
      Object.entries(habit.days).forEach(([dayIndex, status]) => {
        const dayDate = new Date(habit.startDate.timestamp)
        dayDate.setDate(dayDate.getDate() + Number(dayIndex))

        if (dayDate >= weekAgo && dayDate <= today) {
          if (status === "completed") weeklyCompleted++
          else if (status === "partial") weeklyPartial++
          else if (status === "skipped") weeklySkipped++
        }
      })
    })

    return { weeklyCompleted, weeklyPartial, weeklySkipped }
  }

  // Calculate monthly stats
  const getMonthlyStats = () => {
    const today = new Date()
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    let monthlyCompleted = 0
    let monthlyPartial = 0
    let monthlySkipped = 0

    habits.forEach((habit) => {
      Object.entries(habit.days).forEach(([dayIndex, status]) => {
        const dayDate = new Date(habit.startDate.timestamp)
        dayDate.setDate(dayDate.getDate() + Number(dayIndex))

        if (dayDate >= monthAgo && dayDate <= today) {
          if (status === "completed") monthlyCompleted++
          else if (status === "partial") monthlyPartial++
          else if (status === "skipped") monthlySkipped++
        }
      })
    })

    return { monthlyCompleted, monthlyPartial, monthlySkipped }
  }

  // Calculate best streak
  const getBestStreak = () => {
    let maxStreak = 0

    habits.forEach((habit) => {
      const sortedDays = Object.keys(habit.days)
        .map(Number)
        .sort((a, b) => a - b)

      let currentStreak = 0

      sortedDays.forEach((dayNum) => {
        if (habit.days[dayNum] === "completed") {
          currentStreak++
          maxStreak = Math.max(maxStreak, currentStreak)
        } else {
          currentStreak = 0
        }
      })
    })

    return maxStreak
  }

  // Calculate completion rate
  const getCompletionRate = () => {
    let totalDays = 0
    let completedDays = 0

    habits.forEach((habit) => {
      const days = Object.values(habit.days)
      totalDays += days.length
      completedDays += days.filter((s) => s === "completed").length
    })

    return totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
  }

  const { weeklyCompleted, weeklyPartial, weeklySkipped } = getWeeklyStats()
  const { monthlyCompleted, monthlyPartial, monthlySkipped } = getMonthlyStats()
  const bestStreak = getBestStreak()
  const completionRate = getCompletionRate()

  const totalCompleted = habits.reduce(
    (sum, h) => sum + Object.values(h.days).filter((s) => s === "completed").length,
    0,
  )

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 sm:h-10 sm:w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">{t.statistics}</h1>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3 sm:p-4 text-white">
            <Target className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
            <div className="text-xl sm:text-2xl font-bold">{totalCompleted}</div>
            <div className="text-xs sm:text-sm opacity-90 break-words">{t.totalCompleted}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-3 sm:p-4 text-white">
            <Flame className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
            <div className="text-xl sm:text-2xl font-bold">{bestStreak}</div>
            <div className="text-xs sm:text-sm opacity-90 break-words">{t.bestStreak}</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-3 sm:p-4 text-white">
            <Award className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
            <div className="text-xl sm:text-2xl font-bold">{completionRate}%</div>
            <div className="text-xs sm:text-sm opacity-90 break-words">{t.completionRate}</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-3 sm:p-4 text-white">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
            <div className="text-xl sm:text-2xl font-bold">{habits.length}</div>
            <div className="text-xs sm:text-sm opacity-90 break-words">{t.activeHabits}</div>
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h2 className="text-base sm:text-xl font-semibold">{t.weeklyStats}</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{weeklyCompleted}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t.completed}</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{weeklyPartial}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t.partial}</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{weeklySkipped}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t.skipped}</div>
            </div>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h2 className="text-base sm:text-xl font-semibold">{t.monthlyStats}</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{monthlyCompleted}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t.completed}</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{monthlyPartial}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t.partial}</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{monthlySkipped}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{t.skipped}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
