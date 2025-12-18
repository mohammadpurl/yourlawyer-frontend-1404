'use client';
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Scale } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { sendVerificationCodeAction, verifyCodeAction, resendOtpAction } from "@/app/_actions/auth-actions";
import { useSessionStore } from "@/app/_store/auth-store";
import { useConversationStore } from "@/app/_store/conversation-store";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const [step, setStep] = useState<'mobile' | 'code'>('mobile');
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const updateSession = useSessionStore(state => state.updateSession);
  const loadConversationsFromAPI = useConversationStore(state => state.loadConversationsFromAPI);

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = Date.now();
    console.log('[CLIENT] [LOGIN] handleMobileSubmit started', {
      mobile,
      timestamp: new Date().toISOString(),
    });
    
    startTransition(async () => {
      try {
        console.log('[CLIENT] [LOGIN] Calling sendVerificationCodeAction...');
        const requestStartTime = Date.now();
        const result = await sendVerificationCodeAction({ mobile });
        const requestDuration = Date.now() - requestStartTime;
        
        console.log('[CLIENT] [LOGIN] sendVerificationCodeAction completed', {
          success: result.success,
          duration: `${requestDuration}ms`,
          error: result.error,
        });
        
        if (result.success) {
          const totalDuration = Date.now() - startTime;
          console.log('[CLIENT] [LOGIN] Mobile submission successful', {
            totalDuration: `${totalDuration}ms`,
          });
          setStep('code');
          toast({
            title: "کد تأیید ارسال شد",
            description: "لطفاً کد ارسال شده را وارد کنید",
          });
        } else {
          console.error('[CLIENT] [LOGIN] Mobile submission failed', {
            error: result.error,
          });
          toast({
            title: "خطا",
            description: result.error || "خطا در ارسال کد تأیید",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        const totalDuration = Date.now() - startTime;
        console.error('[CLIENT] [LOGIN] Mobile submission error', {
          error: error?.message,
          stack: error?.stack,
          totalDuration: `${totalDuration}ms`,
        });
        toast({
          title: "خطا",
          description: error?.message || "خطا در ارسال کد تأیید",
          variant: "destructive",
        });
      }
    });
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = Date.now();
    console.log('[CLIENT] [LOGIN] handleCodeSubmit started', {
      mobile,
      codeLength: code.length,
      timestamp: new Date().toISOString(),
    });
    
    startTransition(async () => {
      try {
        console.log('[CLIENT] [LOGIN] Calling verifyCodeAction...');
        const verifyStartTime = Date.now();
        const result = await verifyCodeAction({ mobile, code });
        const verifyDuration = Date.now() - verifyStartTime;
        
        console.log('[CLIENT] [LOGIN] verifyCodeAction completed', {
          success: result.success,
          duration: `${verifyDuration}ms`,
          error: result.error,
        });
        
        if (result.success) {
          console.log('[CLIENT] [LOGIN] Updating session...');
          const sessionStartTime = Date.now();
          await updateSession();
          const sessionDuration = Date.now() - sessionStartTime;
          console.log('[CLIENT] [LOGIN] Session updated', {
            duration: `${sessionDuration}ms`,
          });
          
          console.log('[CLIENT] [LOGIN] Loading conversations...');
          const conversationsStartTime = Date.now();
          await loadConversationsFromAPI();
          const conversationsDuration = Date.now() - conversationsStartTime;
          console.log('[CLIENT] [LOGIN] Conversations loaded', {
            duration: `${conversationsDuration}ms`,
          });
          
          const totalDuration = Date.now() - startTime;
          console.log('[CLIENT] [LOGIN] Code verification successful, redirecting...', {
            totalDuration: `${totalDuration}ms`,
          });
          
          router.push('/dashboard');
          toast({
            title: "ورود موفقیت‌آمیز",
            description: "در حال انتقال به داشبورد...",
          });
        } else {
          console.error('[CLIENT] [LOGIN] Code verification failed', {
            error: result.error,
          });
          toast({
            title: "خطا",
            description: result.error || "کد تأیید نامعتبر است",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        const totalDuration = Date.now() - startTime;
        console.error('[CLIENT] [LOGIN] Code submission error', {
          error: error?.message,
          stack: error?.stack,
          totalDuration: `${totalDuration}ms`,
        });
        toast({
          title: "خطا",
          description: error?.message || "کد تأیید نامعتبر است",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center">
            <Scale className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">ورود به وکیل تو</CardTitle>
          <CardDescription>
            {step === 'mobile' 
              ? 'برای دسترسی به مشاوره حقوقی شماره موبایل خود را وارد کنید'
              : 'کد تأیید ارسال شده را وارد کنید'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'mobile' ? (
            <form onSubmit={handleMobileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">شماره موبایل</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="09123456789"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  maxLength={11}
                  className="text-right"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-primary" disabled={isPending}>
                {isPending ? 'در حال ارسال...' : 'ارسال کد تأیید'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">کد تأیید</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setStep('mobile');
                    setCode('');
                  }}
                  disabled={isPending}
                >
                  تغییر شماره موبایل
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-primary" disabled={isPending}>
                  {isPending ? 'در حال بررسی...' : 'تأیید کد'}
                </Button>
              </div>
              <button
                type="button"
                className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground underline"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await resendOtpAction({ mobile });
                    if (result.success) {
                      toast({
                        title: "کد مجدد ارسال شد",
                        description: "لطفاً کد جدید را وارد کنید",
                      });
                    } else {
                      toast({
                        title: "خطا",
                        description: result.error || "خطا در ارسال مجدد کد",
                        variant: "destructive",
                      });
                    }
                  });
                }}
              >
                ارسال مجدد کد
              </button>
            </form>
          )}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">حساب کاربری ندارید؟ </span>
            <Link href="/register" className="text-primary hover:underline font-medium">
              ثبت‌نام کنید
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

export default LoginPage;
