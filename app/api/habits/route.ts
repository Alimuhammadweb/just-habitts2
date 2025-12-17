import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { userId, habit } = await request.json()
    const db = await getDb()

    // Add habit to user's habits array
    await db.collection("users").updateOne({ id: userId }, { $push: { habits: habit } })

    return NextResponse.json({ success: true, habit })
  } catch (error) {
    console.error("[MongoDB] Error adding habit:", error)
    return NextResponse.json({ error: "Failed to add habit" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, habitId, updates } = await request.json()
    const db = await getDb()

    const updateFields: Record<string, any> = {}

    // Only update the fields that are provided
    if (updates.days !== undefined) {
      updateFields["habits.$.days"] = updates.days
    }
    if (updates.dayLocks !== undefined) {
      updateFields["habits.$.dayLocks"] = updates.dayLocks
    }
    if (updates.missReasons !== undefined) {
      updateFields["habits.$.missReasons"] = updates.missReasons
    }
    if (updates.name !== undefined) {
      updateFields["habits.$.name"] = updates.name
    }
    if (updates.duration !== undefined) {
      updateFields["habits.$.duration"] = updates.duration
    }
    if (updates.why !== undefined) {
      updateFields["habits.$.why"] = updates.why
    }

    // Update specific habit fields in user's habits array
    await db.collection("users").updateOne({ id: userId, "habits.id": habitId }, { $set: updateFields })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[MongoDB] Error updating habit:", error)
    return NextResponse.json({ error: "Failed to update habit" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, habitId } = await request.json()
    const db = await getDb()

    // Remove habit from user's habits array
    await db.collection("users").updateOne({ id: userId }, { $pull: { habits: { id: habitId } } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[MongoDB] Error deleting habit:", error)
    return NextResponse.json({ error: "Failed to delete habit" }, { status: 500 })
  }
}
