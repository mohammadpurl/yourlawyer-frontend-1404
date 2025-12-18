import React from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
import { LogOut, Scale } from 'lucide-react'

const Header = () => {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
          <Scale className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-primary">وکیل تو</h1>
          <p className="text-xs text-muted-foreground">داشبورد کاربری</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/">
          <LogOut className="w-4 h-4 ml-2" />
          خروج
        </Link>
      </Button>
    </div>
  </header>
  )
}

export default Header