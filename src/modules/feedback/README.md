# Feedback Module

## Overview
The Feedback module allows employees, HR, and managers to submit feedback to the admin. Only admins can view and manage all feedback submissions.

## Features
- ✅ Submit feedback with optional file attachment (up to 10MB)
- ✅ View own feedback submissions
- ✅ Admin can view all feedback from all users
- ✅ Admin can update feedback status (pending, reviewed, resolved)
- ✅ Admin can add notes to feedback
- ✅ Admin can delete feedback
- ✅ Filter feedback by status, sender role, and date range
- ✅ File upload to Cloudinary for attachments

## Files Structure
```
src/modules/feedback/
├── model.js       - Mongoose schema for feedback
├── service.js     - Business logic for feedback operations
├── controller.js  - HTTP request handlers
└── routes.js      - API route definitions
```

## Database Schema

```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required),
  phone: String (optional),
  message: String (required),
  attachmentUrl: String (optional),
  attachmentPublicId: String (optional),
  sender: ObjectId (User reference),
  senderRole: String (role name),
  status: Enum ["pending", "reviewed", "resolved"],
  adminNotes: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### User Endpoints (Authenticated)
- `POST /api/v1/feedback` - Submit new feedback
- `GET /api/v1/feedback/my-feedback` - Get user's own feedback

### Admin Endpoints (Admin Only)
- `GET /api/v1/feedback` - Get all feedback (with filters)
- `GET /api/v1/feedback/:id` - Get feedback by ID
- `PUT /api/v1/feedback/:id/status` - Update feedback status
- `DELETE /api/v1/feedback/:id` - Delete feedback

## Required Permissions

Make sure to add these permissions to the Admin role:
- `view_feedback` - To view all feedback submissions
- `manage_feedback` - To update and delete feedback

## Setup Instructions

### 1. Update Admin Role Permissions
You need to add the feedback permissions to your admin role. You can do this by:

**Option A: Using the database directly**
```javascript
db.roles.updateOne(
  { name: "Admin" },
  { 
    $addToSet: { 
      permissions: { 
        $each: ["view_feedback", "manage_feedback"] 
      } 
    } 
  }
)
```

**Option B: Using the API**
Update your admin role through the role management API to include `view_feedback` and `manage_feedback` permissions.

### 2. Test the Endpoints

Start your server and test the endpoints using the provided API guide in `FEEDBACK_API_GUIDE.md`.

## Usage Examples

### Submit Feedback (JavaScript)
```javascript
const formData = new FormData();
formData.append('firstName', 'John');
formData.append('lastName', 'Doe');
formData.append('email', 'john@example.com');
formData.append('message', 'My feedback message');
formData.append('file', fileInput.files[0]); // optional

fetch('/api/v1/feedback', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Get All Feedback (Admin)
```javascript
fetch('/api/v1/feedback?status=pending&senderRole=Employee', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Frontend Integration
See `FEEDBACK_API_GUIDE.md` for complete frontend integration examples with React and vanilla JavaScript.

## Security Features
- JWT authentication required for all endpoints
- Role-based access control (Admin permissions)
- File type validation
- File size limit (10MB)
- User can only view their own feedback (unless admin)
- Admin can view all feedback from all users

## Supported File Types
- Images: JPEG, PNG, JPG, WebP
- Documents: PDF, DOC, DOCX
- Spreadsheets: XLS, XLSX, CSV
- Presentations: PPT, PPTX
- Text: TXT

## Notes
- Files are automatically uploaded to Cloudinary
- Local uploaded files are cleaned up after Cloudinary upload
- Attachments are deleted from Cloudinary when feedback is deleted
- All dates are stored in UTC format
