"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { User, Habit } from "@/types/user"
import { HabitCard } from "@/components/habit-card"
import { AddHabitModal } from "@/components/add-habit-modal"
import { ProfilePage } from "@/components/profile-page"
import { PlannedHabitsModal } from "@/components/planned-habits-modal"
import { PomodoroPage } from "@/components/pomodoro-page"
import { LeaderboardPage } from "@/components/leaderboard-page"
import { StatisticsPage } from "@/components/statistics-page"
import { updateHabitStatus, lockOldDays, calculateRanks } from "@/lib/xp-system"
import { translations } from "@/lib/translations"
import type { Language } from "@/types/language"
import { InfoModal } from "@/components/info-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  saveUserToMongoDB,
  addHabitToMongoDB,
  deleteHabitFromMongoDB,
  savePomodoroToMongoDB,
  fetchAllUsersFromMongoDB,
} from "@/lib/db-sync"

import { Sun, LogOut, Shield, Target, Calendar, Plus, Clock, Trophy, TrendingUp, Globe } from "lucide-react"

interface MainAppProps {
  currentUser: User
  setCurrentUser: (user: User) => void
  onAdminClick: () => void
  onLogout: () => void
}

export function MainApp({ currentUser, setCurrentUser, onAdminClick, onLogout }: MainAppProps) {
  const { toast } = useToast()

  const [habits, setHabits] = useState<Habit[]>(currentUser.habits || [])
  const [plannedHabits, setPlannedHabits] = useState<Habit[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [showPlannedModal, setShowPlannedModal] = useState(false)
  const [showPomodoro, setShowPomodoro] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showStatistics, setShowStatistics] = useState(false)
  const [userRank, setUserRankState] = useState("beginner")
  const [pomodoroTimerRunning, setPomodoroTimerRunning] = useState(false)
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60)
  const [pomodoroDuration, setPomodoroDuration] = useState(25)
  const [timerJustCompleted, setTimerJustCompleted] = useState(false)
  const [language, setLanguage] = useState<Language>("en")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])

  const t = translations[language]

  useEffect(() => {
    const lockedUser = lockOldDays(currentUser)
    if (JSON.stringify(lockedUser.habits) !== JSON.stringify(currentUser.habits)) {
      console.log("[v0] Locking old days on app load")
      const users = JSON.parse(localStorage.getItem("just-habits-users") || "[]")
      const userIndex = users.findIndex((u: User) => u.id === currentUser.id)
      if (userIndex !== -1) {
        users[userIndex] = lockedUser
        localStorage.setItem("just-habits-users", JSON.stringify(users))
        saveUserToMongoDB(lockedUser)
        setCurrentUser(lockedUser)
        setHabits(lockedUser.habits)
      }
    }

    const savedTheme = localStorage.getItem("habit-theme")
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark")
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add("dark")
      setIsDarkMode(true)
    }

    const savedLanguage = localStorage.getItem("habit-language") as Language
    if (savedLanguage && (savedLanguage === "uz" || savedLanguage === "ru" || savedLanguage === "en")) {
      setLanguage(savedLanguage)
    }

    const savedPlannedHabits = localStorage.getItem(`planned-habits-${currentUser.id}`)
    if (savedPlannedHabits) {
      setPlannedHabits(JSON.parse(savedPlannedHabits))
    }

    checkAndActivatePlannedHabits()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      checkAndActivatePlannedHabits()
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [plannedHabits])

  useEffect(() => {
    const storedTimer = localStorage.getItem(`timer_${currentUser.id}`)
    if (storedTimer) {
      const { timeLeft, isRunning, duration } = JSON.parse(storedTimer)
      setPomodoroTimerRunning(isRunning)
      setPomodoroTimeLeft(timeLeft)
      setPomodoroDuration(duration || 25)
    }
  }, [currentUser.id])

  useEffect(() => {
    if (pomodoroTimerRunning && pomodoroTimeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setPomodoroTimeLeft((prev) => {
          const newTime = prev - 1

          localStorage.setItem(
            `timer_${currentUser.id}`,
            JSON.stringify({
              timeLeft: newTime,
              isRunning: true,
              duration: pomodoroDuration,
            }),
          )

          if (newTime === 0) {
            handleTimerComplete()
          }

          return newTime
        })
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [pomodoroTimerRunning, pomodoroTimeLeft, pomodoroDuration, currentUser.id])

  useEffect(() => {
    if (timerJustCompleted) {
      toast({
        title: t.completed,
        description: t.tomatoCompleted,
      })
      setTimerJustCompleted(false)
    }
  }, [timerJustCompleted, toast, t.completed, t.tomatoCompleted])

  useEffect(() => {
    const loadUsers = async () => {
      console.log("[v0] Loading users from MongoDB...")
      const users = await fetchAllUsersFromMongoDB()
      if (users.length === 0) {
        console.log("[v0] No users in MongoDB, using localStorage")
        const localUsers = JSON.parse(localStorage.getItem("just-habits-users") || "[]")
        setAllUsers(localUsers)
      } else {
        console.log("[v0] Loaded users from MongoDB:", users.length)
        setAllUsers(users)
      }
    }
    loadUsers()
  }, [currentUser.xpData.totalXP]) // Reload when XP changes

  const checkAndActivatePlannedHabits = () => {
    const now = Date.now()
    const habitsToActivate: Habit[] = []
    const remainingPlanned: Habit[] = []

    plannedHabits.forEach((habit) => {
      if (habit.scheduledStartTime && habit.scheduledStartTime <= now) {
        habitsToActivate.push({ ...habit, scheduledStartTime: undefined })
      } else {
        remainingPlanned.push(habit)
      }
    })

    if (habitsToActivate.length > 0) {
      const updatedHabits = [...habits, ...habitsToActivate]
      saveHabits(updatedHabits)
      setPlannedHabits(remainingPlanned)
      localStorage.setItem(`planned-habits-${currentUser.id}`, JSON.stringify(remainingPlanned))

      toast({
        title: t.habitAdded,
        description: `${habitsToActivate.length} ${habitsToActivate.length === 1 ? "odat" : "odatlar"} boshlandi!`,
      })
    }
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    if (!isDarkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("habit-theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("habit-theme", "light")
    }
  }

  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("habit-language", lang)
  }

  const saveHabits = (updatedHabits: Habit[]) => {
    console.log("[v0] Saving habits, count:", updatedHabits.length)
    setHabits(updatedHabits)
    const users = JSON.parse(localStorage.getItem("just-habits-users") || "[]")
    const userIndex = users.findIndex((u: User) => u.id === currentUser.id)
    if (userIndex === -1) {
      console.log("[v0] User not found in just-habits-users array, adding user now")
      const updatedUser = { ...currentUser, habits: updatedHabits }
      users.push(updatedUser)
      localStorage.setItem("just-habits-users", JSON.stringify(users))
      saveUserToMongoDB(updatedUser)
      setCurrentUser(updatedUser)
      return
    }
    users[userIndex].habits = updatedHabits
    localStorage.setItem("just-habits-users", JSON.stringify(users))
    const updatedUser = { ...currentUser, habits: updatedHabits }
    console.log("[v0] Saving user to MongoDB with habits")
    saveUserToMongoDB(updatedUser)
    setCurrentUser(updatedUser)
  }

  const addHabit = (habit: Habit) => {
    console.log("[v0] Adding new habit:", habit.name)
    const habitWithLocks = {
      ...habit,
      dayLocks: {},
      missReasons: {},
    }
    const updatedHabits = [...habits, habitWithLocks]
    saveHabits(updatedHabits)
    addHabitToMongoDB(currentUser.id, habitWithLocks)
    toast({ title: t.habitAdded, description: `${habit.name} ${t.habitAddedSuccess}` })
  }

  const scheduleHabit = (habit: Habit) => {
    const habitWithLocks = {
      ...habit,
      dayLocks: {},
      missReasons: {},
    }
    const updatedPlannedHabits = [...plannedHabits, habitWithLocks]
    setPlannedHabits(updatedPlannedHabits)
    localStorage.setItem(`planned-habits-${currentUser.id}`, JSON.stringify(updatedPlannedHabits))

    const startDate = new Date(habit.scheduledStartTime!)
    toast({
      title: t.habitScheduled,
      description: `${habit.name} ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()} ${t.habitScheduledSuccess}`,
    })
  }

  const deleteHabit = (habitId: number) => {
    const updatedHabits = habits.filter((h) => h.id !== habitId)
    saveHabits(updatedHabits)
    deleteHabitFromMongoDB(currentUser.id, habitId)
    toast({ title: t.habitDeleted, description: t.habitDeletedSuccess })
  }

  const deletePlannedHabit = (habitId: number) => {
    const updatedPlannedHabits = plannedHabits.filter((h) => h.id !== habitId)
    setPlannedHabits(updatedPlannedHabits)
    localStorage.setItem(`planned-habits-${currentUser.id}`, JSON.stringify(updatedPlannedHabits))
    toast({ title: t.habitDeleted, description: t.habitDeletedSuccess })
  }

  const updateHabitDay = async (
    habitId: number,
    dayIndex: number,
    status: "completed" | "partial" | "missed" | "none",
    missReason?: string,
  ) => {
    const result = updateHabitStatus(currentUser, habitId, dayIndex, status, missReason)

    if (!result.success) {
      toast({
        title: "Cannot change status",
        description: result.message,
        variant: "destructive",
      })
      return
    }

    if (result.updatedUser) {
      setCurrentUser(result.updatedUser)
      setHabits(result.updatedUser.habits)

      // LocalStorage ga darhol saqlash
      const localUsers = JSON.parse(localStorage.getItem("just-habits-users") || "[]") as User[]
      const userIndex = localUsers.findIndex((u) => u.id === result.updatedUser!.id)
      if (userIndex === -1) {
        localUsers.push(result.updatedUser)
      } else {
        localUsers[userIndex] = result.updatedUser
      }
      localStorage.setItem("just-habits-users", JSON.stringify(localUsers))

      if (result.xpChange && result.xpChange > 0) {
        toast({
          title: result.message,
          description:
            status === "completed"
              ? t.habitCompleted
              : status === "partial"
                ? t.habitPartialCompleted
                : "Status updated",
        })
      } else if (result.xpChange && result.xpChange < 0) {
        toast({
          title: "XP adjusted",
          description: `${result.xpChange} XP (status changed)`,
        })
      }

      Promise.resolve().then(async () => {
        try {
          await saveUserToMongoDB(result.updatedUser!)
          const dbUsers = await fetchAllUsersFromMongoDB()

          let allUsersForRanking: User[]
          if (dbUsers.length > 0) {
            allUsersForRanking = dbUsers
          } else {
            const localUsers = JSON.parse(localStorage.getItem("just-habits-users") || "[]") as User[]
            allUsersForRanking = localUsers
          }

          const userIndex = allUsersForRanking.findIndex((u) => u.id === result.updatedUser!.id)
          if (userIndex === -1) {
            allUsersForRanking.push(result.updatedUser!)
          } else {
            allUsersForRanking[userIndex] = result.updatedUser!
          }

          const usersWithRanks = calculateRanks(allUsersForRanking)
          localStorage.setItem("just-habits-users", JSON.stringify(usersWithRanks))

          await Promise.all(usersWithRanks.map((user) => saveUserToMongoDB(user)))

          const updatedCurrentUser = usersWithRanks.find((u) => u.id === currentUser.id)
          if (updatedCurrentUser) {
            setCurrentUser(updatedCurrentUser)
            setHabits(updatedCurrentUser.habits)
            setAllUsers(usersWithRanks)
          }
        } catch (err) {
          console.error("[v0] Background sync error:", err)
        }
      })
    }
  }

  const stats = {
    totalHabits: habits.length,
    completedDays: habits.reduce(
      (sum, habit) => sum + Object.values(habit.days).filter((s) => s === "completed").length,
      0,
    ),
    partialDays: habits.reduce(
      (sum, habit) => sum + Object.values(habit.days).filter((s) => s === "partial").length,
      0,
    ),
    skippedDays: habits.reduce(
      (sum, habit) => sum + Object.values(habit.days).filter((s) => s === "skipped").length,
      0,
    ),
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getRankIcon = () => {
    const ranks: Record<string, string> = {
      beginner: "🌱",
      lazy: "😴",
      weak: "😔",
      active: "💪",
      determined: "🔥",
      disciplined: "👑",
    }
    return ranks[userRank] || "🌱"
  }

  const handlePomodoroTimerChange = (isRunning: boolean, timeLeft: number, duration?: number) => {
    setPomodoroTimerRunning(isRunning)
    setPomodoroTimeLeft(timeLeft)
    if (duration !== undefined) setPomodoroDuration(duration)

    localStorage.setItem(
      `timer_${currentUser.id}`,
      JSON.stringify({
        timeLeft,
        isRunning,
        duration: duration || pomodoroDuration,
      }),
    )

    if (isRunning && !pomodoroTimerRunning) {
      const startAudio = new Audio("/sounds/timer-start.mp3")
      startAudio.play().catch((err) => console.log("[v0] Timer start sound error:", err))
    }
  }

  const formatTimerTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleTimerComplete = () => {
    setPomodoroTimerRunning(false)

    const endAudio = new Audio("/sounds/timer-end.mp3")
    endAudio.play().catch((err) => console.log("[v0] Timer end sound error:", err))

    const today = new Date().toISOString().split("T")[0]
    const stored = localStorage.getItem(`pomodoro_${currentUser.id}`)
    const pomodoroData = stored ? JSON.parse(stored) : { sessions: [], totalPomodoros: 0 }

    const existingSession = pomodoroData.sessions.find((s: any) => s.date === today)
    let updatedSessions

    if (existingSession) {
      updatedSessions = pomodoroData.sessions.map((s: any) => (s.date === today ? { ...s, count: s.count + 1 } : s))
    } else {
      updatedSessions = [...pomodoroData.sessions, { id: Date.now(), date: today, count: 1 }]
    }

    const newPomodoroData = {
      sessions: updatedSessions,
      totalPomodoros: pomodoroData.totalPomodoros + 1,
    }

    localStorage.setItem(`pomodoro_${currentUser.id}`, JSON.stringify(newPomodoroData))

    savePomodoroToMongoDB(currentUser.id, { id: Date.now(), date: today, count: 1 })

    setPomodoroTimeLeft(pomodoroDuration * 60)
    localStorage.setItem(
      `timer_${currentUser.id}`,
      JSON.stringify({
        timeLeft: pomodoroDuration * 60,
        isRunning: false,
        duration: pomodoroDuration,
      }),
    )

    setTimerJustCompleted(true)
  }

  const handleLeaderboardClick = () => {
    setShowLeaderboard(true)
  }

  const handleBackClick = () => {
    setShowPomodoro(false)
    setShowLeaderboard(false)
    setShowStatistics(false)
  }

  if (showLeaderboard) {
    return (
      <LeaderboardPage
        language={language}
        onBack={handleBackClick}
        currentUserId={currentUser.id}
        allUsers={allUsers}
      />
    )
  }

  if (showPomodoro) {
    return (
      <PomodoroPage
        language={language}
        onBack={handleBackClick}
        userId={currentUser.id}
        isTimerRunning={pomodoroTimerRunning}
        timerTimeLeft={pomodoroTimeLeft}
        timerDuration={pomodoroDuration}
        onTimerStateChange={handlePomodoroTimerChange}
      />
    )
  }

  if (showStatistics) {
    return <StatisticsPage onBack={() => setShowStatistics(false)} language={language} habits={habits} />
  }

  return (
    <div className={`min-h-screen bg-background flex flex-col`}>
      <div className="flex-1 max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 w-full">
        {/* Header */}
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted border-2 border-muted-foreground flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src="/images/photo-2025-04-28-23-15-21.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Just</h1>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Statistics button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStatistics(true)}
                title={t.statistics}
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                <TrendingUp className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="h-9 w-9 sm:h-10 sm:w-10 p-0 bg-transparent"
              >
                <Sun className="h-4 w-4" />
              </Button>

              {currentUser.isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAdminClick}
                  className="h-9 w-9 sm:h-10 sm:w-10 p-0 relative bg-transparent"
                >
                  <Shield className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="h-9 w-9 sm:h-10 sm:w-10 p-0 bg-transparent"
              >
                <LogOut className="h-4 w-4" />
              </Button>

              {/* Language Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-2 sm:px-3 bg-transparent gap-1">
                    <Globe className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline text-xs truncate">
                      {language === "uz" ? "UZ" : language === "ru" ? "RU" : "EN"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => changeLanguage("uz")}>🇺🇿 O'zbek</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage("ru")}>🇷🇺 Русский</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage("en")}>🇬🇧 English</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="mt-3 sm:mt-4" />

        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRulesModal(true)}
            className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 h-auto min-h-[40px]"
          >
            <Target className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">{t.rankRules}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPlannedModal(true)}
            className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 h-auto min-h-[40px]"
          >
            <Calendar className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">{t.plannedHabits}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLeaderboardClick}
            className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 h-auto min-h-[40px] bg-transparent"
          >
            <Trophy className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">{t.leaderboard}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPomodoro(true)}
            className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 h-auto min-h-[40px]"
          >
            <Clock className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">{t.pomodoro}</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">{stats.totalHabits}</div>
            <div className="text-xs sm:text-sm text-muted-foreground leading-tight">{t.totalHabits}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 text-green-500">{stats.completedDays}</div>
            <div className="text-xs sm:text-sm text-muted-foreground leading-tight">{t.completedDays}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 text-yellow-500">{stats.partialDays}</div>
            <div className="text-xs sm:text-sm text-muted-foreground leading-tight">{t.partialDays}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 text-red-500">{stats.skippedDays}</div>
            <div className="text-xs sm:text-sm text-muted-foreground leading-tight">{t.skippedDays}</div>
          </div>
        </div>

        {/* Habits List */}
        {habits.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-xl text-muted-foreground mb-2">{t.noHabitsYet}</p>
            <p className="text-sm text-muted-foreground mb-6">{t.noHabitsMessage}</p>
            <div className="flex justify-center">
              <Button
                onClick={() => setShowAddModal(true)}
                size="lg"
                className="rounded-full h-16 w-16 p-0 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                <Plus className="h-8 w-8" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onDelete={deleteHabit}
                  onUpdateDay={updateHabitDay}
                  language={language}
                />
              ))}
            </div>
            <div className="flex justify-center mb-8">
              <Button
                onClick={() => setShowAddModal(true)}
                size="lg"
                className="rounded-full h-16 w-16 p-0 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                <Plus className="h-8 w-8" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-border/40 mt-12 py-8 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Credit text */}
            <p className="text-sm text-muted-foreground">
              Bu sayt Mr John boshchiligida Lord Team jamosi tomonidan yasaldi
            </p>

            {/* Contact links */}
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {/* Mr John Telegram */}
              <a
                href="https://t.me/webdeveloper_4o4"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
                <span>Mr John</span>
              </a>

              {/* Lord Team Lead Developer */}
              <a
                href="https://t.me/webdeveloper404"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Lord Team Bosh Dasturchi
              </a>
            </div>

            {/* Main channel */}
            <a
              href="https://t.me/just_mind5"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
            >
              Asosiy kanal
            </a>
          </div>
        </div>
      </footer>
      {/* End of Footer */}

      {pomodoroTimerRunning && !showPomodoro && (
        <div className="fixed top-20 right-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-pulse">
          <Clock className="h-5 w-5" />
          <span className="font-mono font-bold">{formatTimerTime(pomodoroTimeLeft)}</span>
          <span className="text-sm">🍅</span>
        </div>
      )}

      {showAddModal && (
        <AddHabitModal
          onClose={() => setShowAddModal(false)}
          onAdd={addHabit}
          onSchedule={scheduleHabit}
          language={language}
        />
      )}

      {showAboutModal && <ProfilePage onClose={() => setShowAboutModal(false)} currentUser={currentUser} />}

      {showRulesModal && (
        <InfoModal title={t.rulesContent.title} onClose={() => setShowRulesModal(false)}>
          <div className="space-y-4 text-sm whitespace-pre-line">
            <p className="text-muted-foreground">{t.rulesContent.intro}</p>

            <div className="space-y-2">
              <p>{t.rulesContent.xpRewards.completed}</p>
              <p>{t.rulesContent.xpRewards.partial}</p>
              <p>{t.rulesContent.xpRewards.missed}</p>
            </div>

            <div>
              <p className="font-semibold mb-2">{t.rulesContent.levelUp.title}</p>
              <p>{t.rulesContent.levelUp.consistent}</p>
              <p>{t.rulesContent.levelUp.moreXP}</p>
              <p>{t.rulesContent.levelUp.highLevel}</p>
            </div>

            <div>
              <p className="font-semibold mb-2">{t.rulesContent.ranking.title}</p>
              <p>{t.rulesContent.ranking.moreXPBetter}</p>
              <p>{t.rulesContent.ranking.canDrop}</p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="font-semibold mb-2">{t.rulesContent.importantRule.title}</p>
              <p>{t.rulesContent.importantRule.oncePerDay}</p>
              <p>{t.rulesContent.importantRule.oneXP}</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="font-semibold mb-2">{t.rulesContent.tip.title}</p>
              <p>{t.rulesContent.tip.message}</p>
            </div>
          </div>
        </InfoModal>
      )}

      {showPlannedModal && (
        <PlannedHabitsModal
          plannedHabits={plannedHabits}
          onClose={() => setShowPlannedModal(false)}
          onDelete={deletePlannedHabit}
          language={language}
        />
      )}
    </div>
  )
}
