import ChatInit from "@/components/custom/ChatInit"
import Header from "@/components/custom/Header"
import { cookies } from 'next/headers'
import Link from "next/link"

const ChatDemo = async () => {
  const cookieStore = await cookies()
  const auth_token = cookieStore.get('auth_token')

  if (!auth_token) {
    return (
      <div className="w-full h-screen flex items-center justify-center flex-col gap-5">
        <p>Please login to continue</p>
        <Link href="/login" className="text-white bg-black/80 hover:bg-black duration-300 rounded-xl p-2 px-5">LOGIN</Link>
      </div>
    )
  }

  return (
    <div className="flex h-screen pb-5 flex flex-col">
      <Header title="Event Scheduler AI" />
        <ChatInit />
    </div>
  )
}

export default ChatDemo;