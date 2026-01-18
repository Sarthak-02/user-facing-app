import { useState, useMemo } from "react";
import { Card } from "../../ui-components";
import DesktopListing from "../../components/homework/DesktopListing";
import MobileListing from "../../components/homework/MobileListing";

// Mock data - Replace with actual API call
const MOCK_HOMEWORK_DATA = [
  {
    id: "hw-001",
    subject: "Mathematics",
    title: "Chapter 5 - Quadratic Equations Practice Problems",
    class: "Class 10",
    section: "Section A",
    dueDate: "2026-01-20",
    status: "ASSIGNED",
    attachmentCount: 2,
    description: "Solve all problems from exercise 5.1 and 5.2",
    assignedBy: "Prof. Sharma",
    assignedDate: "2026-01-15",
  },
  {
    id: "hw-002",
    subject: "Physics",
    title: "Lab Report - Simple Pendulum Experiment",
    class: "Class 10",
    section: "Section A",
    dueDate: "2026-01-18",
    status: "ASSIGNED",
    attachmentCount: 1,
    description: "Complete the lab report based on yesterday's experiment",
    assignedBy: "Prof. Kumar",
    assignedDate: "2026-01-16",
  },
  {
    id: "hw-003",
    subject: "Chemistry",
    title: "Periodic Table Elements - Study and Memorize",
    class: "Class 10",
    section: "Section A",
    dueDate: "2026-01-25",
    status: "ASSIGNED",
    attachmentCount: 0,
    description: "Memorize first 30 elements with their atomic numbers",
    assignedBy: "Prof. Verma",
    assignedDate: "2026-01-17",
  },
  {
    id: "hw-004",
    subject: "English",
    title: "Essay on Environmental Conservation",
    class: "Class 10",
    section: "Section A",
    dueDate: "2026-01-22",
    status: "SUBMITTED",
    attachmentCount: 1,
    description: "Write a 500-word essay on environmental conservation",
    assignedBy: "Prof. Mehta",
    assignedDate: "2026-01-12",
    submittedDate: "2026-01-16",
  },
  {
    id: "hw-005",
    subject: "History",
    title: "World War II Timeline and Key Events",
    class: "Class 10",
    section: "Section A",
    dueDate: "2026-01-15",
    status: "ASSIGNED",
    attachmentCount: 3,
    description: "Create a detailed timeline of World War II events",
    assignedBy: "Prof. Singh",
    assignedDate: "2026-01-08",
  },
  {
    id: "hw-006",
    subject: "Biology",
    title: "Human Digestive System Diagram",
    class: "Class 10",
    section: "Section A",
    dueDate: "2026-01-19",
    status: "ASSIGNED",
    attachmentCount: 1,
    description: "Draw and label the human digestive system",
    assignedBy: "Prof. Patel",
    assignedDate: "2026-01-14",
  },
  {
    id: "hw-007",
    subject: "Computer Science",
    title: "Python Programming Assignment - Loops",
    class: "Class 10",
    section: "Section A",
    dueDate: "2026-01-23",
    status: "SUBMITTED",
    attachmentCount: 2,
    description: "Complete all programming exercises on loops",
    assignedBy: "Prof. Gupta",
    assignedDate: "2026-01-10",
    submittedDate: "2026-01-15",
  },
  {
    id: "hw-008",
    subject: "Mathematics",
    title: "Trigonometry Worksheet - Unit Circle",
    class: "Class 10",
    section: "Section A",
    dueDate: "2026-01-24",
    status: "ASSIGNED",
    attachmentCount: 1,
    description: "Complete the trigonometry worksheet on unit circle",
    assignedBy: "Prof. Sharma",
    assignedDate: "2026-01-17",
  },
];

export default function Homework() {
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Filter homework based on status
  const filteredHomework = useMemo(() => {
    let filtered = [...MOCK_HOMEWORK_DATA];

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((hw) => {
        const now = new Date();
        const due = new Date(hw.dueDate);
        
        if (statusFilter === "SUBMITTED") {
          return hw.status === "SUBMITTED";
        } else if (statusFilter === "OVERDUE") {
          return due < now && hw.status !== "SUBMITTED";
        } else if (statusFilter === "ASSIGNED") {
          return hw.status === "ASSIGNED" && due >= now;
        }
        return true;
      });
    }

    // Sort by due date (earliest first)
    filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return filtered;
  }, [statusFilter]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = MOCK_HOMEWORK_DATA.length;
    const now = new Date();
    
    const assigned = MOCK_HOMEWORK_DATA.filter(
      (hw) => hw.status === "ASSIGNED" && new Date(hw.dueDate) >= now
    ).length;
    
    const submitted = MOCK_HOMEWORK_DATA.filter(
      (hw) => hw.status === "SUBMITTED"
    ).length;
    
    const overdue = MOCK_HOMEWORK_DATA.filter(
      (hw) => new Date(hw.dueDate) < now && hw.status !== "SUBMITTED"
    ).length;

    return { total, assigned, submitted, overdue };
  }, []);

  return (
    <div className="h-screen md:min-h-screen flex flex-col p-4 gap-6">
      {/* Header with Filters */}
      <Card className="hidden md:block">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Homework</h1>
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "ALL"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({summary.total})
            </button>
            <button
              onClick={() => setStatusFilter("ASSIGNED")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "ASSIGNED"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Assigned ({summary.assigned})
            </button>
            <button
              onClick={() => setStatusFilter("SUBMITTED")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "SUBMITTED"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Submitted ({summary.submitted})
            </button>
            <button
              onClick={() => setStatusFilter("OVERDUE")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "OVERDUE"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Overdue ({summary.overdue})
            </button>
          </div>
        </div>
      </Card>

      {/* Mobile Header */}
      <div className="md:hidden">
        <Card>
          <h1 className="text-xl font-bold text-gray-900 mb-4">My Homework</h1>
          
          {/* Mobile Filter Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "ALL"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              All ({summary.total})
            </button>
            <button
              onClick={() => setStatusFilter("ASSIGNED")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "ASSIGNED"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Assigned ({summary.assigned})
            </button>
            <button
              onClick={() => setStatusFilter("SUBMITTED")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "SUBMITTED"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Submitted ({summary.submitted})
            </button>
            <button
              onClick={() => setStatusFilter("OVERDUE")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === "OVERDUE"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Overdue ({summary.overdue})
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
    </div>
  );
}
