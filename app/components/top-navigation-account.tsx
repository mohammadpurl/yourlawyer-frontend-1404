import Image from "next/image"
import { useSessionStore } from "@/app/_store/auth-store"
import Link from "next/link"
import { Skeleton } from "./ui/skeleton"
import { useTransition } from "react"
import { signOutAction } from "@/app/_actions/auth-actions"
import { useRouter } from "next/navigation"
import { Loader2, LogOutIcon, Scale } from "lucide-react"
import { Button } from "./ui/button"

export const TopNavigationAccount = () => {
    const status = useSessionStore(state => state.status)
    const session = useSessionStore(state => state.session)
    const clearSession = useSessionStore(state => state.clearSession)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const handleSignOut = () => {
        startTransition(async () => {
            const result = await signOutAction()
            if (result?.success) {
                clearSession()
                router.push('/')
            }
        })
    }
    if (status === 'loading') {
        return <Skeleton className="w-10 h-10 rounded-full" />
    }
    console.log(status)
    return <>
     <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Scale className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary">وکیل تو</h1>
          </div>
          {status === 'unauthenticated' && (
          <div className="flex gap-3">

            <Button variant="ghost" asChild>
              <Link href="/login">ورود</Link>
            </Button>
            <Button asChild className="bg-gradient-primary">
              <Link href="/register">ثبت‌نام</Link>
            </Button>
          </div>
          )}
          {status === 'authenticated' && (
            <div className="flex items-center gap-2">
                <Image src={session?.pic || ''} className="rounded-full" alt="profile picture" width={48} height={48} />
                <p>
                    {session?.userName}
                </p>
                <div onClick={handleSignOut} className="text-muted-foreground hover:text-primary cursor-pointer">
                    {
                        isPending ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><LogOutIcon className="w-4 h-4" />خروج</>
                    }
                    </div>
                </div>
            )}
        </div>
      </header>
    
    </>
}