import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, Button } from "../../ui-components";
import DesktopListing from "../../components/homework/DesktopListing";
import MobileListing from "../../components/homework/MobileListing";
import { getStudentHomeworkAll } from "../../api/homework.api";
import { useAuth } from "../../store/auth.store";
import { HomeworkListingShimmer } from "../../ui-components/Shimmer";
import { ArrowLeft } from "lucide-react";

export default function StudentHomeworkBrowse() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const { subjectId: subjectIdParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const subjectKey = subjectIdParam || "";

  const [homeworkData, setHomeworkData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter] = useState("PUBLISHED");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchHomework = async () => {
      if (!auth.userId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await getStudentHomeworkAll({
          student_id: auth.userId,
          status: statusFilter,
          limit: 100,
          offset: 0,
        });
        setHomeworkData(response.data || response || []);
      } catch (err) {
        console.error("Error fetching homework:", err);
        setError(err.message || t("studentHomeworkBrowse.fetchFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchHomework();
  }, [auth.userId, statusFilter, t]);

  const subjectHomework = useMemo(
    () => homeworkData.filter((hw) => (hw.subject || "") === subjectKey),
    [homeworkData, subjectKey]
  );

  const filteredHomework = useMemo(() => {
    let filtered = [...subjectHomework];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (hw) =>
          (hw.title || "").toLowerCase().includes(query) ||
          (hw.description || "").toLowerCase().includes(query) ||
          (hw.subject || "").toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0);
      const dateB = new Date(b.createdAt || b.created_at || 0);
      return dateB - dateA;
    });

    return filtered;
  }, [subjectHomework, searchQuery]);

  const hasActiveFilters = !!searchQuery;

  const listFromPath = location.pathname;

  const goBack = () => navigate("/student/homework");

  if (!subjectKey) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-nav md:p-6">
        <p className="text-sm text-gray-600">{t("studentHomeworkBrowse.invalidRoute")}</p>
        <Button variant="secondary" className="mt-4 w-fit" onClick={goBack}>
          {t("common.back")}
        </Button>
      </div>
    );
  }

  if (loading) {
    return <HomeworkListingShimmer />;
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="p-6 text-center">
          <div className="mb-4 text-red-500">
            <h2 className="text-xl font-semibold">{t("studentHomeworkBrowse.errorLoadingTitle")}</h2>
          </div>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            {t("common.tryAgain")}
          </button>
        </Card>
      </div>
    );
  }

  const headerTitle = subjectKey;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-2 md:pt-3">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={goBack}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{headerTitle}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {t("studentHomeworkBrowse.assignmentCount", { count: filteredHomework.length })}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t("studentHomeworkBrowse.clearFilters")}
              </button>
            )}
          </div>
          <div className="relative max-w-sm">
            <input
              type="text"
              placeholder={t("studentHomeworkBrowse.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-9 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <button type="button" onClick={goBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">{headerTitle}</h1>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
              {filteredHomework.length}
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder={t("studentHomeworkBrowse.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-9 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="hidden md:block flex-1 overflow-hidden">
        <DesktopListing homeworkList={filteredHomework} listFromPath={listFromPath} />
      </div>

      <div className="md:hidden flex-1 overflow-hidden">
        <MobileListing homeworkList={filteredHomework} listFromPath={listFromPath} className="pb-20" />
      </div>

    </div>
  );
}
