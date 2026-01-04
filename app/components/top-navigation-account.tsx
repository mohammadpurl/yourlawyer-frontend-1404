import Image from "next/image"
import { useSessionStore } from "@/app/_store/auth-store"
import Link from "next/link"
import { Skeleton } from "./ui/skeleton"
import { useTransition } from "react"
import { signOutAction } from "@/app/_actions/auth-actions"
import { useRouter } from "next/navigation"
import { Loader2, LogOutIcon, Scale, UserRound, UserRoundCog } from "lucide-react"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu"

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-11 w-11 rounded-full border border-border overflow-hidden shadow-sm hover:shadow-md transition"
                  aria-label="Account menu"
                >
                  {session?.pic ? (
                    <Image
                      src={session.pic}
                      className="h-full w-full object-cover"
                      alt="profile picture"
                      width={44}
                      height={44}
                    />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {(session?.userName || "؟").slice(0, 2)}
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    <span>{session?.userName || "کاربر"}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <UserRoundCog className="h-4 w-4" />
                    <span>تکمیل پروفایل</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive flex items-center gap-2"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOutIcon className="w-4 h-4" />
                  )}
                  <span>خروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
    
    </>
}