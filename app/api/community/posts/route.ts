import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

// GET - Barcha postlarni olish
export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const posts = await db.collection("community_posts").find({}).sort({ isPinned: -1, createdAt: -1 }).toArray()

    return NextResponse.json(posts)
  } catch (error) {
    console.error("[v0] Error fetching community posts:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, userName, userAvatar, title, content, imageUrl, linkUrl, isAdmin } = body

    const { db } = await connectToDatabase()

    let isPinned = false
    if (isAdmin) {
      isPinned = true
      // Eskisini unpin qil
      await db.collection("community_posts").updateMany({ isPinned: true }, { $set: { isPinned: false } })
    }

    const newPost = {
      id: Date.now(),
      userId: userId, // userId qo'shildi
      adminId: userId, // backward compatibility
      adminName: userName,
      adminAvatar: userAvatar || "",
      title: title || "",
      content,
      isPinned: isPinned,
      isAdminPost: isAdmin || false, // admin post ekanligini belgilash
      imageUrl: imageUrl || "",
      linkUrl: linkUrl || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      reactions: [],
    }

    await db.collection("community_posts").insertOne(newPost)

    return NextResponse.json(newPost, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating post:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = Number(searchParams.get("postId"))
    const userId = Number(searchParams.get("userId"))

    const { db } = await connectToDatabase()

    // User ma'lumotlarini olish
    const user = await db.collection("users").findOne({ id: userId })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Postni topish
    const post = await db.collection("community_posts").findOne({ id: postId })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Faqat o'z postini yoki admin o'chira oladi
    if (post.userId !== userId && !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await db.collection("community_posts").deleteOne({ id: postId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting post:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}

// PATCH - Post yangilash va PIN/UNPIN (faqat admin)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { postId, adminId, updates } = body

    const { db } = await connectToDatabase()
    const admin = await db.collection("users").findOne({ id: adminId, isAdmin: true })

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 })
    }

    // Agar yangi PIN bo'lsa, eskisini unpin qil
    if (updates.isPinned === true) {
      await db.collection("community_posts").updateMany({ isPinned: true }, { $set: { isPinned: false } })
    }

    const updatedPost = await db
      .collection("community_posts")
      .findOneAndUpdate(
        { id: postId },
        { $set: { ...updates, updatedAt: new Date().toISOString() } },
        { returnDocument: "after" },
      )

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error("[v0] Error updating post:", error)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }
}
