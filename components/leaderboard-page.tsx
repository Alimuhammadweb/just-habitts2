"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, TrendingUp } from "lucide-react"
import { translations, type Language } from "@/lib/translations"
import type { User } from "@/types/user"
import { calculateLevel, getLevelBadge } from "@/lib/xp-system"

interface LeaderboardPageProps {
  language: Language
  onBack: () => void
  currentUserId: number
  allUsers: User[]
}

export function LeaderboardPage({ language, onBack, currentUserId, allUsers }: LeaderboardPageProps) {
  const t = translations[language]

  const rankedUsers = [...allUsers]
    .sort((a, b) => (b.xpData?.totalXP || 0) - (a.xpData?.totalXP || 0))
    .map((user, index) => ({
      ...user,
      position: index + 1,
      level: calculateLevel(user.xpData?.totalXP || 0),
    }))

  const currentUserRank = rankedUsers.find((u) => u.id === currentUserId)

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            {t.leaderboard}
          </h1>
          <div className="w-10" />
        </div>

        {/* Current User Stats */}
        {currentUserRank && (
          <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl p-4 mb-6 border-2 border-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.yourRank}</p>
                <p className="text-3xl font-bold">#{currentUserRank.position}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t.level}</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getLevelBadge(currentUserRank.level)}</span>
                  <span className="text-3xl font-bold">{currentUserRank.level}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">XP</p>
                <p className="text-2xl font-bold text-primary">{currentUserRank.xpData?.totalXP || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {/* <div className="grid grid-cols-3 gap-3 mb-6">
          {rankedUsers.slice(0, 3).map((user, idx) => {
            const medals = ["🥇", "🥈", "🥉"]
            const gradients = [
              "from-yellow-500/20 to-yellow-600/20 border-yellow-500",
              "from-gray-400/20 to-gray-500/20 border-gray-400",
              "from-orange-600/20 to-orange-700/20 border-orange-600",
            ]

            return (
              <div
                key={user.id}
                className={`bg-gradient-to-br ${gradients[idx]} border-2 rounded-xl p-4 text-center min-h-[200px] flex flex-col justify-center ${
                  user.id === currentUserId ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="text-4xl mb-2">{medals[idx]}</div>
                <div className="font-semibold truncate mb-1">{user.name}</div>
                <div className="text-xs text-muted-foreground mb-2">
                  {t.level} {user.level} {getLevelBadge(user.level)}
                </div>
                <div className="text-lg font-bold text-primary">{user.xpData?.totalXP || 0} XP</div>
              </div>
            )
          })}
        </div> */}

        {/* Full Leaderboard */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 bg-muted/50 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t.fullRankings}
            </h2>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {rankedUsers.map((user) => {
              const isCurrentUser = user.id === currentUserId
              const isTop10 = user.position <= 10

              return (
                <div
                  key={user.id}
                  className={`p-3 sm:p-4 flex items-center gap-2 sm:gap-4 hover:bg-muted/50 transition-colors ${
                    isCurrentUser ? "bg-primary/10" : ""
                  }`}
                >
                  {/* Position */}
                  <div className="w-8 sm:w-12 text-center flex-shrink-0">
                    {user.position <= 3 ? (
                      <span className="text-xl sm:text-2xl">
                        {user.position === 1 ? "🥇" : user.position === 2 ? "🥈" : "🥉"}
                      </span>
                    ) : (
                      <span
                        className={`font-bold text-sm sm:text-base ${isTop10 ? "text-primary" : "text-muted-foreground"}`}
                      >
                        #{user.position}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="min-w-0 max-w-[140px] sm:max-w-xs flex-shrink">
                    <div className="font-semibold truncate text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                      <span className="truncate">{user.name}</span>
                      {isCurrentUser && (
                        <span className="text-[10px] sm:text-xs bg-primary text-primary-foreground px-1.5 sm:px-2 py-0.5 rounded flex-shrink-0">
                          {t.you}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-2">
                      <span className="truncate">
                        {t.level} {user.level}
                      </span>
                      <span className="flex-shrink-0">{getLevelBadge(user.level)}</span>
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right ml-auto flex-shrink-0">
                    <div className="font-bold text-primary text-sm sm:text-base">{user.xpData?.totalXP || 0}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">XP</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
