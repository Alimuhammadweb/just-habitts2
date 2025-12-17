import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export async function PUT(request: NextRequest) {
  try {
    const { userId, xpData } = await request.json()
    const db = await getDb()

    // Update only XP data
    await db.collection("users").updateOne({ id: userId }, { $set: { xpData } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[MongoDB] Error updating XP data:", error)
    return NextResponse.json({ error: "Failed to update XP data" }, { status: 500 })
  }
}
