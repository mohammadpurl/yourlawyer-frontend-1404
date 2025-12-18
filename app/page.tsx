import Image from "next/image";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import Link from "next/link";
import { FileText, MessageSquare, Scale, Shield } from "lucide-react";
import { NotificationProvider } from "./contexts/NotificationContext";

export default function Home() {
  return (
    <NotificationProvider>
    <div className="min-h-screen">
      {/* Header */}
     

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-5xl font-bold leading-tight">
            مشاوره حقوقی هوشمند
            <span className="block text-primary mt-2">در چند ثانیه</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            پلتفرم مشاوره حقوقی آنلاین بر اساس قوانین جمهوری اسلامی ایران
            <br />
            سوالات خود را بپرسید و پاسخ تخصصی دریافت کنید
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" asChild className="bg-gradient-primary shadow-elegant">
              <Link href="/register">شروع رایگان</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">ورود به حساب</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">ویژگی‌های پلتفرم</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 space-y-4 hover:shadow-elegant transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-bold text-lg">مشاوره آنلاین</h4>
            <p className="text-muted-foreground text-sm">
              پرسش و پاسخ سریع و دقیق بر اساس قوانین کشور
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-elegant transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-bold text-lg">بررسی اسناد</h4>
            <p className="text-muted-foreground text-sm">
              آپلود و تحلیل اسناد حقوقی به صورت هوشمند
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-elegant transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-bold text-lg">امنیت بالا</h4>
            <p className="text-muted-foreground text-sm">
              حفظ محرمانگی اطلاعات و اسناد شما
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-elegant transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scale className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-bold text-lg">قوانین به‌روز</h4>
            <p className="text-muted-foreground text-sm">
              استفاده از آخرین قوانین و مقررات کشور
            </p>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">نحوه استفاده</h3>
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground mx-auto flex items-center justify-center text-2xl font-bold">
                ۱
              </div>
              <h4 className="font-bold">ثبت‌نام کنید</h4>
              <p className="text-muted-foreground text-sm">
                در پلتفرم ثبت‌نام کرده و وارد حساب کاربری خود شوید
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-secondary text-secondary-foreground mx-auto flex items-center justify-center text-2xl font-bold">
                ۲
              </div>
              <h4 className="font-bold">سوال بپرسید</h4>
              <p className="text-muted-foreground text-sm">
                سوال حقوقی خود را مطرح کرده یا اسناد خود را آپلود کنید
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-accent text-accent-foreground mx-auto flex items-center justify-center text-2xl font-bold">
                ۳
              </div>
              <h4 className="font-bold">پاسخ دریافت کنید</h4>
              <p className="text-muted-foreground text-sm">
                در چند ثانیه پاسخ تخصصی و دقیق دریافت کنید
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="p-12 text-center bg-gradient-primary text-primary-foreground shadow-elegant">
          <h3 className="text-3xl font-bold mb-4">آماده شروع هستید؟</h3>
          <p className="text-lg mb-8 opacity-90">
            همین حالا ثبت‌نام کنید و از مشاوره رایگان بهره‌مند شوید
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">شروع رایگان</Link>
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© ۱۴۰۳ وکیل تو. تمامی حقوق محفوظ است.</p>
        </div>
      </footer>
    </div>
    </NotificationProvider>
  );
}
