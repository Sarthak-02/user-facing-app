import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, Button } from "../../ui-components";
import { BroadcastListShimmer } from "../../ui-components/Shimmer";
import DesktopListing from "../../components/staff-broadcast/DesktopListing";
import MobileListing from "../../components/staff-broadcast/MobileListing";
import BroadcastFormModal from "../../components/staff-broadcast/BroadcastFormModal";
import { createBroadcast, getBroadcastList, getAttachmentUploadUrl } from "../../api/broadcast.api";
import { useAuth } from "../../store/auth.store";
import { ANNOUNCEMENT_CATEGORY_OPTIONS } from "../../constants/announcementCategories";

export default function BroadcastPage() {
  const { t } = useTranslation();
  const { auth } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [formModalKey, setFormModalKey] = useState(0);

  const [categoryFilter, setCategoryFilter] = useState("");

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Broadcast data states
  const [broadcastList, setBroadcastList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const categoryTabs = [
    { value: "", labelKey: "studentAnnouncements.categoryAll" },
    ...ANNOUNCEMENT_CATEGORY_OPTIONS.map((o) => ({ value: o.value, labelKey: o.labelKey })),
  ];

  const filteredBroadcasts = useMemo(() => {
    let filtered = [...broadcastList];

    if (categoryFilter) {
      filtered = filtered.filter(
        (broadcast) => (broadcast.category || broadcast.announcementCategory) === categoryFilter
      );
    }

    filtered.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));

    return filtered;
  }, [broadcastList, categoryFilter]);

  const handleCreateBroadcast = () => {
    setSelectedBroadcast(null);
    setFormModalKey((k) => k + 1);
    setIsModalOpen(true);
  };

  const handleSelectBroadcast = (broadcast) => {
    setSelectedBroadcast(broadcast);
    setFormModalKey((k) => k + 1);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBroadcast(null);
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
      } else if (broadcastData.targetType?.value === "GROUP" && broadcastData.groupId?.value) {
        targets.push({
          targetType: "GROUP",
          targetId: broadcastData.groupId.value
        });
      }

      // Upload attachments to GCS via signed URLs, then collect metadata
      let attachmentUrls;
      if (broadcastData.attachments.length > 0) {
        attachmentUrls = await Promise.all(
          broadcastData.attachments.map(async (file) => {
            const { uploadUrl, publicUrl } = await getAttachmentUploadUrl({
              file_name: file.name,
              mime_type: file.type,
              campus_id: auth.campus_id,
            });
            const uploadRes = await fetch(uploadUrl, {
              method: "PUT",
              body: file,
              headers: { "Content-Type": file.type },
            });
            if (!uploadRes.ok) throw new Error(t("broadcast.uploadFileFailed", { fileName: file.name }));
            return {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              fileUrl: publicUrl,
            };
          })
        );
      }

      // Prepare API payload
      const payload = {
        title: broadcastData.title,
        message: broadcastData.message,
        category: broadcastData.category?.value || "general",
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
      setSubmitError(error.message || t("broadcast.sendFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };



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
      const broadcastArray = Array.isArray(data) ? data : (data?.data || []);
      setBroadcastList(broadcastArray);
    } catch (error) {
      console.error("Error fetching broadcasts:", error);
      setLoadError(error.message || t("broadcast.loadListFailed"));
      setBroadcastList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.userId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 gap-6">
      {/* Desktop Header with Filters */}
      <Card className="hidden md:block">
        <div className="space-y-4">
          {/* Title and Create Button Row */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{t("broadcast.myBroadcasts")}</h1>

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
              {t("broadcast.createBroadcast")}
            </Button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {categoryTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setCategoryFilter(tab.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === tab.value
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Mobile Header */}
      <div className="md:hidden">
        <Card className="p-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {categoryTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setCategoryFilter(tab.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === tab.value
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && <BroadcastListShimmer />}

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
                <h3 className="text-lg font-semibold text-gray-900">{t("broadcast.errorLoadingTitle")}</h3>
                <p className="text-gray-600 mt-2">{loadError}</p>
              </div>
              <Button onClick={fetchBroadcasts}>
                {t("common.tryAgain")}
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
            onSelectBroadcast={handleSelectBroadcast}
          />
        </div>
      )}

      {/* Mobile Listing */}
      {!isLoading && !loadError && (
        <div className="md:hidden flex-1 min-h-0 overflow-y-auto">
          <MobileListing
            broadcastList={filteredBroadcasts}
            onSelectBroadcast={handleSelectBroadcast}
            className="pb-30"
          />
        </div>
      )}

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={handleCreateBroadcast}
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 flex items-center justify-center z-40 hover:scale-110 active:scale-95"
        aria-label={t("ui.createNewBroadcast")}
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
        key={formModalKey}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitBroadcast}
        isSubmitting={isSubmitting}
        submitError={submitError}
        existingBroadcast={selectedBroadcast}
      />

    </div>
  );
}
