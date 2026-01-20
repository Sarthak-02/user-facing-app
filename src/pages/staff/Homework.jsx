import { useState, useMemo } from "react";
import { Card, Button } from "../../ui-components";
import DesktopListing from "../../components/staff-homework/DesktopListing";
import MobileListing from "../../components/staff-homework/MobileListing";
import HomeworkFormModal from "../../components/staff-homework/HomeworkFormModal";
import TargetSelector from "../../components/TargetSelector";
import Dropdown from "../../ui-components/Dropdown";

// Mock data - Replace with actual API call
const MOCK_TEACHER_HOMEWORK = [
  {
    id: "hw-001",
    subject: "Mathematics",
    title: "Chapter 5 - Quadratic Equations Practice Problems",
    class: "Class 10",
    section: "Section A",
    dueDate: "2026-01-25",
    status: "ACTIVE",
    attachmentCount: 2,
    description: "Solve all problems from exercise 5.1 and 5.2",
    assignedDate: "2026-01-15",
    submissionCount: 15,
    totalStudents: 30,
  },
  {
    id: "hw-002",
    subject: "Mathematics",
    title: "Trigonometry Worksheet - Unit Circle",
    class: "Class 10",
    section: "Section B",
    dueDate: "2026-01-24",
    status: "ACTIVE",
    attachmentCount: 1,
    description: "Complete the trigonometry worksheet on unit circle",
    assignedDate: "2026-01-17",
    submissionCount: 22,
    totalStudents: 28,
  },
  {
    id: "hw-003",
    subject: "Mathematics",
    title: "Linear Equations - Word Problems",
    class: "Class 9",
    section: "Section A",
    dueDate: "2026-01-15",
    status: "COMPLETED",
    attachmentCount: 1,
    description: "Solve word problems from chapter 3",
    assignedDate: "2026-01-08",
    submissionCount: 25,
    totalStudents: 25,
  },
  {
    id: "hw-004",
    subject: "Mathematics",
    title: "Geometry - Circle Theorems",
    class: "Class 9",
    section: "Section B",
    dueDate: "2026-01-20",
    status: "ACTIVE",
    attachmentCount: 3,
    description: "Study and prove circle theorems from the textbook",
    assignedDate: "2026-01-12",
    submissionCount: 18,
    totalStudents: 26,
  },
  {
    id: "hw-005",
    subject: "Mathematics",
    title: "Algebra - Polynomial Factorization",
    class: "Class 11",
    section: "Section A",
    dueDate: "2026-01-28",
    status: "ACTIVE",
    attachmentCount: 0,
    description: "Complete exercises on polynomial factorization",
    assignedDate: "2026-01-18",
    submissionCount: 5,
    totalStudents: 32,
  },
];

export default function TeacherHomework() {
  const [statusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);
  
  // Mobile filter states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [targetType, setTargetType] = useState("SCHOOL");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [studentId, setStudentId] = useState("");
  
  // Mock data for dropdowns - Replace with actual API calls
  const classes = [
    { id: "9", name: "Class 9" },
    { id: "10", name: "Class 10" },
    { id: "11", name: "Class 11" },
  ];
  
  const sections = [
    { id: "A", name: "Section A" },
    { id: "B", name: "Section B" },
  ];
  
  const students = [
    { id: "1", name: "Student 1" },
    { id: "2", name: "Student 2" },
  ];
  
  const subjects = [
    { value: "", label: "All Subjects" },
    { value: "Mathematics", label: "Mathematics" },
    { value: "Physics", label: "Physics" },
    { value: "Chemistry", label: "Chemistry" },
    { value: "Biology", label: "Biology" },
  ];

  // Filter homework based on status and mobile filters
  const filteredHomework = useMemo(() => {
    let filtered = [...MOCK_TEACHER_HOMEWORK];

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((hw) => {
        const now = new Date();
        const due = new Date(hw.dueDate);
        
        if (statusFilter === "COMPLETED") {
          return hw.status === "COMPLETED";
        } else if (statusFilter === "OVERDUE") {
          return due < now && hw.status !== "COMPLETED";
        } else if (statusFilter === "ACTIVE") {
          return hw.status === "ACTIVE" && due >= now;
        }
        return true;
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((hw) => 
        hw.title.toLowerCase().includes(query) ||
        hw.description.toLowerCase().includes(query) ||
        hw.subject.toLowerCase().includes(query)
      );
    }

    // Subject filter
    if (subjectFilter) {
      filtered = filtered.filter((hw) => hw.subject === subjectFilter);
    }

    // Date range filter
    if (dateRangeStart) {
      filtered = filtered.filter((hw) => new Date(hw.dueDate) >= new Date(dateRangeStart));
    }
    if (dateRangeEnd) {
      filtered = filtered.filter((hw) => new Date(hw.dueDate) <= new Date(dateRangeEnd));
    }

    // Class filter
    if (targetType !== "SCHOOL" && classId) {
      filtered = filtered.filter((hw) => hw.class.includes(classId));
    }

    // Section filter
    if ((targetType === "SECTION" || targetType === "STUDENT") && sectionId) {
      filtered = filtered.filter((hw) => hw.section.includes(sectionId));
    }

    // Sort by due date (earliest first)
    filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return filtered;
  }, [statusFilter, searchQuery, subjectFilter, dateRangeStart, dateRangeEnd, targetType, classId, sectionId]);

  // Calculate summary statistics
  const _summary = useMemo(() => {
    const total = MOCK_TEACHER_HOMEWORK.length;
    const now = new Date();
    
    const active = MOCK_TEACHER_HOMEWORK.filter(
      (hw) => hw.status === "ACTIVE" && new Date(hw.dueDate) >= now
    ).length;
    
    const completed = MOCK_TEACHER_HOMEWORK.filter(
      (hw) => hw.status === "COMPLETED"
    ).length;
    
    const overdue = MOCK_TEACHER_HOMEWORK.filter(
      (hw) => new Date(hw.dueDate) < now && hw.status !== "COMPLETED"
    ).length;

    return { total, active, completed, overdue };
  }, []);

  const handleCreateHomework = () => {
    setEditingHomework(null);
    setIsModalOpen(true);
  };

  const handleEditHomework = (homework) => {
    setEditingHomework(homework);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHomework(null);
  };

  const handleSubmitHomework = (homeworkData) => {
    if (editingHomework) {
      console.log("Updating homework:", editingHomework.id, homeworkData);
      // TODO: Call API to update homework
    } else {
      console.log("Creating new homework:", homeworkData);
      // TODO: Call API to create homework
    }
    handleCloseModal();
  };

  const handleApplyFilters = () => {
    setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSubjectFilter("");
    setDateRangeStart("");
    setDateRangeEnd("");
    setTargetType("SCHOOL");
    setClassId("");
    setSectionId("");
    setStudentId("");
  };

  const hasActiveFilters = searchQuery || subjectFilter || dateRangeStart || dateRangeEnd || targetType !== "SCHOOL";

  return (
    <div className="h-screen md:min-h-screen flex flex-col p-4 gap-6">
      {/* Desktop Header with Filters */}
      <Card className="hidden md:block">
        <div className="space-y-4">
          {/* Title and Create Button Row */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Homework</h1>
            
            <Button onClick={handleCreateHomework}>
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
              Create Homework
            </Button>
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

          {/* Target Selector Row */}
          <div className="grid grid-cols-12 gap-4">
            {/* Target Type */}
            <div className="col-span-3">
              <Dropdown
                label="Target Type"
                selected={targetType}
                onChange={(newTargetType) => {
                  setTargetType(newTargetType);
                  const targetOption = [
                    { value: "SCHOOL", label: "Entire School" },
                    { value: "CLASS", label: "Class", multiple: false },
                    { value: "SECTION", label: "Section", multiple: false },
                    { value: "STUDENT", label: "Student", multiple: true },
                  ].find((opt) => opt.value === newTargetType);
                  setClassId(targetOption?.multiple ? [] : "");
                  setSectionId(targetOption?.multiple ? [] : "");
                  setStudentId(targetOption?.multiple ? [] : "");
                }}
                options={[
                  { value: "SCHOOL", label: "Entire School" },
                  { value: "CLASS", label: "Class" },
                  { value: "SECTION", label: "Section" },
                  { value: "STUDENT", label: "Student" },
                ]}
                placeholder="Select target type"
              />
            </div>

            {/* Class Filter */}
            {targetType !== "SCHOOL" && (
              <div className="col-span-3">
                <Dropdown
                  label="Class"
                  selected={classId}
                  onChange={setClassId}
                  options={classes.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Select class"
                />
              </div>
            )}

            {/* Section Filter */}
            {(targetType === "SECTION" || targetType === "STUDENT") && (
              <div className="col-span-3">
                <Dropdown
                  label="Section"
                  selected={sectionId}
                  onChange={setSectionId}
                  options={sections.map((s) => ({ value: s.id, label: s.name }))}
                  placeholder="Select section"
                />
              </div>
            )}

            {/* Student Filter */}
            {targetType === "STUDENT" && (
              <div className="col-span-3">
                <Dropdown
                  label="Student"
                  selected={studentId}
                  onChange={setStudentId}
                  options={students.map((s) => ({ value: s.id, label: s.name }))}
                  placeholder="Select student"
                />
              </div>
            )}
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
      <div className="hidden md:block flex-1 overflow-y-auto">
        <DesktopListing 
          homeworkList={filteredHomework} 
          onEdit={handleEditHomework}
        />
      </div>

      {/* Mobile Listing */}
      <div className="md:hidden flex-1 overflow-hidden">
        <MobileListing 
          homeworkList={filteredHomework}
          onEdit={handleEditHomework}
        />
      </div>

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={handleCreateHomework}
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 flex items-center justify-center z-40 hover:scale-110 active:scale-95"
        aria-label="Create new homework"
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

      {/* Homework Form Modal */}
      <HomeworkFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitHomework}
        homework={editingHomework}
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
              {/* Subject Filter */}
              <div>
                <Dropdown
                  label="Subject"
                  selected={subjectFilter}
                  onChange={setSubjectFilter}
                  options={subjects}
                  placeholder="Select subject"
                />
              </div>

              {/* Date Range Filters */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date From
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
                    Due Date To
                  </label>
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Target Selector */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Target</h3>
                <TargetSelector
                  targetType={targetType}
                  setTargetType={setTargetType}
                  classId={classId}
                  sectionId={sectionId}
                  studentId={studentId}
                  classes={classes}
                  sections={sections}
                  students={students}
                  setClassId={setClassId}
                  setSectionId={setSectionId}
                  setStudentId={setStudentId}
                />
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
