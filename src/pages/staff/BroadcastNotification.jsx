import { useState, useMemo, useEffect } from "react";
import { Card, Button } from "../../ui-components";
import DesktopListing from "../../components/staff-broadcast/DesktopListing";
import MobileListing from "../../components/staff-broadcast/MobileListing";
import BroadcastFormModal from "../../components/staff-broadcast/BroadcastFormModal";
import Dropdown from "../../ui-components/Dropdown";
import { createBroadcast, getBroadcastList } from "../../api/broadcast.api";
import { useAuth } from "../../store/auth.store";

export default function BroadcastPage() {
  const { auth } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mobile filter states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilterDropdown, setStatusFilterDropdown] = useState(null);
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Broadcast data states
  const [broadcastList, setBroadcastList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "DRAFT", label: "Draft" },
    { value: "NOTIFYING", label: "Notifying" },
    { value: "SUBMITTED", label: "Submitted" },
  ];

  // Filter broadcasts based on mobile filters
  const filteredBroadcasts = useMemo(() => {
    let filtered = [...broadcastList];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((broadcast) =>
        broadcast.title.toLowerCase().includes(query) ||
        broadcast.message.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilterDropdown?.value) {
      filtered = filtered.filter((broadcast) => broadcast.status === statusFilterDropdown.value);
    }

    // Date range filter
    if (dateRangeStart) {
      filtered = filtered.filter((broadcast) => new Date(broadcast.created_at || broadcast.createdAt) >= new Date(dateRangeStart));
    }
    if (dateRangeEnd) {
      filtered = filtered.filter((broadcast) => new Date(broadcast.created_at || broadcast.createdAt) <= new Date(dateRangeEnd));
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));

    return filtered;
  }, [broadcastList, searchQuery, statusFilterDropdown, dateRangeStart, dateRangeEnd]);

  const handleCreateBroadcast = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSubmitError(null);
  };

  const handleSubmitBroadcast = async (broadcastData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Transform form data to API schema
      const targets = [];

      // Build targets array based on targetType
      if (broadcastData.targetType?.value === "CAMPUS") {
        // Get campus ID from permissions
        if (auth.campus_id) {
          targets.push({
            targetType: "CAMPUS",
            targetId: auth.campus_id
          });
        }
      } else if (broadcastData.targetType?.value === "CLASS" && broadcastData.classId) {
        targets.push({
          targetType: "CLASS",
          targetId: broadcastData.classId.value
        });
      } else if (broadcastData.targetType?.value === "SECTION" && broadcastData.sectionId) {
        targets.push({
          targetType: "SECTION",
          targetId: broadcastData.sectionId.value
        });
      } else if (broadcastData.targetType?.value === "STUDENT" && broadcastData.studentId) {
        // Handle multiple students if studentId is an array
        const studentIds = Array.isArray(broadcastData.studentId)
          ? broadcastData.studentId
          : [broadcastData.studentId];

        studentIds.forEach(student => {
          targets.push({
            targetType: "STUDENT",
            targetId: student.value
          });
        });
      }

      // Transform attachments (File objects to attachment URLs)
      // TODO: Upload files first and get URLs
      const attachmentUrls = broadcastData.attachments.length > 0
        ? broadcastData.attachments.map(file => ({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: "" // TODO: Upload file first and get URL
        }))
        : undefined;

      // Prepare API payload
      const payload = {
        title: broadcastData.title,
        message: broadcastData.message,
        targets: targets,
        campusId: auth.campus_id,
        ...(attachmentUrls && { attachmentUrls })
      };

      // Call API to send broadcast immediately
      const response = await createBroadcast(payload);
      console.log("Broadcast sent successfully:", response);

      // Refresh broadcast list
      await fetchBroadcasts();

      handleCloseModal();
    } catch (error) {
      console.error("Error sending broadcast:", error);
      setSubmitError(error.message || 'Failed to send broadcast. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleApplyFilters = () => {
    setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilterDropdown(null);
    setDateRangeStart("");
    setDateRangeEnd("");
  };

  const hasActiveFilters = searchQuery || statusFilterDropdown || dateRangeStart || dateRangeEnd;

  // Fetch broadcast list
  const fetchBroadcasts = async () => {
    if (!auth.userId) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const params = {
        sourceType: "BROADCAST",
        limit: 100,
        offset: 0,
        campusId: auth.campus_id,
      };



      const data = await getBroadcastList(params);
      // Ensure data is an array - API might return { data: [] } or just []
      const broadcastArray = Array.isArray(data) ? data : (data?.data || []);

      // Client-side date filtering if needed
      let filteredArray = broadcastArray;
      if (dateRangeStart) {
        filteredArray = filteredArray.filter((broadcast) =>
          new Date(broadcast.created_at || broadcast.createdAt) >= new Date(dateRangeStart)
        );
      }
      if (dateRangeEnd) {
        filteredArray = filteredArray.filter((broadcast) =>
          new Date(broadcast.created_at || broadcast.createdAt) <= new Date(dateRangeEnd)
        );
      }

      setBroadcastList(filteredArray);
    } catch (error) {
      console.error("Error fetching broadcasts:", error);
      setLoadError(error.message || "Failed to load broadcasts. Please try again.");
      // Set empty array on error to prevent iteration errors
      setBroadcastList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch broadcasts on component mount and when filters change
  useEffect(() => {
    fetchBroadcasts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.userId, statusFilterDropdown, dateRangeStart, dateRangeEnd]);

  return (
    <div className="h-screen md:h-screen flex flex-col p-4 gap-6">
      {/* Desktop Header with Filters */}
      <Card className="hidden md:block">
        <div className="space-y-4">
          {/* Title and Create Button Row */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Broadcasts</h1>

            <Button onClick={handleCreateBroadcast}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Broadcast
            </Button>
          </div>

          {/* Search and Filters Row */}
          <div className="grid grid-cols-12 gap-4">
            {/* Search Bar */}
            <div className="col-span-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search broadcasts..."
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

            {/* Status Filter */}
            <div className="col-span-2">
              <Dropdown
                selected={statusFilterDropdown}
                onChange={setStatusFilterDropdown}
                options={statusOptions}
                placeholder="Status"
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
                  Clear
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
                placeholder="Search broadcasts..."
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
              className={`relative p-2 rounded-lg border transition-colors ${hasActiveFilters
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Loading broadcasts...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {loadError && !isLoading && (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-red-500"
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
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Error Loading Broadcasts</h3>
                <p className="text-gray-600 mt-2">{loadError}</p>
              </div>
              <Button onClick={fetchBroadcasts}>
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Desktop Listing */}
      {!isLoading && !loadError && (
        <div className="hidden md:block flex-1 min-h-0 overflow-y-auto">
          <DesktopListing
            broadcastList={filteredBroadcasts}
          />
        </div>
      )}

      {/* Mobile Listing */}
      {!isLoading && !loadError && (
        <div className="md:hidden flex-1 min-h-0 overflow-y-auto">
          <MobileListing
            broadcastList={filteredBroadcasts}
          />
        </div>
      )}

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={handleCreateBroadcast}
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 flex items-center justify-center z-40 hover:scale-110 active:scale-95"
        aria-label="Create new broadcast"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Broadcast Form Modal */}
      <BroadcastFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitBroadcast}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />

      {/* Filter Modal (Mobile Only) */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:hidden">
          <div className="bg-white w-full rounded-t-2xl max-h-[90vh] flex flex-col animate-slide-up">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Status Filter */}
              <div>
                <Dropdown
                  label="Status"
                  selected={statusFilterDropdown}
                  onChange={setStatusFilterDropdown}
                  options={statusOptions}
                  placeholder="Select status"
                />
              </div>

              {/* Date Range Filters */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created From
                  </label>
                  <input
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created To
                  </label>
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex gap-2">
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
