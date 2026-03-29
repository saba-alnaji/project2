import { useState } from "react";
import { Search, CheckCircle, AlertCircle, Loader2, UserCheck, ArrowLeft, ArrowRight } from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast"; // تم إضافة الاستيراد

interface Guarantor {
  id?: string;
  idnumber: string;
  firstName: string;
  fatherName?: string;
  grandfatherName?: string;
  familyName: string;
  name: string;
  job?: string;
  village?: string;
  neighborhood?: string;
  street?: string;
  phoneNumbers?: string[];
}

interface GuarantorStepProps {
  onGuarantorFound: (guarantor: Guarantor) => void;
  onGuarantorNew: (nationalId: string) => void;
  onBack: () => void;
  previousGuarantor?: any;
  previousGuarantorIsNew?: boolean;
}

export default function GuarantorCheckStep({ onGuarantorFound, onGuarantorNew, onBack, previousGuarantor, previousGuarantorIsNew }: GuarantorStepProps) {
  const { toast } = useToast(); // تفعيل التوست
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
          idnumber: String(data.IDNumber || data.idNumber || data.idnumber || ""),
          firstName: data.firstName || data.FirstName || "",
          fatherName: data.fatherName || data.FatherName || "",
          grandfatherName: data.grandfatherName || data.GrandfatherName || "",
          familyName: data.familyName || data.FamilyName || "",
          name: `${data.firstName || data.FirstName || ""} ${data.fatherName || data.FatherName || ""} ${data.familyName || data.FamilyName || ""}`.trim(),
          job: data.job || data.Job || "",
          village: data.village || data.Village || "",
          neighborhood: data.neighborhood || data.Neighborhood || "",
          street: data.street || data.Street || ""
        });
        
        // توست للنجاح
        toast({
          title: "تم العثور على الكفيل ✅",
          description: "تم استرجاع بيانات الكفيل بنجاح.",
        });
      } else {
        setNotFound(true);
      }
    } catch (err: any) {
      setSearched(true);
      if (err.response?.status === 400) {
        // بدلاً من التنبيه العادي، نستخدم التوست للخطأ
        toast({
          variant: "destructive",
          title: "خطأ في السيرفر ⚠️",
          description: "لا يمكن الوصول لقاعدة البيانات حالياً.",
        });
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

  const getPreviousDisplayName = () => {
    if (!previousGuarantor) return "";
    return previousGuarantor.name ||
      `${previousGuarantor.firstName || ""} ${previousGuarantor.familyName || ""}`.trim();
  };

  const getPreviousId = () => {
    if (!previousGuarantor) return "";
    return previousGuarantor.idnumber || "";
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
        {previousGuarantor && !searched && (
          <div className="animate-fade-in bg-primary/5 border-2 border-primary/30 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-primary shrink-0" />
              <h3 className="font-bold text-primary text-sm">بيانات الكفيل الحالية</h3>
            </div>
            <div className="bg-card rounded-xl p-3 space-y-1 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">الاسم</span>
                <span className="font-bold text-foreground text-sm">{getPreviousDisplayName()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">رقم الهوية</span>
                <span className="font-medium text-foreground text-sm" dir="ltr">{getPreviousId()}</span>
              </div>
            </div>
            <button
              onClick={() => previousGuarantorIsNew ? onGuarantorNew(getPreviousId()) : onGuarantorFound(previousGuarantor)}
              className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm flex items-center justify-center gap-2 shadow-card hover:shadow-elevated transition-all duration-200"
            >
              المتابعة بالبيانات المحفوظة
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-foreground mb-2">البحث برقم هوية كفيل آخر</label>
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
                "flex-1 px-4 py-3 rounded-xl border-2 text-base transition-all bg-card text-foreground placeholder:text-muted-foreground focus:outline-none",
                searched && (notFound || errorMessage) ? "border-destructive" : "border-border focus:border-primary"
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
            </button>
          </div>
        </div>

        {searched && found && (
          <div className="animate-fade-in bg-success-bg border-2 border-success rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-success mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-success text-base">تم العثور على:</h3>
                <p className="text-foreground font-bold">{found.name}</p>
                <p className="text-muted-foreground text-sm" dir="ltr">{found.idnumber}</p>
              </div>
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

        {errorMessage && (
          <div className="animate-fade-in bg-destructive/10 border-2 border-destructive rounded-2xl p-4 text-center">
            <p className="text-destructive font-semibold">{errorMessage}</p>
          </div>
        )}

        {searched && notFound && !errorMessage && (
          <div className="animate-fade-in bg-warning-bg border-2 border-warning rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-warning mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-warning text-base">الكفيل غير مسجل</h3>
                <p className="text-warning/70 text-sm mt-0.5">هل تريد إضافة بيانات هذا الكفيل كجديد؟</p>
              </div>
            </div>
            <button
              onClick={() => onGuarantorNew(nationalId.trim())}
              className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-orange-600 transition-all duration-200"
            >
              إضافة كفيل جديد
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>
      <button
        onClick={onBack}
        className="px-10 py-2.5 rounded-xl gradient-primary text-white font-bold flex items-center gap-2 shadow-elevated hover:shadow-accent transition-all"
      >
        <ArrowRight className="w-4 h-4" />
        السابق
      </button>
    </div>
  );
}