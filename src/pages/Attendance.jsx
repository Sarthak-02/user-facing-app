import { useMemo, useState } from "react";
import AttendanceSummary from "../components/attendance/AttendanceSummary";
import ConfirmationModal from "../components/attendance/ConfirmationModal";
import DesktopListing from "../components/attendance/DesktopListing";
import Header from "../components/attendance/Header";
import MobileListing from "../components/attendance/MobileListing";
import {
  Button
} from "../ui-components";
import { isToday } from "../utils/common-functions";

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

  const editMode = useMemo(() => {
    return isToday(selectedDate);
  }, [selectedDate]);

  function handleSubmit() {
    const payload = {
      section_id: selectedClass,
      teacher_id: "12345", //this will be fetched from the logged in details
      date: new Date().toISOString(), //today's date
      campus_session: "FULL_DAY", //get it from the selected filters
      period: "OVERALL", //get it from the selected filters
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

  const presentCount = Object.values(attendance).filter(
    (s) => s === "PRESENT"
  ).length;

  const absentCount = Object.values(attendance).filter(
    (s) => s === "ABSENT"
  ).length;

  return (
    <div className="h-screen flex flex-col p-4 gap-6">
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
      />
      {/* <Button variant="primary">Save Attendance</Button> */}
      {/* Summary */}
      <div className={`${editMode ? "hidden" : ""}`}>
        <AttendanceSummary
          total={STUDENTS.length}
          absent={absentCount}
          present={presentCount}
        />
      </div>

      {/* Desktop Table */}
      <DesktopListing
        attendance={attendance}
        markAttendance={markAttendance}
        STUDENTS={STUDENTS}
        editMode={editMode}
      />

      {/* Mobile List */}
      <MobileListing
        STUDENTS={STUDENTS}
        attendance={attendance}
        markAttendance={markAttendance}
        editMode={editMode}
      />

      {/* Mobile sticky action bar */}
      {editMode && (
        <div className="fixed bottom-0 left-0 right-0 lg:max-w-lg z-20 bg-surface lg:bg-transparent border-t lg:border-none lg:mb-2 border-border p-2  text-center m-auto">
          <div className="text-xs text-gray-500 pb-1">
            {Object.keys(attendance).length ?? 0} / {STUDENTS.length} students
            marked
          </div>
          <Button
            variant="primary"
            className="w-full max-w-md"
            // disabled={STUDENTS.length !== attendance.length}
            onClick={() => setShowConfirmation(true)}
          >
            Submit Attendance
          </Button>
        </div>
      )}
    </div>
  );
}
