import { useState, useEffect, useMemo } from "react";
import { Card, DateRange } from "../../ui-components";
import DesktopListing from "../../components/student-announcements/DesktopListing";
import MobileListing from "../../components/student-announcements/MobileListing";
import Dropdown from "../../ui-components/Dropdown";
import { getReceivedBroadcasts } from "../../api/broadcast.api";
import { useAuth } from "../../store/auth.store";
import Loader from "../../ui-components/Loader";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "NOTIFYING", label: "Sending" },
  { value: "DRAFT", label: "Draft" },
];

export default function Announcements() {
  const { auth } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

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

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.message?.toLowerCase().includes(q) ||
          a.senderName?.toLowerCase().includes(q) ||
          a.createdBy?.toLowerCase().includes(q)
      );
    }

    if (statusFilter?.value) {
      list = list.filter((a) => a.status === statusFilter.value);
    }

    const start = dateRangeStart ? new Date(dateRangeStart) : null;
    const end = dateRangeEnd ? new Date(dateRangeEnd) : null;
    if (start) {
      start.setHours(0, 0, 0, 0);
      list = list.filter((a) => {
        const d = new Date(a.submittedAt || a.submitted_at || a.createdAt);
        return !Number.isNaN(d.getTime()) && d >= start;
      });
    }
    if (end) {
      end.setHours(23, 59, 59, 999);
      list = list.filter((a) => {
        const d = new Date(a.submittedAt || a.submitted_at || a.createdAt);
        return !Number.isNaN(d.getTime()) && d <= end;
      });
    }

    list.sort((a, b) => {
      const ta = new Date(a.submittedAt || a.submitted_at || a.createdAt).getTime();
      const tb = new Date(b.submittedAt || b.submitted_at || b.createdAt).getTime();
      return tb - ta;
    });

    return list;
  }, [items, searchQuery, statusFilter, dateRangeStart, dateRangeEnd]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setDateRangeStart("");
    setDateRangeEnd("");
  };

  const hasActiveFilters = searchQuery || statusFilter || dateRangeStart || dateRangeEnd;

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
            <h2 className="text-xl font-semibold">Error loading announcements</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen md:min-h-screen flex flex-col p-4 gap-6">
      <Card className="hidden md:block">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="col-span-2">
              <Dropdown
                selected={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_OPTIONS}
                placeholder="Status"
              />
            </div>

            <div className="col-span-2">
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="col-span-2">
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="col-span-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="md:hidden">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className={`relative p-2 rounded-lg border transition-colors ${
                hasActiveFilters
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
              aria-label="Open filters"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>
          </div>
        </Card>
      </div>

      <div className="hidden md:block flex-1 overflow-hidden">
        <DesktopListing announcements={filtered} />
      </div>

      <div className="md:hidden flex-1 overflow-hidden">
        <MobileListing announcements={filtered} />
      </div>

      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden pointer-events-none">
          <div className="bg-white w-full rounded-t-2xl shadow-2xl border-t border-gray-200 max-h-[80vh] flex flex-col animate-slide-up pointer-events-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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

            <div className="p-4 space-y-6" style={{ minHeight: "200px" }}>
              <div className="relative z-10">
                <Dropdown
                  label="Status"
                  selected={statusFilter}
                  onChange={setStatusFilter}
                  options={STATUS_OPTIONS}
                  placeholder="All statuses"
                />
              </div>

              <div className="relative z-0">
                <DateRange
                  label="Date range"
                  startDate={dateRangeStart}
                  endDate={dateRangeEnd}
                  onStartDateChange={setDateRangeStart}
                  onEndDateChange={setDateRangeEnd}
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-2 bg-white">
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
