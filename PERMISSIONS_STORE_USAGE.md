# Teacher Permissions Store Usage

The permissions store has been set up to fetch and store teacher permissions on login.

## How it works

1. **On Login**: When a teacher/staff logs in, the system automatically fetches their permissions from the API endpoint `/teacher/permissions`
2. **Storage**: All permissions are stored in Zustand with persistence (survives page refresh)
3. **Clearing**: Permissions are automatically cleared on logout

## Using the Permissions Store

### Basic Import

```javascript
import { usePermissions } from "../store/permissions.store";
```

### Access Permissions in Components

```javascript
function MyComponent() {
  const { permissions, loading, error } = usePermissions();
  
  // Access teacher info
  const teacherId = permissions.teacher_id;
  const teacherName = permissions.teacher_name;
  
  // Access classes
  const classes = permissions.classes;
  // Example: [{ class_id: "...", class_name: "11" }]
  
  // Access sections
  const sections = permissions.sections;
  // Example: [{ class_id: "...", section_id: "...", section_name: "11A" }]
  
  // Access students
  const students = permissions.students;
  // Example: [{ student_id: "...", student_name: "...", student_roll_no: "...", section_id: "..." }]
  
  // Access teacher subjects
  const teacherSubjects = permissions.teacher_subjects;
  // Example: [{ subject_id: "...", subject_name: "Mathematics", section_id: "..." }]
  
  return (
    <div>
      {loading && <p>Loading permissions...</p>}
      {error && <p>Error: {error}</p>}
      {/* Your component JSX */}
    </div>
  );
}
```

### Using Helper Methods

```javascript
function MyComponent() {
  const { 
    getClasses, 
    getSectionsByClass, 
    getStudentsBySection,
    getTeacherSubjects,
    getSubjectsBySection 
  } = usePermissions();
  
  // Get all classes
  const allClasses = getClasses();
  
  // Get sections for a specific class
  const sectionsForClass = getSectionsByClass("408d58ca-e842-4d4c-997b-f6ff6c9581c5");
  
  // Get students for a specific section
  const studentsInSection = getStudentsBySection("eb6fb026-615a-4ec9-a261-8a537b8e8863");
  
  // Get all teacher subjects
  const allSubjects = getTeacherSubjects();
  
  // Get subjects for a specific section
  const subjectsForSection = getSubjectsBySection("eb6fb026-615a-4ec9-a261-8a537b8e8863");
  
  return (
    <div>
      <select>
        {allClasses.map(cls => (
          <option key={cls.class_id} value={cls.class_id}>
            {cls.class_name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Manual Actions

```javascript
function AdminComponent() {
  const { setPermissions, clearPermissions, setLoading, setError } = usePermissions();
  
  // Manually set permissions (usually not needed as it's done on login)
  const handleSetPermissions = (data) => {
    setPermissions(data);
  };
  
  // Clear permissions (usually not needed as it's done on logout)
  const handleClearPermissions = () => {
    clearPermissions();
  };
  
  return <div>{/* Your component */}</div>;
}
```

## Data Structure

The permissions object stored in Zustand has the following structure:

```javascript
{
  teacher_id: "be77102d-d260-4b04-a825-2d16a272c2c0",
  teacher_name: "teacher3 gupta",
  teacher_subjects: [
    {
      subject_id: "abc123...",
      subject_name: "Mathematics",
      section_id: "eb6fb026-615a-4ec9-a261-8a537b8e8863"
    },
    {
      subject_id: "def456...",
      subject_name: "Physics",
      section_id: "eb6fb026-615a-4ec9-a261-8a537b8e8863"
    }
  ],
  classes: [
    {
      class_id: "408d58ca-e842-4d4c-997b-f6ff6c9581c5",
      class_name: "11"
    }
  ],
  sections: [
    {
      class_id: "408d58ca-e842-4d4c-997b-f6ff6c9581c5",
      section_id: "eb6fb026-615a-4ec9-a261-8a537b8e8863",
      section_name: "11A"
    }
  ],
  students: [
    {
      student_id: "b592bfab-875a-400d-98e4-a145bd34ed9d",
      student_name: "Student001",
      student_roll_no: "001",
      section_id: "eb6fb026-615a-4ec9-a261-8a537b8e8863"
    }
  ]
}
```
