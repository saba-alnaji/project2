import { useState } from "react";
import axios from "axios";

export default function LoginPage() {
  const [userName, setUserName] = useState(""); // لاحظي الحرف N كبير كما في الصورة
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // الرابط من صورتك: https://localhost:8080/api/Auth/login
      const response = await axios.post(" https://localhost:8080/api/Auth/login", {
        userName, // مطابقة لطلب السيرفر في الصورة
        password
      });

      // السيرفر عادة يرجع التوكن في الـ Response
      const token = response.data.token || response.data.accessToken;
      
      if (token) {
        localStorage.setItem("token", token);
        alert("تم تسجيل الدخول بنجاح!");
        // هنا يمكنك الانتقال لصفحة إضافة المشترك
      }
   } catch (error: any) {
      // هاد السطر رح يخلينا نشوف شو المشكلة الحقيقية (قاعدة بيانات ولا يوزر غلط)
      const serverMessage = error.response?.data?.message || "فشل الدخول: تأكدي من اسم المستخدم وكلمة المرور";
      
      console.error("Full Error Details:", error.response?.data); // شوفي التفاصيل في الـ Console
      alert(serverMessage); 
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <form onSubmit={handleLogin} className="p-8 bg-white rounded-2xl shadow-xl w-96 space-y-6">
        <h2 className="text-2xl font-bold text-center text-slate-800">تسجيل الدخول</h2>
        <input 
          placeholder="اسم المستخدم (userName)" 
          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          value={userName}
          onChange={(e) => setUserName(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="كلمة المرور" 
          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">
          دخول
        </button>
      </form>
    </div>
  );
}