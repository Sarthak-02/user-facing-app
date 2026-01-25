# Homework Edit Functionality Improvements

## Summary
Improved the homework edit functionality to properly fetch full homework details, pre-fill all form fields including due date and target selection, and allow users to edit and update homework assignments. Also implemented the publish homework functionality with API integration.

## Changes Made

### 1. **API Updates** (`src/api/homework.api.js`)
- Updated `updateHomework()` function to use PATCH request with JSON payload
- Changed endpoint from `/staff/homework/{id}` to `/homework/{id}` for consistency
- Updated function to send homework data in the same format as `createHomework()`
- **Added `publishHomework()` function** to publish draft homework via POST `/homework/{id}/publish`

### 2. **Homework Page** (`src/pages/staff/Homework.jsx`)

#### `handleEditHomework()` Function
- Now fetches complete homework details using `getHomeworkDetail()` API
- Retrieves full homework data including:
  - Title, description, subject
  - Due date
  - Target information (sections/students)
  - Status and other metadata
- Includes error handling with fallback to basic homework object

#### `handleSubmitHomework()` Function
- Added complete update logic for editing existing homework
- Transforms form data to API schema for both create and update operations
- Properly handles:
  - Target type (CLASS, SECTION, STUDENT)
  - Multiple student selection
  - Attachments
  - Status (DRAFT/PUBLISHED)
- Refreshes homework list after successful update
- Shows appropriate error messages for both create and update failures

#### `confirmPublish()` Function
- **NEW**: Implements publish functionality with API integration
- Calls POST `/homework/{homework_id}/publish` with teacher_id in body
- Shows loading state while publishing
- Refreshes homework list after successful publish
- Error handling with user-friendly alerts
- Disables buttons during publishing to prevent duplicate requests

### 3. **Homework Form Modal** (`src/components/staff-homework/HomeworkFormModal.jsx`)

#### Form Initialization (`useEffect`)
- Enhanced to properly parse and populate all homework fields:
  
  **Target Information Parsing:**
  - Extracts target type from `homework.targets` array
  - Supports multiple field name formats (`target_type`/`targetType`, `target_id`/`targetId`)
  - Handles SECTION, STUDENT, and CLASS target types
  - For students: extracts array of student IDs for multi-select
  - For sections: extracts section ID
  
  **Due Date Formatting:**
  - Converts API date format to HTML date input format (YYYY-MM-DD)
  - Handles both `dueDate` and `due_date` field names
  
  **All Form Fields:**
  - Title
  - Subject
  - Description
  - Due Date (properly formatted)
  - Target Type (Section/Student)
  - Section ID
  - Student ID(s)
  - Status (Draft/Published)

## How It Works

### Edit Flow
1. User clicks "Edit" button on a homework item
2. System fetches complete homework details via API call to `/homework/{id}`
3. Form modal opens with all fields pre-filled:
   - Basic info (title, subject, description)
   - Due date (formatted for date input)
   - Target selection (section or students)
   - Current status
4. User can modify any field
5. On submit, system calls update API with transformed data
6. Homework list refreshes automatically

### Publish Flow
1. User clicks "Publish" button on a draft homework item
2. Confirmation modal opens showing homework details
3. User confirms publish action
4. System calls POST `/homework/{homework_id}/publish` with teacher_id
5. Loading state shown ("Publishing...")
6. On success:
   - Homework list refreshes to show updated status
   - Modal closes automatically
7. On error:
   - Error alert displayed to user
   - Modal remains open for retry

### API Call Structure

**GET Request** (when opening edit):
```
GET /homework/d8d97b3d-c8e7-4950-a304-c65b69a851d3
```

**PATCH Request** (when saving changes):
```
PATCH /homework/d8d97b3d-c8e7-4950-a304-c65b69a851d3
Body: {
  title: "Updated Title",
  description: "Updated description",
  due_date: "2024-02-15T00:00:00.000Z",
  subject: "Mathematics",
  teacher_id: "teacher-123",
  targets: [
    {
      targetType: "SECTION",
      targetId: "section-456"
    }
  ],
  publish: false,
  attachments: []
}
```

**POST Request** (when publishing):
```
POST /homework/d8d97b3d-c8e7-4950-a304-c65b69a851d3/publish
Body: {
  teacher_id: "teacher-123"
}
```

## Features

### ✅ Implemented
- Fetch complete homework details for editing
- Pre-fill all form fields with existing data
- Format due date for HTML date input
- Parse and populate target selection (section/students)
- Update homework via PATCH API call
- Refresh homework list after update
- Error handling for API failures
- Support for multiple field name formats (camelCase and snake_case)
- **Publish homework from draft status**
- **Loading states during publish operation**
- **Confirmation modal before publishing**
- **Error handling for publish failures**

### 🔄 Future Enhancements
- File upload functionality for attachments
- Show success toast notifications
- Optimistic UI updates
- Undo functionality
- Version history
- Bulk publish multiple homework items

## Testing

### Test Edit Functionality
1. Navigate to Staff Homework page (`/staff/homework`)
2. Click the edit button (pencil icon) on any homework item
3. Verify all fields are pre-filled correctly:
   - Title, subject, description
   - Due date shows in date picker
   - Target section/students are selected
4. Modify any fields
5. Click "Save as Draft" or "Publish"
6. Verify homework is updated in the list

### Test Publish Functionality
1. Navigate to Staff Homework page
2. Locate a homework item with "Draft" status
3. Click the "Publish" button
4. Verify confirmation modal appears with homework details
5. Click "Publish" to confirm
6. Verify:
   - Button shows "Publishing..." during API call
   - Buttons are disabled during publishing
   - Modal closes after successful publish
   - Homework list refreshes and status updates to "Active"
7. Test error case by publishing with network disconnected
8. Verify error alert is shown

## Error Handling

- If homework detail fetch fails, falls back to basic homework object
- If update API fails, shows error message to user
- Form validation ensures required fields are filled
- Handles both `id` and `homework_id` field names for compatibility
- **Publish failures show user-friendly error alerts**
- **Buttons disabled during publish to prevent duplicate requests**

## Notes

- Attachment upload functionality is marked as TODO (requires separate file upload endpoint)
- System supports flexible field naming (both camelCase and snake_case)
- Modal form properly resets when closed
- Changes are only saved when user explicitly clicks save/publish
