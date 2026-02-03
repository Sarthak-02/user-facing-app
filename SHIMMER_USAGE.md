# Shimmer Component Usage Guide

The Shimmer component provides beautiful skeleton loading states for your UI.

## Import

```javascript
import { Shimmer, ShimmerLine, ShimmerCircle, ShimmerBlock } from '@/ui-components';
```

## Variants

### 1. Card List Shimmer
Perfect for loading states in list views (like homework list, exam list, attendance list)

```javascript
// Show 3 shimmer cards (default)
<Shimmer variant="card-list" />

// Show 5 shimmer cards
<Shimmer variant="card-list" count={5} />
```

**Use Case Example:**
```javascript
function HomeworkList() {
  const [loading, setLoading] = useState(true);
  const [homework, setHomework] = useState([]);

  if (loading) {
    return <Shimmer variant="card-list" count={5} />;
  }

  return (
    <div className="space-y-4">
      {homework.map(hw => <HomeworkCard key={hw.id} {...hw} />)}
    </div>
  );
}
```

### 2. Detail Page Shimmer
Perfect for loading states in detail/view pages (like homework detail, exam detail)

```javascript
<Shimmer variant="detail" />
```

**Use Case Example:**
```javascript
function HomeworkDetail() {
  const [loading, setLoading] = useState(true);
  const [homework, setHomework] = useState(null);

  if (loading) {
    return (
      <div className="p-4">
        <Shimmer variant="detail" />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Your homework detail content */}
    </div>
  );
}
```

### 3. Table Shimmer
Perfect for loading states in table views

```javascript
// Show 5 rows (default)
<Shimmer variant="table" />

// Show 10 rows
<Shimmer variant="table" count={10} />
```

### 4. Custom Shimmer Elements
For building custom loading states

```javascript
import { ShimmerLine, ShimmerCircle, ShimmerBlock } from '@/ui-components';

function CustomLoadingState() {
  return (
    <div className="flex items-center gap-4">
      <ShimmerCircle size="3rem" />
      <div className="flex-1 space-y-2">
        <ShimmerLine width="80%" height="1.25rem" />
        <ShimmerLine width="60%" height="1rem" />
      </div>
      <ShimmerBlock width="100px" height="40px" />
    </div>
  );
}
```

## Real-World Integration Examples

### Example 1: Staff Homework Page

```javascript
import { Shimmer } from '@/ui-components';

function Homework() {
  const [loading, setLoading] = useState(true);
  const [homework, setHomework] = useState([]);

  useEffect(() => {
    fetchHomework()
      .then(data => {
        setHomework(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Homework</h1>
      
      {loading ? (
        <Shimmer variant="card-list" count={6} />
      ) : (
        <div className="space-y-4">
          {homework.map(hw => (
            <HomeworkCard key={hw.id} {...hw} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Example 2: Homework Detail Page

```javascript
import { Shimmer } from '@/ui-components';

function HomeworkDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [homework, setHomework] = useState(null);

  useEffect(() => {
    fetchHomeworkDetail(id)
      .then(data => {
        setHomework(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <Shimmer variant="detail" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Your homework detail content */}
    </div>
  );
}
```

### Example 3: Conditional Loading in Sections

```javascript
function StudentProfile() {
  const [profileLoading, setProfileLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      {profileLoading ? (
        <ShimmerBlock height="200px" />
      ) : (
        <ProfileCard {...profile} />
      )}

      {/* Attendance Section */}
      {attendanceLoading ? (
        <Shimmer variant="card-list" count={3} />
      ) : (
        <AttendanceList attendance={attendance} />
      )}
    </div>
  );
}
```

## Features

✅ **Multiple Variants**: Card list, detail page, table, and custom elements
✅ **Responsive Design**: Works on mobile and desktop
✅ **Dark Mode Support**: Automatically adapts to dark theme
✅ **Smooth Animation**: Elegant shimmer effect
✅ **Accessibility**: Respects `prefers-reduced-motion`
✅ **Customizable**: Control count, add custom classes

## Tips

1. **Match your content structure**: Try to use shimmer layouts that closely match your actual content for a smoother transition
2. **Use appropriate counts**: Match the typical number of items users see
3. **Combine with actual loaders**: For very long loading times, consider showing a shimmer initially and then a Loader with a message
4. **Mobile vs Desktop**: Consider showing fewer shimmer items on mobile (responsive counts)

## Styling

You can add custom classes to any shimmer variant:

```javascript
<Shimmer variant="card-list" count={3} className="max-w-4xl mx-auto" />
<Shimmer variant="detail" className="p-6" />
```

The shimmer respects your theme's border colors, backgrounds, and dark mode settings automatically.
