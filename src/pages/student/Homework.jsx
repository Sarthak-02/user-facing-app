import { useState, useEffect, useMemo } from "react";
import { Card, DateRange } from "../../ui-components";
import DesktopListing from "../../components/homework/DesktopListing";
import MobileListing from "../../components/homework/MobileListing";
import Dropdown from "../../ui-components/Dropdown";
import { getStudentHomeworkAll } from "../../api/homework.api";
import { useAuth } from "../../store/auth.store";
import Loader from "../../ui-components/Loader";

export default function Homework() {
  const { auth } = useAuth();
  
  // Data states
  const [homeworkData, setHomeworkData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [statusFilter] = useState("PUBLISHED");
  
  // Filter states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  
  // Fetch homework data
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
        
        // Add date filters if set
        if (dateRangeStart) {
          params.start_date = dateRangeStart;
        }
        if (dateRangeEnd) {
          params.end_date = dateRangeEnd;
        }
        
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

  // Extract unique subjects from homework data
  const subjects = useMemo(() => {
    const uniqueSubjects = [...new Set(homeworkData.map(hw => hw.subject))];
    return [
      { value: "", label: "All Subjects" },
      ...uniqueSubjects.map(subject => ({ value: subject, label: subject })),
    ];
  }, [homeworkData]);

  // Filter homework based on client-side filters
  const filteredHomework = useMemo(() => {
    let filtered = [...homeworkData];

    // Search query filter (client-side)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((hw) => 
        hw.title?.toLowerCase().includes(query) ||
        hw.description?.toLowerCase().includes(query) ||
        hw.subject?.toLowerCase().includes(query)
      );
    }

    // Subject filter (client-side)
    if (subjectFilter) {
      filtered = filtered.filter((hw) => hw.subject === subjectFilter);
    }

    // Sort by due date (earliest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.due_date || a.dueDate);
      const dateB = new Date(b.due_date || b.dueDate);
      return dateA - dateB;
    });

    return filtered;
  }, [homeworkData, searchQuery, subjectFilter]);

  const handleApplyFilters = () => {
    setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSubjectFilter("");
    setDateRangeStart("");
    setDateRangeEnd("");
  };

  const hasActiveFilters = searchQuery || subjectFilter || dateRangeStart || dateRangeEnd;

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Error state
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
            <h2 className="text-xl font-semibold">Error Loading Homework</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
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
      {/* Desktop Header with Filters */}
      <Card className="hidden md:block">
        <div className="space-y-4">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Homework</h1>
          </div>

          {/* Search and Filters Row */}
          <div className="grid grid-cols-12 gap-4">
            {/* Search Bar */}
            <div className="col-span-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search homework..."
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

            {/* Subject Filter */}
            <div className="col-span-2">
              <Dropdown
                selected={subjectFilter}
                onChange={setSubjectFilter}
                options={subjects}
                placeholder="Subject"
              />
            </div>

            {/* Date Range Start */}
            <div className="col-span-2">
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                placeholder="From Date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Range End */}
            <div className="col-span-2">
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                placeholder="To Date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Clear Filters Button */}
            <div className="col-span-2">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Mobile Header */}
      <div className="md:hidden">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search homework..."
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

            {/* Filter Button */}
            <button
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
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        </Card>
      </div>

      {/* Desktop Listing */}
      <div className="hidden md:block flex-1 overflow-hidden">
        <DesktopListing homeworkList={filteredHomework} />
      </div>

      {/* Mobile Listing */}
      <div className="md:hidden flex-1 overflow-hidden">
        <MobileListing homeworkList={filteredHomework} />
      </div>

      {/* Filter Modal (Mobile Only) - No dark background */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden pointer-events-none">
          <div className="bg-white w-full rounded-t-2xl shadow-2xl border-t border-gray-200 max-h-[80vh] flex flex-col animate-slide-up pointer-events-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
              <button
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

            {/* Modal Content */}
            <div className="p-4 space-y-6" style={{ minHeight: '200px' }}>
              {/* Subject Filter */}
              <div className="relative z-10">
                <Dropdown
                  label="Subject"
                  selected={subjectFilter}
                  onChange={setSubjectFilter}
                  options={subjects}
                  placeholder="Select subject"
                />
              </div>

              {/* Date Range Filters */}
              <div className="relative z-0">
                <DateRange
                  label="Due Date Range"
                  startDate={dateRangeStart}
                  endDate={dateRangeEnd}
                  onStartDateChange={setDateRangeStart}
                  onEndDateChange={setDateRangeEnd}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex gap-2 bg-white">
              <button
                onClick={handleClearFilters}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
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
