import PostList from "@/components/lists/PostList";
import { fetchPosts } from "@/lib/actions/thread.actions"
import { currentUser } from "@clerk/nextjs";

export default async function Home() {

  const user = await currentUser()
  if (!user) return null

  return (
    <>
      <h1 className="head-text text-left">Home</h1>

      <PostList
        userId={user?.id ?? ''}
      />
    </>
  )
}