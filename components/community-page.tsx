"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Pin, Heart, MessageCircle, Trash2, Send, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/types/user"
import type { CommunityPost } from "@/types/community"
import type { Language } from "@/lib/translations"
import { translations } from "@/lib/translations"

interface CommunityPageProps {
  language: Language
  currentUser: User
  onBack: () => void
}

export function CommunityPage({ language, currentUser, onBack }: CommunityPageProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostTitle, setNewPostTitle] = useState("")
  const { toast } = useToast()
  const t = translations[language]

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const response = await fetch("/api/community/posts")
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error("[v0] Error loading posts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePost = async () => {
    const content = newPostContent.trim()
    if (!content) return

    try {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          title: newPostTitle.trim(),
          content,
          isAdmin: currentUser.isAdmin || false,
        }),
      })

      if (response.ok) {
        setNewPostContent("")
        setNewPostTitle("")
        setShowCreatePost(false)
        await loadPosts()
        toast({
          title: language === "uz" ? "Post yaratildi" : language === "ru" ? "Пост создан" : "Post created",
        })
      }
    } catch (error) {
      console.error("[v0] Error creating post:", error)
    }
  }

  const handleDeletePost = async (postId: number) => {
    try {
      await fetch(`/api/community/posts?postId=${postId}&userId=${currentUser.id}`, {
        method: "DELETE",
      })
      await loadPosts()
      toast({
        title: language === "uz" ? "Post o'chirildi" : language === "ru" ? "Пост удален" : "Post deleted",
      })
    } catch (error) {
      console.error("[v0] Error deleting post:", error)
    }
  }

  const handleAddComment = async (postId: number) => {
    const content = commentInputs[postId]?.trim()
    if (!content) return

    try {
      const response = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          content,
        }),
      })

      if (response.ok) {
        setCommentInputs({ ...commentInputs, [postId]: "" })
        await loadPosts()
        toast({
          title: language === "uz" ? "Fikr qo'shildi" : language === "ru" ? "Комментарий добавлен" : "Comment added",
        })
      } else if (response.status === 429) {
        toast({
          title: language === "uz" ? "Spam!" : "Spam!",
          description:
            language === "uz"
              ? "Juda ko'p fikr. Iltimos biroz kuting."
              : language === "ru"
                ? "Слишком много комментариев. Подождите."
                : "Too many comments. Please wait.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error adding comment:", error)
    }
  }

  const handleDeleteComment = async (postId: number, commentId: number) => {
    try {
      await fetch(`/api/community/comments?postId=${postId}&commentId=${commentId}&userId=${currentUser.id}`, {
        method: "DELETE",
      })
      await loadPosts()
      toast({
        title: language === "uz" ? "Fikr o'chirildi" : language === "ru" ? "Комментарий удален" : "Comment deleted",
      })
    } catch (error) {
      console.error("[v0] Error deleting comment:", error)
    }
  }

  const handleToggleReaction = async (postId: number) => {
    try {
      await fetch("/api/community/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          userId: currentUser.id,
          type: "heart",
        }),
      })
      await loadPosts()
    } catch (error) {
      console.error("[v0] Error toggling reaction:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return language === "uz" ? "Hozir" : language === "ru" ? "Только что" : "Just now"
    if (minutes < 60)
      return `${minutes} ${language === "uz" ? "daqiqa oldin" : language === "ru" ? "мин. назад" : "min ago"}`
    if (hours < 24) return `${hours} ${language === "uz" ? "soat oldin" : language === "ru" ? "ч. назад" : "h ago"}`
    if (days < 7) return `${days} ${language === "uz" ? "kun oldin" : language === "ru" ? "д. назад" : "d ago"}`

    return date.toLocaleDateString(language === "uz" ? "uz-UZ" : language === "ru" ? "ru-RU" : "en-US")
  }

  // const getUserAvatar = (userName: string | null, userAvatar?: string) => {
  //   if (userAvatar) {
  //     return <img src={userAvatar || "/placeholder.svg"} alt="" className="w-full h-full rounded-full object-cover" />
  //   }
  //   const initials = userName
  //     .split(" ")
  //     .map((n) => n[0])
  //     .join("")
  //     .toUpperCase()
  //     .substring(0, 2)
  //   return <span className="text-sm font-bold">{initials}</span>
  // }
  const getUserAvatar = (userName?: string | null, userAvatar?: string) => {
  if (userAvatar) {
    return (
      <img
        src={userAvatar || "/placeholder.svg"}
        alt=""
        className="w-full h-full rounded-full object-cover"
      />
    )
  }

  if (!userName || typeof userName !== "string") {
    return <span className="text-sm font-bold">?</span>
  }

  const initials = userName
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return <span className="text-sm font-bold">{initials || "?"}</span>
}

  const pinnedPost = posts.find((p) => p.isPinned)
  const regularPosts = posts.filter((p) => !p.isPinned)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Community</h1>
          </div>

          <Button onClick={() => setShowCreatePost(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {language === "uz" ? "Post yaratish" : language === "ru" ? "Создать пост" : "Create Post"}
          </Button>
        </div>

        {showCreatePost && (
          <Card className="p-6 mb-6 border-2 border-blue-500/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {language === "uz" ? "Yangi post" : language === "ru" ? "Новый пост" : "New Post"}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowCreatePost(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <Input
                placeholder={
                  language === "uz"
                    ? "Sarlavha (ixtiyoriy)"
                    : language === "ru"
                      ? "Заголовок (необязательно)"
                      : "Title (optional)"
                }
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
              />
              <Textarea
                placeholder={
                  language === "uz"
                    ? "Nima haqida o'ylayapsiz?"
                    : language === "ru"
                      ? "О чем вы думаете?"
                      : "What's on your mind?"
                }
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[120px]"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                  {language === "uz" ? "Bekor qilish" : language === "ru" ? "Отмена" : "Cancel"}
                </Button>
                <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                  {language === "uz" ? "Joylash" : language === "ru" ? "Опубликовать" : "Post"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {language === "uz" ? "Yuklanmoqda..." : language === "ru" ? "Загрузка..." : "Loading..."}
          </div>
        ) : (
          <>
            {/* Pinned Post */}
            {pinnedPost && (
              <Card className="p-6 mb-6 border-2 border-purple-500/50 bg-purple-500/5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    {getUserAvatar(pinnedPost.adminName, pinnedPost.adminAvatar)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{pinnedPost.adminName}</span>
                      {pinnedPost.isAdminPost && (
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">Admin</span>
                      )}
                      <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full flex items-center gap-1">
                        <Pin className="h-3 w-3" /> PIN
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(pinnedPost.createdAt)}</span>
                  </div>
                  {(pinnedPost.userId === currentUser.id || currentUser.isAdmin) && (
                    <Button variant="ghost" size="icon" onClick={() => handleDeletePost(pinnedPost.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>

                {pinnedPost.title && <h3 className="text-lg font-bold mb-2">{pinnedPost.title}</h3>}
                <p className="text-sm mb-4 whitespace-pre-wrap">{pinnedPost.content}</p>

                {pinnedPost.imageUrl && (
                  <img
                    src={pinnedPost.imageUrl || "/placeholder.svg"}
                    alt=""
                    className="rounded-lg mb-4 max-h-96 w-full object-cover"
                  />
                )}

                {/* Comments */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={() => handleToggleReaction(pinnedPost.id)}
                      className="flex items-center gap-1 text-sm hover:text-red-500 transition-colors"
                    >
                      <Heart
                        className={`h-4 w-4 ${pinnedPost.reactions?.some((r) => r.userId === currentUser.id) ? "fill-red-500 text-red-500" : ""}`}
                      />
                      <span>{pinnedPost.reactions?.length || 0}</span>
                    </button>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      <span>{pinnedPost.comments?.length || 0}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {pinnedPost.comments?.map((comment) => (
                      <div key={comment.id} className="flex gap-2 items-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          {getUserAvatar(comment.userName, comment.userAvatar)}
                        </div>
                        <div className="flex-1 bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{comment.userName}</span>
                            {(comment.userId === currentUser.id || currentUser.isAdmin) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleDeleteComment(pinnedPost.id, comment.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm">{comment.content}</p>
                          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      placeholder={
                        language === "uz"
                          ? "Fikringizni bildiring..."
                          : language === "ru"
                            ? "Ваше мнение..."
                            : "Your comment..."
                      }
                      value={commentInputs[pinnedPost.id] || ""}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [pinnedPost.id]: e.target.value })}
                      className="min-h-[80px]"
                    />
                    <Button onClick={() => handleAddComment(pinnedPost.id)} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Regular Posts */}
            <div className="space-y-4">
              {regularPosts.length === 0 && !pinnedPost && (
                <div className="text-center py-12 text-muted-foreground">
                  {language === "uz" ? "Hali postlar yo'q" : language === "ru" ? "Пока нет постов" : "No posts yet"}
                </div>
              )}

              {regularPosts.map((post) => (
                <Card key={post.id} className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      {getUserAvatar(post.adminName, post.adminAvatar)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{post.adminName}</span>
                        {post.isAdminPost && (
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">Admin</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</span>
                    </div>
                    {(post.userId === currentUser.id || currentUser.isAdmin) && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeletePost(post.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  {post.title && <h3 className="text-lg font-bold mb-2">{post.title}</h3>}
                  <p className="text-sm mb-4 whitespace-pre-wrap">{post.content}</p>

                  {post.imageUrl && (
                    <img
                      src={post.imageUrl || "/placeholder.svg"}
                      alt=""
                      className="rounded-lg mb-4 max-h-96 w-full object-cover"
                    />
                  )}

                  {/* Comments section - same as pinned post */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center gap-4 mb-4">
                      <button
                        onClick={() => handleToggleReaction(post.id)}
                        className="flex items-center gap-1 text-sm hover:text-red-500 transition-colors"
                      >
                        <Heart
                          className={`h-4 w-4 ${post.reactions?.some((r) => r.userId === currentUser.id) ? "fill-red-500 text-red-500" : ""}`}
                        />
                        <span>{post.reactions?.length || 0}</span>
                      </button>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments?.length || 0}</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      {post.comments?.map((comment) => (
                        <div key={comment.id} className="flex gap-2 items-start">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            {getUserAvatar(comment.userName, comment.userAvatar)}
                          </div>
                          <div className="flex-1 bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{comment.userName}</span>
                              {(comment.userId === currentUser.id || currentUser.isAdmin) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleDeleteComment(post.id, comment.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm">{comment.content}</p>
                            <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Textarea
                        placeholder={
                          language === "uz"
                            ? "Fikringizni bildiring..."
                            : language === "ru"
                              ? "Ваше мнение..."
                              : "Your comment..."
                        }
                        value={commentInputs[post.id] || ""}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        className="min-h-[80px]"
                      />
                      <Button onClick={() => handleAddComment(post.id)} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
