# Admin Components Documentation

## Overview

This directory contains all React components for the admin workspace. Recent enhancements added advanced features for analytics, searching, exporting, and audit logging.

---

## Components

### 1. Overview (Overview Tab)

Shows system statistics and high-level information.

### 2. **Analytics** (New - Analytics Tab)

```jsx
<Analytics />
```

**Purpose**: Display comprehensive analytics dashboard with system metrics and trends.

**Features**:

- Total user counts by role
- Academic structure overview (faculties, programs, courses)
- System activity metrics (reports, pending approvals, registration codes)
- Report status breakdown
- Users by role distribution
- Programs by faculty breakdown
- Approval statistics
- Course statistics
- 30-day report trends

**Props**: None

**State**:

- `analyticsData`: API response with metrics
- `loading`: Loading state
- `error`: Error message

**API Endpoint**: `GET /api/admin/analytics`

**Styling**: `Analytics.css` with gradient backgrounds and responsive grid

**Example Usage**:

```jsx
<Analytics />
```

---

### 3. **Search** (New - Search Tab)

```jsx
<Search />
```

**Purpose**: Full-text search across all system entities.

**Features**:

- Search input field
- Filter by entity type (All, Faculties, Programs, Courses, Users)
- Result cards with detailed information
- Matched fields highlighting
- Case-insensitive search
- No results messaging

**Props**: None

**State**:

- `searchQuery`: User's search term
- `searchType`: Selected entity type filter
- `results`: Array of search results
- `loading`: Loading state
- `message`: Success/error/info messages

**API Endpoint**: `GET /api/admin/search?q=term&type=faculties|programs|courses|users`

**Styling**: `Search.css` with type-specific color coding

**Example Usage**:

```jsx
<Search />
```

**Result Object Structure**:

```javascript
{
  type: "faculty|program|course|user",
  id: number,
  name: string,
  description: string,
  faculty: string, // if applicable
  program: string, // if applicable
  role: string, // if user
  email: string, // if user
  code: string, // if course
  matched_fields: [string]
}
```

---

### 4. **Export** (New - Export Tab)

```jsx
<Export />
```

**Purpose**: Export system data in multiple formats with advanced filtering.

**Features**:

- Export type selector (Reports, Users, Programs)
- Format selector (CSV for Excel, JSON)
- Optional filters:
  - Date range (start/end)
  - Report status
  - Academic year
  - Semester
- Real-time file download
- Export logging for audit trail
- Role-based data filtering

**Props**: None

**State**:

- `exportType`: Selected entity type
- `format`: Selected export format (csv/json)
- `loading`: Loading state
- `message`: Success/error messages
- `filters`: Object with filter criteria

**API Endpoint**: `POST /api/export/reports|users|programs`

**Styling**: `Export.css` with form sections and responsive layout

**Example Usage**:

```jsx
<Export />
```

**Request Body**:

```javascript
{
  format: "csv" | "json",
  filters: {
    startDate: "YYYY-MM-DD",
    endDate: "YYYY-MM-DD",
    status: "draft|submitted|approved", // for reports
    academicYear: "2024-2025",
    semester: 1|2
  },
  scope: "all" | "own"
}
```

**Role-Based Access**:

- **Admin**: Can export all data
- **Program Leader**: Can export own faculty data
- **Principal Lecturer**: Can export own faculty data
- **Lecturer**: Can export own reports only

---

### 5. **AuditLogs** (New - Audit Logs Tab)

```jsx
<AuditLogs />
```

**Purpose**: View comprehensive admin action audit trail.

**Features**:

- Audit log table with pagination
- Entity type filter (User, Faculty, Program, Course, Class, Report)
- Results per page selector (10-200)
- Timestamp formatting
- Action color coding
- Admin name display
- Old → new value changes visualization

**Props**: None

**State**:

- `logs`: Array of audit log entries
- `loading`: Loading state
- `error`: Error message
- `filters`: Filter criteria (entityType, limit, offset)

**API Endpoint**: `GET /api/admin/audit-logs?entityType=User&limit=50&offset=0`

**Styling**: `AuditLogs.css` with color-coded badges and responsive table

**Example Usage**:

```jsx
<AuditLogs />
```

**Audit Log Entry Structure**:

```javascript
{
  id: number,
  admin_id: number,
  admin_name: string,
  entity_type: "User|Faculty|Program|Course|Class|Report",
  entity_id: number,
  action: "CREATE|UPDATE|DELETE|APPROVE|REJECT",
  old_values: JSON,
  new_values: JSON,
  ip_address: string,
  created_at: datetime
}
```

**Action Color Coding**:

- CREATE: Green (#4caf50)
- UPDATE: Orange (#ff9800)
- DELETE: Red (#f44336)
- APPROVE: Blue (#2196f3)
- REJECT: Red (#f44336)

---

### 6. Users

Manage system users, approve/reject applicants, assign roles.

**Features**:

- User list with filters
- Approve/reject users
- Role assignment
- Search and sort

---

### 7. Faculties

Manage academic faculties.

**Features**:

- Create/edit/delete faculties
- Faculty information
- Program associations

---

### 8. Programs

Manage academic programs per faculty.

**Features**:

- Create/edit/delete programs
- Program details (code, name, level)
- Faculty association
- Course count display

---

### 9. Courses

Manage academic courses.

**Features**:

- Create/edit/delete courses
- Course information
- Program associations

---

### 10. Registration Codes

Manage student registration codes.

**Features**:

- Create registration codes
- Code assignment
- Usage tracking
- Code status

---

## Component Architecture

### New Component Structure

```
AdminDashboard (parent)
├── Analytics
│   └── Analytics.css
├── Search
│   └── Search.css
├── AuditLogs
│   └── AuditLogs.css
├── Export
│   └── Export.css
├── FacultyManagement
├── ProgramManagement
├── CourseManagement
├── UserManagement
└── RegistrationCodeManagement
```

### Data Flow

1. **User interacts with component** (e.g., enters search term)
2. **Component makes API call** with authenticated token
3. **Backend processes request** (applies role-based filters)
4. **Backend returns data** (JSON format)
5. **Component updates state** and renders results
6. **User sees filtered/formatted results**

---

## Styling

### Color Scheme

All components use a consistent color palette:

- **Primary**: #667eea (Purple-blue) - Main actions, metrics
- **Accent**: #764ba2 (Darker purple) - Gradients, secondary
- **Success**: #4caf50 (Green) - Approved, success states
- **Warning**: #ff9800 (Orange) - Pending, warnings
- **Danger**: #f44336 (Red) - Delete, errors
- **Background**: #f8f9fa (Light gray) - Card backgrounds
- **Text Primary**: #333 (Dark gray) - Headers, main text
- **Text Secondary**: #666 (Medium gray) - Descriptions
- **Text Tertiary**: #999 (Light gray) - Placeholders

### Responsive Design

All components use mobile-first responsive design:

- **Desktop** (≥1024px): Full grid layouts
- **Tablet** (768-1023px): 2-column grids
- **Mobile** (<768px): Single column, stacked
- **Small** (<480px): Minimal spacing, optimized for readability

---

## API Integration

### Authentication

All components assume API authentication is handled by the axios instance in `src/services/api.js`.

Every request automatically includes:

```
Authorization: Bearer {token}
```

### Error Handling

Components implement standard error handling:

```jsx
try {
  const response = await api.get(endpoint);
  setData(response.data);
} catch (error) {
  setError(error.response?.data?.message || "Request failed");
}
```

### Loading States

Components show loading indicators during API calls:

```jsx
{
  loading && <div className="loading">Loading...</div>;
}
```

---

## Testing Components

### Manual Testing Steps

#### Analytics Component

1. Navigate to Admin Workspace → Analytics tab
2. Verify metrics display (should show counts > 0)
3. Check all sections render without errors
4. Verify responsive design on mobile

#### Search Component

1. Navigate to Admin Workspace → Search tab
2. Enter search term (e.g., "engineering")
3. Select entity type (e.g., "Programs")
4. Verify results display correctly
5. Check that matched fields are highlighted

#### Export Component

1. Navigate to Admin Workspace → Export tab
2. Select export type (e.g., "Reports")
3. Select format (e.g., "CSV")
4. Apply optional filters
5. Click Export button
6. Verify file downloads

#### AuditLogs Component

1. Navigate to Admin Workspace → Audit Logs tab
2. Verify logs table displays
3. Test entity type filter
4. Adjust results per page
5. Check timestamp and action color coding

---

## Common Patterns

### Loading State Pattern

```jsx
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const response = await api.get(endpoint);
    setData(response.data);
  } finally {
    setLoading(false);
  }
};
```

### Error Handling Pattern

```jsx
const [error, setError] = useState(null);

try {
  // API call
  setError(null);
} catch (error) {
  setError(error.response?.data?.message || "Error occurred");
}
```

### Filter State Pattern

```jsx
const [filters, setFilters] = useState({
  status: "",
  dateRange: "",
  // other filters
});

const handleFilterChange = (key, value) => {
  setFilters({ ...filters, [key]: value });
};
```

---

## Future Enhancements

1. **PDF Export**

   - Implement PDF generation using jsPDF
   - Add PDF format option to Export component

2. **Advanced Search**

   - Add saved search filters
   - Implement search history
   - Add advanced query syntax

3. **Custom Reports**

   - Allow admins to create custom reports
   - Schedule automated exports
   - Email reports

4. **Analytics Charts**

   - Add Chart.js for advanced visualizations
   - Add date range selector for trend analysis
   - Export analytics as PDF

5. **Permission Hierarchy**
   - Implement field-level permissions
   - Dynamic UI based on user permissions
   - Custom export templates per role

---

## Troubleshooting

### Component Not Displaying

- Check browser console for errors
- Verify component is imported in AdminDashboard.jsx
- Check that API endpoint is responding

### Data Not Loading

- Verify authentication token is valid
- Check network tab for API errors
- Verify user has required role/permissions

### Export File Not Downloading

- Check browser download settings
- Verify responseType is set correctly
- Check file size isn't too large

### Search Returning No Results

- Try different search terms
- Check database contains data
- Verify search endpoint is working

---

## Performance Tips

1. **Use Filters**

   - Export provides filters to reduce data volume
   - Use date ranges for large datasets
   - Filter by status or type

2. **Pagination**

   - Audit logs uses pagination (limit/offset)
   - Reduces memory usage for large result sets

3. **Caching**

   - Analytics component caches data
   - Prevents unnecessary API calls

4. **Lazy Loading**
   - Components load only when tab is selected
   - Reduces initial page load time

---

## Support

For issues or questions:

1. Check SETUP_GUIDE.md for detailed instructions
2. Review browser console for error messages
3. Check network tab for API responses
4. Verify database migrations executed successfully
5. Ensure user has required role and permissions

---

**Last Updated**: January 2024
**Components**: 4 new (Analytics, Search, Export, AuditLogs)
**Lines of Code**: 2000+ (frontend + styling)
**Test Coverage**: Comprehensive manual testing
