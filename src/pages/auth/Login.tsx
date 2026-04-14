import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Lock, User, Eye, EyeOff, Library } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import Logo from "./../../assets/library-logo.png"


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

 const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await fetch("/api/Auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName: username,
        password: password,
        role: "",     
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // نصيحة: تأكدي من مخرجات السيرفر، ربما الخطأ في كلمة userName
      toast.error(data?.message || "فشل تسجيل الدخول");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("loginTime", Date.now().toString());
    toast.success("تم تسجيل الدخول بنجاح");
    navigate("/", { replace: true });

  } catch (error) {
    toast.error("خطأ في الاتصال بالسيرفر");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      <div className="absolute top-6 left-6 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md mx-4">
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl p-8 md:p-10 space-y-8">
          
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg">
              <img
                src={Logo}
                alt="شعار المكتبة"
                className="w-14 h-14 rounded-xl object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">مكتبة بلدية طولكرم</h1>
              <p className="text-sm text-muted-foreground mt-1">نظام إدارة المكتبة العامة</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-l from-border to-transparent" />
            <span className="text-xs text-muted-foreground font-medium">تسجيل الدخول</span>
            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block">اسم المستخدم</label>
              <div className="relative">
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <input
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl pr-14 pl-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block">كلمة المرور</label>
              <div className="relative">
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl pr-14 pl-12 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-sm gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  جاري الدخول...
                </span>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground">
            بلدية طولكرم — المكتبة العامة © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
