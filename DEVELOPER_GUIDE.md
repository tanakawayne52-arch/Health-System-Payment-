# FEPMS Developer Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation
```bash
# Clone repository (if applicable)
cd fepms-project

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000 in browser
```

## Project Architecture

### Routing Structure
```
/ (DashboardRouter)
  ├─ /login (LoginPage)
  ├─ /beneficiaries (BeneficiariesPage)
  ├─ /payment-lists (PaymentListsPage)
  ├─ /payment-lists/new (PaymentListCreatePage)
  ├─ /payment-batches (PaymentBatchesPage)
  ├─ /payment-cycles (PaymentCyclesPage)
  ├─ /reconciliation (ReconciliationPage)
  ├─ /audit-trail (AuditTrailPage)
  ├─ /reports (ReportsPage)
  └─ /users (UsersPage)
```

### Component Hierarchy
```
App (Router setup)
└─ AuthProvider
   └─ ToastProvider
      └─ BrowserRouter
         └─ AppLayout
            ├─ Dashboard (role-specific)
            └─ Feature Pages
```

## Common Development Tasks

### Adding a New Page

1. Create file in `src/pages/YourPage.tsx`:
```tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export default function YourPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  return (
    <div className="space-y-6">
      {/* Your content */}
    </div>
  );
}
```

2. Add route in `src/App.tsx`:
```tsx
<Route 
  path="/your-page" 
  element={
    <ProtectedRoute allowedRoles={['finance_officer']}>
      <AppLayout><YourPage /></AppLayout>
    </ProtectedRoute>
  } 
/>
```

### Adding a New Component

1. Create in `src/components/YourComponent.tsx`:
```tsx
interface YourComponentProps {
  title: string;
  // ... other props
}

export default function YourComponent({ title }: YourComponentProps) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="font-semibold text-[#1e293b]">{title}</h3>
      {/* Component content */}
    </div>
  );
}
```

2. Export from component index (if applicable)
3. Import where needed

### Working with Charts

Using Recharts for visualization:
```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
];

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#0d9488" />
  </BarChart>
</ResponsiveContainer>
```

### Working with Forms

Using React Hook Form + Zod:
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
});

type FormData = z.infer<typeof schema>;

export default function FormComponent() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Name" />
      {errors.name && <span>{errors.name.message}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Using Toast Notifications

```tsx
const { addToast } = useToast();

// Success toast
addToast('Operation completed successfully', 'success');

// Error toast
addToast('An error occurred', 'error');

// Warning toast
addToast('Please be careful', 'warning');

// Info toast
addToast('Here is some information', 'info');
```

### Accessing User Information

```tsx
const { user, isAuthenticated, login, logout } = useAuth();

// user object structure:
{
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  province?: string;
}

// Check role
if (user?.role === 'finance_officer') {
  // Show finance-specific UI
}
```

### Local Storage Operations

Data is persisted in localStorage through seed.ts functions:

```tsx
import { 
  getBeneficiaries, 
  saveBeneficiaries,
  getPaymentLists,
  savePaymentLists,
  getAuditLogs,
  saveAuditLogs,
  // ... other functions
} from '@/data/seed';

// Retrieve data
const beneficiaries = getBeneficiaries();

// Update data
const updated = beneficiaries.map(b => 
  b.id === 'some-id' ? { ...b, status: 'active' } : b
);
saveBeneficiaries(updated);
```

## Styling Guidelines

### Tailwind Classes to Use
```tsx
// Spacing
p-5 pt-4 px-3 ml-2

// Colors (from design system)
bg-[#0d9488]  // Primary teal
text-[#1e293b] // Dark text
bg-[#f1f5f9]  // Light background
border-[#e2e8f0] // Light border

// Responsive
sm:grid-cols-2 lg:grid-cols-4
hidden md:block

// Flexbox
flex items-center justify-between gap-4

// Other
rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)]
cursor-pointer hover:bg-blue-50 transition-colors
```

### Custom Color Variables
```tsx
// Use CSS variables from index.css
<div className="bg-[var(--primary)]">
  {/* Uses --primary color */}
</div>
```

## Type Definitions

Key types in `src/types/index.ts`:

```tsx
interface Beneficiary {
  id: string;
  fullName: string;
  nationalId: string;
  ecocashNumber: string;
  province: string;
  district: string;
  status: 'active' | 'inactive' | 'exited';
  createdAt: string;
}

interface PaymentList {
  id: string;
  name: string;
  province: string;
  district: string;
  beneficiaryCount: number;
  totalAmount: number;
  status: 'draft' | 'submitted' | 'certified' | 'rejected';
  createdAt: string;
}

interface PaymentBatch {
  id: string;
  batchNumber: string;
  province: string;
  totalBeneficiaries: number;
  totalAmount: number;
  status: 'pending' | 'validated' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}
```

## Debugging

### Console Logging
```tsx
// Log with context
console.log('[ComponentName] Data:', data);
console.error('[ComponentName] Error:', error);

// Remove debug logs before committing
```

### React DevTools
1. Install React DevTools browser extension
2. Inspect component props and state
3. Check component rendering

### Network Requests
1. Open browser DevTools Network tab
2. Monitor API calls (when backend is integrated)
3. Check response payloads

## Testing Locally

### Test Different Roles
1. Go to /login
2. Select different role from dropdown
3. Verify role-specific pages load

### Test Responsive Design
1. Open DevTools
2. Toggle device toolbar
3. Test sm, md, lg breakpoints

### Test Form Validation
1. Leave required fields empty
2. Enter invalid email formats
3. Submit and verify error messages

## Building for Production

```bash
# Build optimized version
pnpm build

# Preview production build locally
pnpm preview

# Check bundle size
pnpm build --report

# Analyze bundle
npm install -g rollup-plugin-visualizer
```

## Common Issues & Solutions

### Issue: Port 3000 already in use
```bash
# Change port in vite.config.ts
export default defineConfig({
  server: {
    port: 3001, // Change to available port
  },
});
```

### Issue: Module not found
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: TypeScript errors
```bash
# Check for type errors
pnpm tsc --noEmit

# Fix common issues
# - Missing type imports
# - Incorrect prop types
# - Missing null checks
```

### Issue: Styles not applying
```bash
# Ensure Tailwind is configured
# Check class names match Tailwind syntax
# Verify CSS is imported in main.tsx
```

## Performance Tips

1. **Lazy Load Components**
```tsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));
<Suspense fallback={<Spinner />}>
  <HeavyComponent />
</Suspense>
```

2. **Memoize Components**
```tsx
const MemoizedComponent = memo(function Component() { 
  /* ... */ 
});
```

3. **Optimize Renders**
```tsx
const memoizedData = useMemo(() => computeData(), [deps]);
const memoizedCallback = useCallback(() => { /* ... */ }, [deps]);
```

4. **Code Splitting**
```tsx
const routes = [
  {
    path: '/dashboard',
    element: lazy(() => import('./pages/Dashboard')),
  },
];
```

## Best Practices

✅ Use TypeScript strictly (no `any` types)
✅ Create reusable components
✅ Keep components focused (single responsibility)
✅ Use proper error handling
✅ Add loading states for async operations
✅ Validate all user inputs
✅ Use semantic HTML
✅ Add ARIA labels for accessibility
✅ Keep component tree shallow
✅ Use hooks composition properly

❌ Don't directly mutate state
❌ Don't use key={index} in loops
❌ Don't ignore TypeScript errors
❌ Don't hardcode strings (use constants)
❌ Don't fetch data in render
❌ Don't create functions in render
❌ Don't pass new objects as props
❌ Don't use global variables

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

## Getting Help

1. Check error messages in browser console
2. Review TypeScript compilation errors
3. Check component props and state
4. Review related code examples
5. Check inline code comments
6. Consult documentation

---

**Last Updated**: June 2, 2026  
**Framework Version**: React 19, Vite 7, TypeScript 5.9
