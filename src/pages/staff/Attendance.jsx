import { useMemo, useState } from "react";
import AttendanceSummary from "../../components/attendance/AttendanceSummary";
import BulkActionsMenu from "../../components/attendance/BulkActionsMenu";
import ConfirmationModal from "../../components/attendance/ConfirmationModal";
import DesktopListing from "../../components/attendance/DesktopListing";
import Header from "../../components/attendance/Header";
import MobileListing from "../../components/attendance/MobileListing";
import {
  Button
} from "../../ui-components";
import { isToday } from "../../utils/common-functions";

const STUDENTS = [
  { id: 1, name: "Aarav Sharma", roll: "01" },
  { id: 2, name: "Diya Verma", roll: "02" },
  { id: 3, name: "Kabir Singh", roll: "03" },
  { id: 4, name: "Ananya Gupta", roll: "04" },
  { id: 5, name: "Rohan Mehta", roll: "05" },
  { id: 6, name: "Ishita Jain", roll: "06" },
  { id: 7, name: "Arjun Patel", roll: "07" },
  { id: 8, name: "Priya Malhotra", roll: "08" },
  { id: 9, name: "Vivaan Khanna", roll: "09" },
  { id: 10, name: "Sneha Iyer", roll: "10" },
  { id: 11, name: "Aditya Rao", roll: "11" },
  { id: 12, name: "Neha Kapoor", roll: "12" },
  { id: 13, name: "Kunal Bansal", roll: "13" },
  { id: 14, name: "Pooja Nair", roll: "14" },
  { id: 15, name: "Rahul Chatterjee", roll: "15" },
  { id: 16, name: "Meera Joshi", roll: "16" },
  { id: 17, name: "Siddharth Mishra", roll: "17" },
  { id: 18, name: "Aditi Kulkarni", roll: "18" },
  { id: 19, name: "Manish Yadav", roll: "19" },
  { id: 20, name: "Ritika Saxena", roll: "20" },
  { id: 21, name: "Nikhil Aggarwal", roll: "21" },
  { id: 22, name: "Shreya Banerjee", roll: "22" },
  { id: 23, name: "Varun Arora", roll: "23" },
  { id: 24, name: "Kavya Goel", roll: "24" },
  { id: 25, name: "Mohit Srivastava", roll: "25" },
  { id: 26, name: "Riya Bhatt", roll: "26" },
  { id: 27, name: "Harsh Vardhan", roll: "27" },
  { id: 28, name: "Tanvi Deshpande", roll: "28" },
  { id: 29, name: "Aman Tiwari", roll: "29" },
  { id: 30, name: "Simran Kaur", roll: "30" },
  { id: 31, name: "Yash Malviya", roll: "31" },
  { id: 32, name: "Nandini Shetty", roll: "32" },
  { id: 33, name: "Ritesh Pandey", roll: "33" },
  { id: 34, name: "Palak Sood", roll: "34" },
  { id: 35, name: "Abhishek Thakur", roll: "35" },
  { id: 36, name: "Sonal Ghosh", roll: "36" },
  { id: 37, name: "Deepak Rana", roll: "37" },
  { id: 38, name: "Ira Mukherjee", roll: "38" },
  { id: 39, name: "Lakshay Jain", roll: "39" },
  { id: 40, name: "Ankit Solanki", roll: "40" },
  { id: 41, name: "Rashmi Pillai", roll: "41" },
  { id: 42, name: "Saurabh Dubey", roll: "42" },
  { id: 43, name: "Komal Arvind", roll: "43" },
  { id: 44, name: "Pranav Kulkarni", roll: "44" },
  { id: 45, name: "Mansi Shah", roll: "45" },
  { id: 46, name: "Kartik Ahuja", roll: "46" },
  { id: 47, name: "Divya Reddy", roll: "47" },
  { id: 48, name: "Om Prakash", roll: "48" },
  { id: 49, name: "Sakshi Tomar", roll: "49" },
  { id: 50, name: "Rajat Sinha", roll: "50" },
];

export default function AttendancePage() {
  const [attendance, setAttendance] = useState({});
  const [selectedClass, setSelectedClass] = useState("10-A");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [campusSession, setCampusSession] = useState("FULL_DAY");
  const [period, setPeriod] = useState("OVERALL");

  const editMode = useMemo(() => {
    return isToday(selectedDate);
  }, [selectedDate]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return STUDENTS;
    
    const query = searchQuery.toLowerCase();
    return STUDENTS.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.roll.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  function handleSubmit() {
    const payload = {
      section_id: selectedClass,
      teacher_id: "12345", //this will be fetched from the logged in details
      date: new Date().toISOString(), //today's date
      campus_session: campusSession,
      period: period,
      records: Object.entries(attendance).map(([key, value]) => ({
        student_id: key,
        status: value,
      })),
    };

    console.log(payload);
    setShowConfirmation(false);
  }

  const markAttendance = (id, status) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: status,
    }));
  };

  // Bulk actions
  const markAllPresent = () => {
    const allPresent = {};
    filteredStudents.forEach((student) => {
      allPresent[student.id] = "PRESENT";
    });
    setAttendance((prev) => ({ ...prev, ...allPresent }));
  };

  const markAllAbsent = () => {
    const allAbsent = {};
    filteredStudents.forEach((student) => {
      allAbsent[student.id] = "ABSENT";
    });
    setAttendance((prev) => ({ ...prev, ...allAbsent }));
  };

  const clearAll = () => {
    const clearedAttendance = { ...attendance };
    filteredStudents.forEach((student) => {
      delete clearedAttendance[student.id];
    });
    setAttendance(clearedAttendance);
  };

  const presentCount = Object.values(attendance).filter(
    (s) => s === "PRESENT"
  ).length;

  const absentCount = Object.values(attendance).filter(
    (s) => s === "ABSENT"
  ).length;

  return (
    <div className="h-screen md:min-h-screen flex flex-col p-4 gap-6 md:pb-6">
      <ConfirmationModal
        showConfirmation={showConfirmation}
        setShowConfirmation={setShowConfirmation}
        handleSubmit={handleSubmit}
        presentCount={presentCount}
        absentCount={absentCount}
      />
      {/* Header */}
      <Header
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        campusSession={campusSession}
        setCampusSession={setCampusSession}
        period={period}
        setPeriod={setPeriod}
      />
      
      {/* Summary */}
      <div className={`${editMode ? "hidden" : ""}`}>
        <AttendanceSummary
          total={STUDENTS.length}
          absent={absentCount}
          present={presentCount}
        />
      </div>

      {/* Search Bar & Bulk Actions - Only in edit mode */}
      {editMode && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-shrink-0">
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 w-full px-4 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
          <BulkActionsMenu
            markAllPresent={markAllPresent}
            markAllAbsent={markAllAbsent}
            clearAll={clearAll}
            showFilterCount={!!searchQuery}
            filteredCount={filteredStudents.length}
            totalCount={STUDENTS.length}
          />
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block flex-1 overflow-hidden">
        <DesktopListing
          attendance={attendance}
          markAttendance={markAttendance}
          STUDENTS={filteredStudents}
          editMode={editMode}
        />
      </div>

      {/* Mobile List - Wrapped in container with proper height constraint */}
      <div className="md:hidden flex-1 overflow-hidden">
        <MobileListing
          STUDENTS={filteredStudents}
          attendance={attendance}
          markAttendance={markAttendance}
          editMode={editMode}
        />
      </div>

      {/* Desktop: Inline progress & submit - Only in edit mode */}
      {editMode && (
        <div className="hidden md:block pb-12">
          {/* Progress Indicator */}
          <div className="mb-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Progress</span>
              <span className="text-sm font-medium text-gray-700">
                {Object.keys(attendance).length} / {STUDENTS.length} students
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${(Object.keys(attendance).length / STUDENTS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              variant="primary"
              className="w-full max-w-md"
              disabled={Object.keys(attendance).length === 0}
              onClick={() => setShowConfirmation(true)}
            >
              Submit Attendance
            </Button>
          </div>
        </div>
      )}

      {/* Mobile: Fixed bottom bar with progress - Only in edit mode */}
      {editMode && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-surface border-t border-border p-3 sm:p-4 text-center shadow-lg">
          {/* Progress Indicator */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-500">
                Progress
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {Object.keys(attendance).length} / {STUDENTS.length} students
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${(Object.keys(attendance).length / STUDENTS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            variant="primary"
            className="w-full max-w-md"
            disabled={Object.keys(attendance).length === 0}
            onClick={() => setShowConfirmation(true)}
          >
            Submit Attendance
          </Button>
        </div>
      )}
    </div>
  );
}
