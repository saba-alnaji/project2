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
  previousGuarantorIsNew?: boolean;
}

export default function GuarantorCheckStep({ onGuarantorFound, onGuarantorNew, onBack, previousGuarantor, previousGuarantorIsNew }: GuarantorStepProps) {
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
        headers: { Authorization: `Bearer ${token}` },
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
        <p className="text-muted-foreground text-sm">ابحث عن كفيل موجود بالرقم الوطني</p>
      </div>

      <div className="max-w-lg mx-auto space-y-6">
        {/* مؤشر بيانات كفيل محفوظة سابقاً (تمت إزالة زر التعديل) */}
        {previousGuarantor && !searched && (
          <div className="animate-fade-in bg-primary/5 border-2 border-primary/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-primary shrink-0" />
              <h3 className="font-bold text-primary text-sm">بيانات الكفيل الحالية</h3>
            </div>
            <div className="bg-card rounded-xl p-4 space-y-2 mb-5 shadow-sm border border-primary/10">
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
            <button
              onClick={() => previousGuarantorIsNew ? onGuarantorNew(previousGuarantor.national_id || "") : onGuarantorFound(previousGuarantor)}
              className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm flex items-center justify-center gap-2 shadow-card hover:shadow-elevated transition-all duration-200"
            >
              المتابعة بالبيانات المحفوظة
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* حقل البحث */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-foreground mb-1">البحث برقم هوية كفيل آخر</label>
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
                "flex-1 px-4 py-3 rounded-xl border-2 text-base transition-all bg-card",
                searched && (notFound || errorMessage) ? "border-destructive" : "border-border focus:border-primary"
              )}
              dir="ltr"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !nationalId.trim()}
              className="px-6 py-3 rounded-xl gradient-primary text-white font-bold shadow-card disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* النتيجة: موجود */}
        {searched && found && (
          <div className="animate-fade-in bg-success-bg border-2 border-success rounded-2xl p-5">
            <div className="bg-white/70 rounded-xl p-4 mb-4 shadow-sm">
              <p className="text-xs text-muted-foreground mb-1">تم العثور على:</p>
              <p className="font-bold text-foreground text-lg">{found.name}</p>
              <p className="text-sm text-muted-foreground" dir="ltr">{found.national_id}</p>
            </div>
            <button
              onClick={() => onGuarantorFound(found)}
              className="w-full py-3 rounded-xl gradient-primary text-white font-bold flex items-center justify-center gap-2"
            >
              المتابعة بهذا الكفيل
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* النتيجة: غير موجود */}
        {searched && notFound && !errorMessage && (
          <div className="animate-fade-in bg-warning-bg border-2 border-warning rounded-2xl p-5 text-center">
            <AlertCircle className="w-10 h-10 text-warning mx-auto mb-3" />
            <h3 className="font-bold text-warning mb-1">الكفيل غير مسجل</h3>
            <p className="text-warning/80 text-sm mb-4">هل تريد إضافة بيانات هذا الكفيل كجديد؟</p>
            <button
              onClick={() => onGuarantorNew(nationalId.trim())}
              className="w-full py-3 rounded-xl gradient-accent text-white font-bold flex items-center justify-center gap-2 shadow-accent"
            >
              إضافة كفيل جديد
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        )}

        
      </div>
      {/* زر الرجوع للخلف */}
        <div className="pt-4 ">

          <button
            onClick={onBack}
            className="px-10 py-2.5 rounded-xl gradient-primary text-white font-bold flex items-center gap-2 shadow-elevated hover:shadow-accent transition-all">
            <ArrowRight className="w-5 h-5" /> السابق

          </button>
        </div>
    </div>
  );
}