import { useState } from "react";
import { Search, CheckCircle, AlertCircle, Loader2, UserCheck, ArrowLeft, ArrowRight } from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";

interface Guarantor {
  id: string;
  national_id: string;
  name: string;
  job?: string;
  address?: string;
  mobile_numbers?: string[];
}

interface GuarantorStepProps {
  onGuarantorFound: (guarantor: Guarantor) => void;
  onGuarantorNew: (nationalId: string) => void;
  onBack: () => void;
  previousGuarantor?: any;
}

export default function GuarantorCheckStep({ onGuarantorFound, onGuarantorNew, onBack, previousGuarantor }: GuarantorStepProps) {
  const [nationalId, setNationalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState<Guarantor | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSearch = async () => {
    if (!nationalId.trim()) return;
    setLoading(true);
    setFound(null);
    setNotFound(false);
    setSearched(false);
    setErrorMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(`https://localhost:8080/api/Subscription/search-guarantor`, {
        params: { IDNumber: nationalId.trim() },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSearched(true);
      if (response.data) {
        const data = response.data;
        setFound({
          id: data.id,
          national_id: data.idnumber,
          name: `${data.firstName} ${data.familyName}`,
          job: data.job,
          address: data.village,
          mobile_numbers: data.phoneNumbers || [],
        });
      } else {
        setNotFound(true);
      }
    } catch (err: any) {
      console.error("Search Error:", err);
      setSearched(true);

      if (err.response?.status === 400) {
        setErrorMessage("خطأ في السيرفر: لا يمكن الوصول لقاعدة البيانات حالياً.");
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-elevated">
          <UserCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">بيانات الكفيل</h2>
        <p className="text-muted-foreground">ابحث عن كفيل موجود بالرقم الوطني</p>
      </div>

      <div className="max-w-lg mx-auto space-y-5">
        {/* مؤشر بيانات كفيل محفوظة سابقاً */}
        {previousGuarantor && !searched && (
          <div className="animate-fade-in bg-primary/5 border-2 border-primary/30 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-primary shrink-0" />
              <h3 className="font-bold text-primary text-sm">تم حفظ بيانات كفيل سابقاً</h3>
            </div>
            <div className="bg-card rounded-xl p-3 space-y-1 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">الاسم</span>
                <span className="font-bold text-foreground text-sm">
                  {previousGuarantor.name || `${previousGuarantor.first_name || ""} ${previousGuarantor.last_name || ""}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">رقم الهوية</span>
                <span className="font-medium text-foreground text-sm" dir="ltr">
                  {previousGuarantor.national_id}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onGuarantorFound(previousGuarantor)}
                className="flex-1 py-2.5 rounded-xl gradient-primary text-white font-bold text-sm flex items-center justify-center gap-2 shadow-card hover:shadow-elevated transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                المتابعة بالكفيل المحفوظ
              </button>
              <button
                onClick={() => onGuarantorNew(previousGuarantor.national_id || "")}
                className="px-4 py-2.5 rounded-xl border-2 border-primary text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/10 transition-all duration-200"
              >
                تعديل
              </button>
            </div>
          </div>
        )}

        {/* البحث */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-foreground mb-2">
            البحث برقم هوية الكفيل
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nationalId}
              onChange={(e) => {
                setNationalId(e.target.value);
                setSearched(false);
                setFound(null);
                setNotFound(false);
                setErrorMessage("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="أدخل رقم الهوية..."
              className={cn(
                "flex-1 px-4 py-3 rounded-xl border-2 text-base font-medium transition-all duration-200",
                "bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0",
                searched && found
                  ? "border-success"
                  : searched && (notFound || errorMessage)
                    ? "border-destructive"
                    : "border-border focus:border-primary"
              )}
              dir="ltr"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !nationalId.trim()}
              className={cn(
                "px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2",
                "gradient-primary text-white shadow-card hover:shadow-elevated",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? "جاري البحث..." : "بحث"}
            </button>
          </div>
        </div>

        {/* النتيجة: موجود */}
        {searched && found && (
          <div className="animate-fade-in bg-success-bg border-2 border-success rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-success mt-0.5 shrink-0" />
              <h3 className="font-bold text-success text-base">تم العثور على الكفيل في النظام</h3>
            </div>
            <div className="bg-white/70 rounded-xl p-4 space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">الاسم</span>
                <span className="font-bold text-foreground">{found.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">رقم الهوية</span>
                <span className="font-medium text-foreground" dir="ltr">{found.national_id}</span>
              </div>
            </div>
            <button
              onClick={() => onGuarantorFound(found)}
              className="w-full py-3 rounded-xl gradient-primary text-white font-bold flex items-center justify-center gap-2 shadow-elevated"
            >
              <ArrowLeft className="w-5 h-5" />
              المتابعة بهذا الكفيل
            </button>
          </div>
        )}

        {/* خطأ سيرفر */}
        {errorMessage && (
          <div className="animate-fade-in bg-destructive/10 border-2 border-destructive rounded-2xl p-4 text-center">
            <p className="text-destructive font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* النتيجة: غير موجود */}
        {searched && notFound && !errorMessage && (
          <div className="animate-fade-in bg-warning-bg border-2 border-warning rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-warning mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-warning text-base">الكفيل غير موجود في النظام</h3>
                <p className="text-warning/70 text-sm mt-0.5">يمكنك إضافة بيانات الكفيل الجديد</p>
              </div>
            </div>
            <button
              onClick={() => onGuarantorNew(nationalId.trim())}
              className="w-full py-3 rounded-xl gradient-accent text-white font-bold text-base flex items-center justify-center gap-2 shadow-accent hover:shadow-elevated transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              إدخال بيانات كفيل جديد
            </button>
          </div>
        )}

        {/* زر السابق */}
        <button
          onClick={onBack}
          className="w-full py-3 rounded-xl border-2 border-border text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-muted transition-all duration-200"
        >
          <ArrowRight className="w-5 h-5" />
          السابق
        </button>
      </div>
    </div>
  );
}
