import { useState } from "react";
import { Search, CheckCircle, AlertCircle, Loader2, UserCheck, UserPlus, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
}

export default function GuarantorCheckStep({ onGuarantorFound, onGuarantorNew }: GuarantorStepProps) {
  const [nationalId, setNationalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState<Guarantor | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!nationalId.trim()) return;
    setLoading(true);
    setFound(null);
    setNotFound(false);
    setSearched(false);

    try {
      const { data, error } = await supabase
        .from("guarantors")
        .select("*")
        .eq("national_id", nationalId.trim())
        .maybeSingle();

      if (error) throw error;

      setSearched(true);
      if (data) {
        setFound(data);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Error searching guarantor:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleContinueWithExisting = () => {
    if (found) onGuarantorFound(found);
  };

  const handleAddNew = () => {
    onGuarantorNew(nationalId.trim());
  };

  const handleNewGuarantorDirect = () => {
    onGuarantorNew("");
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-elevated">
          <UserCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">بيانات الكفيل</h2>
        <p className="text-muted-foreground">ابحث عن كفيل موجود أو أضف كفيل جديد</p>
      </div>

      {/* Two action buttons */}
      <div className="max-w-lg mx-auto space-y-5">
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
              }}
              onKeyDown={handleKeyDown}
              placeholder="أدخل رقم الهوية..."
              className={cn(
                "flex-1 px-4 py-3 rounded-xl border-2 text-base font-medium transition-all duration-200",
                "bg-card text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-0",
                searched && found ? "border-success" : "",
                searched && notFound ? "border-warning" : "",
                !searched ? "border-border focus:border-primary" : ""
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

        {/* Divider with "أو" */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm font-medium">أو</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* New Guarantor button */}
        <button
          onClick={handleNewGuarantorDirect}
          className="w-full py-3 rounded-xl border-2 border-accent text-accent font-bold text-base flex items-center justify-center gap-2 hover:bg-accent/10 transition-all duration-200"
        >
          <UserPlus className="w-5 h-5" />
          إضافة كفيل جديد
        </button>

        {/* Result: Found */}
        {searched && found && (
          <div className="animate-fade-in bg-success-bg border-2 border-success rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-success mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-success text-base">تم العثور على الكفيل في النظام</h3>
                <p className="text-success/70 text-sm mt-0.5">سيتم استخدام البيانات المحفوظة مسبقاً</p>
              </div>
            </div>

            <div className="bg-white/70 rounded-xl p-4 space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">الاسم</span>
                <span className="font-bold text-foreground">{found.name}</span>
              </div>
              {found.job && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">الوظيفة</span>
                  <span className="font-medium text-foreground">{found.job}</span>
                </div>
              )}
              {found.address && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">العنوان</span>
                  <span className="font-medium text-foreground">{found.address}</span>
                </div>
              )}
              {found.mobile_numbers && found.mobile_numbers.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">الموبايل</span>
                  <span className="font-medium text-foreground" dir="ltr">{found.mobile_numbers[0]}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">رقم الهوية</span>
                <span className="font-medium text-foreground" dir="ltr">{found.national_id}</span>
              </div>
            </div>

            <button
              onClick={handleContinueWithExisting}
              className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-base flex items-center justify-center gap-2 shadow-elevated hover:shadow-accent transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              المتابعة بهذا الكفيل
            </button>
          </div>
        )}

        {/* Result: Not Found */}
        {searched && notFound && (
          <div className="animate-fade-in bg-warning-bg border-2 border-warning rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-warning mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-warning text-base">الكفيل غير موجود في النظام</h3>
                <p className="text-warning/70 text-sm mt-0.5">يجب إدخال بيانات الكفيل الجديد</p>
              </div>
            </div>

            <button
              onClick={handleAddNew}
              className="w-full py-3 rounded-xl gradient-accent text-white font-bold text-base flex items-center justify-center gap-2 shadow-accent hover:shadow-elevated transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              إدخال بيانات كفيل جديد
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
