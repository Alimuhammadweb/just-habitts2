import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import type { User } from "@/types/user"

export async function GET(request: NextRequest) {
  try {
    const db = await getDb()
    const users = await db.collection<User>("users").find({}).toArray()

    const cleanUsers = users.map(({ _id, ...user }) => user)

    return NextResponse.json(cleanUsers, {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    })
  } catch (error) {
    console.error("[MongoDB] Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await request.json()
    const db = await getDb()

    const existingUser = await db.collection("users").findOne({
      $or: [{ email: user.email }, { id: user.id }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    await db.collection("users").insertOne(user)
    return NextResponse.json(user)
  } catch (error) {
    console.error("[MongoDB] Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await request.json()
    const db = await getDb()

    await db.collection("users").replaceOne({ id: user.id }, user, { upsert: true })

    return NextResponse.json(user)
  } catch (error) {
    console.error("[MongoDB] Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
