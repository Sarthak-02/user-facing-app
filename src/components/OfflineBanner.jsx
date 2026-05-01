import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function OfflineBanner() {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);

    const handleOnline = () => {
      setIsOffline(false);
      toast.success(t("offline.backOnline"), {
        description: t("offline.connectionRestored"),
        duration: 4000,
      });
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md">
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      <span>{t("offline.banner")}</span>
    </div>
  );
}
