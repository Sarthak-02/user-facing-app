import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../ui-components";
import DesktopListing from "../../components/student-announcements/DesktopListing";
import MobileListing from "../../components/student-announcements/MobileListing";
import { getReceivedBroadcasts } from "../../api/broadcast.api";
import { useAuth } from "../../store/auth.store";
import Loader from "../../ui-components/Loader";
import { ANNOUNCEMENT_CATEGORY_OPTIONS } from "../../constants/announcementCategories";

export default function Announcements() {
  const { t } = useTranslation();
  const { auth } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categoryFilter, setCategoryFilter] = useState("");

  const categoryTabs = [
    { value: "", label: t("studentAnnouncements.categoryAll") },
    ...ANNOUNCEMENT_CATEGORY_OPTIONS,
  ];

  useEffect(() => {
    const load = async () => {
      if (!auth.userId) return;

      setLoading(true);
      setError(null);
      try {
        const res = await getReceivedBroadcasts(auth.userId);
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setItems(list);
      } catch (err) {
        console.error("Error fetching announcements:", err);
        setError(err.message || "Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auth.userId]);

  const filtered = useMemo(() => {
    let list = [...items];

    if (categoryFilter) {
      list = list.filter(
        (a) => (a.category || a.announcementCategory) === categoryFilter
      );
    }

    list.sort((a, b) => {
      const ta = new Date(a.submittedAt || a.submitted_at || a.createdAt).getTime();
      const tb = new Date(b.submittedAt || b.submitted_at || b.createdAt).getTime();
      return tb - ta;
    });

    return list;
  }, [items, categoryFilter]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold">{t("studentAnnouncements.errorLoading")}</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {t("common.tryAgain")}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen md:min-h-screen flex flex-col p-4 gap-4">
      {/* Desktop Header */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("nav.announcements")}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {t("studentAnnouncements.count", { count: filtered.length })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {categoryTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setCategoryFilter(tab.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                categoryFilter === tab.value
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">{t("nav.announcements")}</h1>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {categoryTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setCategoryFilter(tab.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === tab.value
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden md:block flex-1 overflow-hidden">
        <DesktopListing announcements={filtered} />
      </div>

      <div className="md:hidden flex-1 overflow-hidden">
        <MobileListing announcements={filtered} className="pb-28" />
      </div>
    </div>
  );
}
