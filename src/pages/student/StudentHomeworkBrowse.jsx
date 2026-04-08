import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, DateRange, Button } from "../../ui-components";
import DesktopListing from "../../components/homework/DesktopListing";
import MobileListing from "../../components/homework/MobileListing";
import { getStudentHomeworkAll } from "../../api/homework.api";
import { useAuth } from "../../store/auth.store";
import Loader from "../../ui-components/Loader";
import { ArrowLeft } from "lucide-react";

export default function StudentHomeworkBrowse() {
  const { auth } = useAuth();
  const { subjectId: subjectIdParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const subjectKey = subjectIdParam || "";

  const [homeworkData, setHomeworkData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter] = useState("PUBLISHED");

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempDateRangeStart, setTempDateRangeStart] = useState("");
  const [tempDateRangeEnd, setTempDateRangeEnd] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

  useEffect(() => {
    const fetchHomework = async () => {
      if (!auth.userId) return;

      setLoading(true);
      setError(null);

      try {
        const params = {
          student_id: auth.userId,
          status: statusFilter,
          limit: 100,
          offset: 0,
        };
        if (dateRangeStart) params.start_date = dateRangeStart;
        if (dateRangeEnd) params.end_date = dateRangeEnd;

        const response = await getStudentHomeworkAll(params);
        setHomeworkData(response.data || response || []);
      } catch (err) {
        console.error("Error fetching homework:", err);
        setError(err.message || "Failed to fetch homework");
      } finally {
        setLoading(false);
      }
    };

    fetchHomework();
  }, [auth.userId, statusFilter, dateRangeStart, dateRangeEnd]);

  useEffect(() => {
    if (isFilterModalOpen) {
      setTempDateRangeStart(dateRangeStart);
      setTempDateRangeEnd(dateRangeEnd);
    }
  }, [isFilterModalOpen, dateRangeStart, dateRangeEnd]);

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
      const dateA = new Date(a.due_date || a.dueDate);
      const dateB = new Date(b.due_date || b.dueDate);
      return dateA - dateB;
    });

    return filtered;
  }, [subjectHomework, searchQuery]);

  const handleApplyFilters = () => {
    setDateRangeStart(tempDateRangeStart);
    setDateRangeEnd(tempDateRangeEnd);
    setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setTempDateRangeStart("");
    setTempDateRangeEnd("");
    setDateRangeStart("");
    setDateRangeEnd("");
  };

  const hasActiveFilters = searchQuery || dateRangeStart || dateRangeEnd;

  const listFromPath = location.pathname;

  const goBack = () => navigate("/student/homework");

  if (!subjectKey) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <p className="text-sm text-gray-600">Invalid homework route.</p>
        <Button variant="secondary" className="mt-4 w-fit" onClick={goBack}>
          Back
        </Button>
      </div>
    );
  }

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
          <div className="mb-4 text-red-500">
            <h2 className="text-xl font-semibold">Error Loading Homework</h2>
          </div>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  const headerTitle = subjectKey;

  return (
    <div className="h-screen md:min-h-screen flex flex-col gap-3 px-4 pb-4 pt-2 md:pt-3">
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
                {filteredHomework.length} {filteredHomework.length === 1 ? "assignment" : "assignments"}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search homework..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-9 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
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
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search homework..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-9 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className={`relative p-2.5 rounded-lg border transition-colors ${
                hasActiveFilters
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
              aria-label="Open filters"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:block flex-1 overflow-hidden">
        <DesktopListing homeworkList={filteredHomework} listFromPath={listFromPath} />
      </div>

      <div className="md:hidden flex-1 overflow-hidden">
        <MobileListing homeworkList={filteredHomework} listFromPath={listFromPath} />
      </div>

      {isFilterModalOpen && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-end pb-14 md:hidden">
          <div className="pointer-events-auto flex max-h-[80vh] w-full flex-col rounded-t-2xl border-t border-gray-200 bg-white shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="rounded-lg p-2 hover:bg-gray-100"
                aria-label="Close filters"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="min-h-[200px] space-y-6 p-4">
              <DateRange
                label="Due Date Range"
                startDate={tempDateRangeStart}
                endDate={tempDateRangeEnd}
                onStartDateChange={setTempDateRangeStart}
                onEndDateChange={setTempDateRangeEnd}
              />
            </div>
            <div className="flex gap-2 border-t border-gray-200 bg-white p-4">
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex-1 rounded-lg bg-gray-100 py-3 font-medium text-gray-700 hover:bg-gray-200"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="flex-1 rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
