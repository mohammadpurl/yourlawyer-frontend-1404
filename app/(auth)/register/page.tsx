'use client';
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Scale } from "lucide-react";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "خطا",
        description: "رمز عبور و تکرار آن یکسان نیستند",
        variant: "destructive",
      });
      return;
    }
    // این قسمت به بک‌اند متصل می‌شود
    toast({
      title: "ثبت‌نام موفقیت‌آمیز",
      description: "حساب کاربری شما ایجاد شد",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center">
            <Scale className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">ثبت‌نام در وکیل تو</CardTitle>
          <CardDescription>
            برای شروع مشاوره حقوقی ثبت‌نام کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">نام و نام خانوادگی</Label>
              <Input
                id="name"
                type="text"
                placeholder="نام کامل خود را وارد کنید"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                placeholder="رمز عبور را وارد کنید"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="رمز عبور را مجدد وارد کنید"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="text-right"
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary">
              ثبت‌نام
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">قبلاً ثبت‌نام کرده‌اید؟ </span>
            <Link href="/login" className="text-primary hover:underline font-medium">
              وارد شوید
            </Link>
          </div>
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
