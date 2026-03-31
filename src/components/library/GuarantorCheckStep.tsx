import { useState } from "react";
import { Search, CheckCircle, AlertCircle, Loader2, UserCheck } from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
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
      const token = localStorage.getItem("token");
      // تم تصليح الرابط وعلامات الباكتيك هنا
      const response = await axios.get(`https://localhost:8080/api/Subscription/search-guarantor`, {
        params: { IDNumber: nationalId.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });

      setSearched(true);
      if (response.data) {
        const data = response.data;
        const mappedData = {
          id: data.id,
          idnumber: String(data.IDNumber || data.idNumber || data.idnumber || ""),
          firstName: data.firstName || "",
          familyName: data.familyName || "",
          // تم تصليح دمج النصوص هنا
          name: `${data.firstName || ""} ${data.fatherName || ""} ${data.familyName || ""}`.trim(),
        };
        setFound(mappedData as any);
        toast({ title: "تم العثور على الكفيل ✅" });
      } else {
        setNotFound(true);
      }
    } catch (err: any) {
      setSearched(true);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleNextAction = () => {
    if (found) {
      onGuarantorFound(found);
    } else if (notFound) {
      onGuarantorNew(nationalId.trim());
    } else if (previousGuarantor) {
      previousGuarantorIsNew ? onGuarantorNew(previousGuarantor.idnumber) : onGuarantorFound(previousGuarantor);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col min-h-[400px]">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-elevated">
          <UserCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">فحص الكفيل</h2>
      </div>

      <div className="max-w-lg mx-auto w-full space-y-6 flex-1">
        <div className="space-y-3">
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
              placeholder="أدخل رقم هوية الكفيل للبحث..."
              className="flex-1 px-4 py-3 rounded-xl border-2 border-border focus:border-primary focus:outline-none bg-card"
              dir="ltr"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !nationalId.trim()}
              className="px-6 rounded-xl gradient-primary text-white disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="min-h-[120px]">
          {found && (
            <div className="animate-in zoom-in-95 duration-200 bg-success/5 border-2 border-success/30 rounded-2xl p-5 flex items-center gap-4">
              <CheckCircle className="w-10 h-10 text-success" />
              <div>
                <h4 className="font-bold text-success">تم العثور على الكفيل</h4>
               <p className="text-foreground font-semibold">{found.name}</p>
<p className="text-sm text-muted-foreground">{found.idnumber}</p>
                
              </div>
            </div>
          )}

          {notFound && (
            <div className="animate-in zoom-in-95 duration-200 bg-warning/5 border-2 border-warning/30 rounded-2xl p-5 flex items-center gap-4">
              <AlertCircle className="w-10 h-10 text-warning" />
              <div>
                <h4 className="font-bold text-warning">الكفيل غير مسجل</h4>
                <p className="text-muted-foreground text-sm">سيتم نقلك لتعبئة بياناته عند الضغط على التالي</p>
              </div>
            </div>
          )}

          {!searched && previousGuarantor && (
            <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5">
              <p className="text-xs text-primary font-bold mb-1">الكفيل المختار مسبقاً:</p>
              <p className="font-bold">{previousGuarantor.name || previousGuarantor.firstName}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-5  border-border">
        <button
          onClick={onBack}
          className="px-10 py-2.5 rounded-xl gradient-primary text-white font-bold shadow-elevated disabled:opacity-30 transition-all"
        >
          السابق
        </button>

        <button
          onClick={handleNextAction}
          disabled={!found && !notFound && !previousGuarantor}
          className="px-10 py-2.5 rounded-xl gradient-primary text-white font-bold shadow-elevated disabled:opacity-30 transition-all"
        >
          التالي
        </button>
      </div>
    </div>
  );
}