import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../ui-components";
import DesktopListing from "../../components/student-exam/DesktopListing";
import MobileListing from "../../components/student-exam/MobileListing";
import Dropdown from "../../ui-components/Dropdown";
import { getStudentExamsAll } from "../../api/exam.api";
import { getExamListDateRange, parseExamDateInput } from "../../components/student-exam/examListDates";
import { useAuth } from "../../store/auth.store";
import Loader from "../../ui-components/Loader";

const STATUS_OPTIONS = [
  { value: "PUBLISHED", labelKey: "studentExams.upcoming" },
  { value: "COMPLETED", labelKey: "studentExams.completed" },
  { value: "", labelKey: "studentExams.all" },
];

export default function StudentExams() {
  const { t } = useTranslation();
  const { auth } = useAuth();

  const [examData, setExamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("PUBLISHED");

  const examTypeOptions = useMemo(() => {
    const options = [{ value: "", label: t("studentExams.allTypes") }];
    if (auth?.campus?.campus_exam_types && Array.isArray(auth.campus.campus_exam_types)) {
      auth.campus.campus_exam_types.forEach((examType) => {
        const key = `studentExams.examTypes.${examType}`;
        const translated = t(key);
        options.push({ value: examType, label: translated === key ? examType : translated });
      });
    }
    return options;
  }, [auth?.campus?.campus_exam_types, t]);

  useEffect(() => {
    const fetchExams = async () => {
      if (!auth.userId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await getStudentExamsAll({
          student_id: auth.userId,
          limit: 100,
          offset: 0,
        });
        setExamData(response.data || response || []);
      } catch (err) {
        console.error("Error fetching exams:", err);
        setError(err.message || t("studentExams.fetchFailed"));
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [auth.userId, t]);

  const filteredExams = useMemo(() => {
    let filtered = [...examData];

    if (statusFilter) {
      filtered = filtered.filter((exam) => exam.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (exam) =>
          exam.examType?.toLowerCase().includes(query) ||
          exam.customExamType?.toLowerCase().includes(query) ||
          exam.class?.toLowerCase().includes(query) ||
          exam.section?.toLowerCase().includes(query)
      );
    }

    if (examTypeFilter) {
      filtered = filtered.filter((exam) => exam.examType === examTypeFilter);
    }

    filtered.sort((a, b) => {
      const startA = getExamListDateRange(a).start;
      const startB = getExamListDateRange(b).start;
      const tA = parseExamDateInput(startA)?.getTime();
      const tB = parseExamDateInput(startB)?.getTime();
      return (tA ?? Infinity) - (tB ?? Infinity);
    });

    return filtered;
  }, [examData, statusFilter, searchQuery, examTypeFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setExamTypeFilter("");
    setStatusFilter("PUBLISHED");
  };

  const hasActiveFilters = searchQuery || examTypeFilter || statusFilter !== "PUBLISHED";

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="p-6 text-center max-w-sm w-full">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-red-600 text-lg font-bold">!</span>
          </div>
          <p className="font-semibold text-gray-800 mb-1">{t("studentExams.errorLoading")}</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
          >
            {t("common.tryAgain")}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 gap-4">
      {/* Desktop Header */}
      <Card className="hidden md:block !py-3 !px-4">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t("studentExams.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Exam Type */}
          {examTypeOptions.length > 1 && (
            <div className="w-40">
              <Dropdown
                selected={examTypeFilter}
                onChange={setExamTypeFilter}
                options={examTypeOptions}
                placeholder={t("studentExams.examType")}
              />
            </div>
          )}

          {/* Status pills */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  statusFilter === opt.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>

          {/* Count + Clear */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-gray-400 whitespace-nowrap">
              {t("studentExams.examCount", { count: filteredExams.length })}
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t("studentExams.clear")}
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Mobile Header */}
      <div className="md:hidden">
        <Card className="!p-3">
          <div className="flex items-center gap-2 mb-2.5">
            {/* Status pills */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg flex-1">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === opt.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
              {filteredExams.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t("studentExams.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {examTypeOptions.length > 1 && (
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className={`relative p-2.5 rounded-lg border transition-colors ${
                  examTypeFilter
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
                aria-label={t("ui.openFilters")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {examTypeFilter && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>
            )}
          </div>
        </Card>
      </div>

      {/* Desktop Listing */}
      <div className="hidden md:block flex-1 overflow-hidden">
        <DesktopListing examList={filteredExams} />
      </div>

      {/* Mobile Listing */}
      <div className="md:hidden flex-1 overflow-hidden">
        <MobileListing examList={filteredExams} className="pb-20" />
      </div>

      {/* Filter Modal (Mobile, Exam Type only) */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden pointer-events-none">
          <div className="bg-white w-full rounded-t-2xl shadow-2xl border-t border-gray-200 flex flex-col animate-slide-up pointer-events-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">{t("studentExams.filterByType")}</h2>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-2">
              {examTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setExamTypeFilter(opt.value);
                    setIsFilterModalOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    examTypeFilter === opt.value
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {examTypeFilter && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => {
                    setExamTypeFilter("");
                    setIsFilterModalOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  {t("studentExams.clearFilter")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
