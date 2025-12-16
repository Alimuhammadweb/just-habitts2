"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { User } from "@/types/user"
import { translations, type Language } from "@/lib/translations"
import { getLevelBadge, getLevelName, calculateLevel } from "@/lib/xp-system"

interface ProfilePageProps {
  onClose: () => void
  currentUser: User
  language?: Language
}

export function ProfilePage({ onClose, currentUser, language = "en" }: ProfilePageProps) {
  if (!currentUser || !currentUser.xpData) {
    return null
  }

  const t = translations[language]
  const level = calculateLevel(currentUser.xpData.totalXP || 0)
  const levelName = getLevelName(level)
  const levelBadge = getLevelBadge(level)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-3 sm:p-4 z-50" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-lg p-4 sm:p-6 max-w-lg sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">{t.profile || "Profile"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 sm:h-10 sm:w-10">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* User Info */}
          <div className="bg-muted/50 rounded-lg p-4 sm:p-4">
            <div className="flex items-center gap-4 sm:gap-4 mb-4 sm:mb-4">
              <div className="w-16 h-16 sm:w-16 sm:h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl sm:text-2xl font-bold flex-shrink-0">
                {currentUser.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase()
                  .substring(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl sm:text-xl font-semibold truncate">{currentUser.name}</h3>
                <p className="text-sm sm:text-sm text-muted-foreground truncate">{currentUser.email}</p>
              </div>
            </div>
          </div>

          {/* XP and Level */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-muted/50 rounded-lg p-4 sm:p-4 text-center">
              <div className="text-3xl sm:text-3xl font-bold text-primary mb-1">{currentUser.xpData.totalXP || 0}</div>
              <div className="text-sm sm:text-sm text-muted-foreground">{t.totalXP || "Total XP"}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 sm:p-4 text-center">
              <div className="text-3xl sm:text-3xl font-bold mb-1">
                {levelBadge} {level}
              </div>
              <div className="text-sm sm:text-sm text-muted-foreground">{levelName}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3 sm:space-y-3">
            <h3 className="font-semibold text-base sm:text-base">{t.statistics || "Statistics"}</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-3">
              <div className="bg-muted/50 rounded-lg p-3 sm:p-3">
                <div className="text-xl sm:text-lg font-bold">{currentUser.habits?.length || 0}</div>
                <div className="text-xs text-muted-foreground">{t.totalHabits || "Total Habits"}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 sm:p-3">
                <div className="text-xl sm:text-lg font-bold">{currentUser.xpData.weeklyXP || 0}</div>
                <div className="text-xs text-muted-foreground">{t.weeklyXP || "Weekly XP"}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 sm:p-3">
                <div className="text-xl sm:text-lg font-bold">{currentUser.xpData.rank || "—"}</div>
                <div className="text-xs text-muted-foreground">{t.globalRank || "Global Rank"}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 sm:p-3">
                <div className="text-xl sm:text-lg font-bold">{currentUser.xpData.monthlyXP || 0}</div>
                <div className="text-xs text-muted-foreground">{t.monthlyXP || "Monthly XP"}</div>
              </div>
            </div>
          </div>

          {/* About App */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-semibold text-sm sm:text-base">{t.aboutApp || "About Just"}</h3>
            <div className="text-xs sm:text-sm text-muted-foreground space-y-2 break-words hyphens-auto">
              <p>
                {t.aboutAppDescription ||
                  "Just is a habit tracking app that helps you build better habits and track your progress with an XP system."}
              </p>
              <p>
                {t.aboutAppFeatures ||
                  "Complete habits daily to earn XP, level up, and compete on the leaderboard. Stay consistent to build streaks and achieve your goals!"}
              </p>
            </div>
          </div>

          <Button onClick={onClose} className="w-full h-11 sm:h-10">
            {t.close || "Close"}
          </Button>
        </div>
      </div>
    </div>
  )
}
