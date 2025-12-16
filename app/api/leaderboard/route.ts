import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { calculateRanks } from "@/lib/xp-system"

export async function GET(request: NextRequest) {
  try {
    const db = await getDb()
    const users = await db.collection("users").find({}).toArray()

    // Calculate ranks for all users
    const usersWithRanks = calculateRanks(users as any[])

    // Save updated ranks back to database
    const bulkOps = usersWithRanks.map((user) => ({
      updateOne: {
        filter: { id: user.id },
        update: { $set: { xpData: user.xpData } },
      },
    }))

    if (bulkOps.length > 0) {
      await db.collection("users").bulkWrite(bulkOps)
    }

    return NextResponse.json(usersWithRanks)
  } catch (error) {
    console.error("[MongoDB] Error fetching leaderboard:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}
