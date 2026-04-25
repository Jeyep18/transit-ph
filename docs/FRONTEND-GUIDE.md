# Frontend Developer Guide (Next.js + Tailwind CSS)

Welcome to the frontend team! We are using **Next.js** (App Router) with **Tailwind CSS** for styling. This guide will help you set up your local environment and explain our workflow.

## 🛠 Prerequisites

Ensure you have the following installed:

- [Node.js (LTS Version)](https://nodejs.org/)
- npm (comes with Node)

## 🚀 Local Setup

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-username/trends-project.git
   cd trends-project
   ```

2. **Navigate to Frontend:**

   ```bash
   cd frontend
   ```

3. **Install Dependencies:**

   ```bash
   npm install
   ```

4. **Run Development Server:**

   ```bash
   npm run dev
   ```

The site should now be running at http://localhost:3000.

## 🌳 Git Workflow & Branching

To avoid merge conflicts and keep `main` stable, we follow this strict workflow:

### 1. Start from the Dev Branch

Always ensure your local `dev` branch is up to date before starting a new feature.

```bash
git checkout dev
git pull origin dev
```

### 2. Create a Feature Branch

Use the naming convention: `FE-FeatureName`

```bash
git checkout -b FE-NameOfYourFeature
```

### 3. Commit and Push

Keep your commits descriptive.

```bash
git add .
git commit -m "feat: added login form validation"
git push origin FE-NameOfYourFeature
```

### 4. Open a Pull Request (PR)

1. Go to GitHub.
2. Create a PR from `FE-NameOfYourFeature` → `dev`.
3. Do **not** merge directly into `main`.

## 📁 Naming Conventions

Consistent naming keeps the codebase readable and predictable. Follow these rules across all frontend files.

### Folders

Use **kebab-case** for all folder names.

```
components/
  budget-overview/
  data-table/
  receipt-modal/
app/
  dashboard/
  login/
```

### Component Files

Use **PascalCase** for component files. The filename should match the component name exactly.

```
BudgetCard.tsx
DataTable.tsx
ReceiptModal.tsx
GaugePanel.tsx
```

### Non-Component Files

Use **camelCase** for utilities, hooks, helpers, and other non-component TypeScript/JavaScript files.

```
formatCurrency.ts
useTransactions.ts
apiClient.ts
authHelpers.ts
```

### Page & Layout Files (App Router)

Next.js App Router has reserved filenames — keep them lowercase as required by the framework.

```
app/
  dashboard/
    page.tsx        ✅
    layout.tsx      ✅
    loading.tsx     ✅
    error.tsx       ✅
```

### Component Naming Inside Files

- **Components** → `PascalCase`
- **Functions & variables** → `camelCase`
- **Constants** → `SCREAMING_SNAKE_CASE`
- **Types & interfaces** → `PascalCase`, prefix interfaces with `I` only if needed for clarity (e.g., `IUserProps`)

```tsx
// ✅ Good
const MAX_ITEMS = 10;
const formatDate = (date: string) => { ... };
type TransactionRow = { ... };

export default function BudgetCard({ title, amount }: BudgetCardProps) { ... }
```

### Props & Types

Define prop types in the same file as the component. Name them after the component with a `Props` suffix.

```tsx
type BudgetCardProps = {
  title: string;
  amount: number;
  variant?: "income" | "expense";
};
```

### CSS / Tailwind

Avoid writing custom class names unless absolutely necessary. When you do need a custom class (e.g., in a `globals.css` or CSS module), use **kebab-case**.

```css
/* ✅ Good */
.gauge-track { ... }
.sidebar-nav-item { ... }

/* ❌ Avoid */
.GaugeTrack { ... }
.sidebarNavItem { ... }
```

### Quick Reference

| What                  | Convention           | Example              |
| --------------------- | -------------------- | -------------------- |
| Folders               | kebab-case           | `budget-overview/`   |
| Component files       | PascalCase           | `BudgetCard.tsx`     |
| Hook / util files     | camelCase            | `useTransactions.ts` |
| Page / layout files   | lowercase (Next.js)  | `page.tsx`           |
| React components      | PascalCase           | `BudgetCard`         |
| Functions & variables | camelCase            | `formatCurrency`     |
| Constants             | SCREAMING_SNAKE_CASE | `MAX_ITEMS`          |
| Prop types            | PascalCase + `Props` | `BudgetCardProps`    |
| Custom CSS classes    | kebab-case           | `.gauge-track`       |

---

## 🔍 Troubleshooting GitHub Issues

- **Merge Conflicts:** If GitHub says your branch has conflicts, run `git pull origin dev` while on your feature branch, resolve the conflicts in your code editor, then commit the changes.

- **Node Modules Issues:** If the project isn't building after a pull, try deleting the `node_modules` folder and running `npm install` again.

- **Accidentally worked on Dev:** If you forgot to make a branch, run `git stash`, `git checkout -b FE-FeatureName`, then `git stash pop`.

**APP FOLDER STRUCTURE**

src/
├── app/
│ ├── page.tsx # Entry point — renders the map shell, nothing else
│ ├── layout.tsx # Root layout, mobile viewport meta, fonts
│ ├── globals.css # Tailwind base + any mobile scroll/overflow resets
│ └── admin/
│ ├── layout.tsx # Admin shell with auth guard
│ ├── page.tsx # Admin dashboard
│ ├── stations/
│ │ └── page.tsx
│ ├── routes/
│ │ └── page.tsx
│ └── fare-matrix/
│ └── page.tsx
│
├── components/
│ │
│ ├── map/ # The always-visible full-screen map layer
│ │ ├── MapView.tsx # Presentational — renders the map canvas
│ │ ├── MapContainer.tsx # Container — feeds coords, handles map state
│ │ ├── MapPin.tsx # The red location pin shown on map
│ │ └── MapOverlayButtons.tsx # "Stations" + "Route" toggle buttons (top-right)
│ │
│ ├── search/ # Top search bar (always visible over the map)
│ │ ├── SearchBar.tsx # Presentational — the search input with icon
│ │ ├── SearchBarContainer.tsx # Container — handles input state + suggestion fetch
│ │ └── SearchDropdown.tsx # Dropdown list of station suggestions (Item 1, 2…)
│ │
│ ├── route-panel/ # The bottom sheet that slides up over the map
│ │ ├── BottomSheet.tsx # Presentational — the slide-up card wrapper/shell
│ │ ├── RouteInformationForm.tsx # "Current Location" + "Destination" inputs
│ │ ├── TransportSelector.tsx # Jeepney / Tricycle / E-Jeep pill buttons
│ │ └── SearchRoutesButton.tsx # The dark "Search Available Routes" CTA button
│ │
│ ├── results/ # The "Suggested Route" slide-up results card
│ │ ├── SuggestedRouteCard.tsx # Presentational — single route result row
│ │ │ # (thumbnail + route name + distance + fare + button)
│ │ ├── SuggestedRouteList.tsx # Presentational — list of SuggestedRouteCards
│ │ └── ResultsSheet.tsx # The slide-up sheet wrapper for results
│ │ # (the dark-header card seen in Page 2)
│ │
│ ├── ui/ # Base design system — pure presentational atoms
│ │ ├── Button.tsx # Dark, outlined, ghost variants from wireframe
│ │ ├── Input.tsx # Search/text input base
│ │ ├── PinIcon.tsx # The location pin SVG variants (origin/destination)
│ │ ├── Badge.tsx # Transport type badge (Jeep, Tricycle label)
│ │ ├── Spinner.tsx # Loading state
│ │ └── index.ts # Barrel export
│ │
│ └── admin/ # Admin panel components (separate visual world)
│ ├── StationTable.tsx
│ ├── StationFormModal.tsx
│ ├── RouteTable.tsx
│ ├── RouteFormModal.tsx
│ ├── RouteStationEditor.tsx # Drag-to-reorder sequence manager
│ └── FareMatrixForm.tsx
│
├── hooks/
│ ├── useRouteSearch.ts # Manages the full search → results flow
│ ├── useBottomSheet.ts # Controls slide-up/slide-down animation state
│ │ # (collapsed, peek, expanded states)
│ ├── useLocationInput.ts # Handles current location detection + manual input
│ ├── useStationSuggestions.ts # Debounced station name search for the dropdown
│ ├── useMapPins.ts # Manages pin placement state on the map
│ └── useAdminAuth.ts # Admin session check + redirect guard
│
├── services/ # All Django API calls — nowhere else calls the API
│ ├── api.ts # Base fetch/axios instance with baseURL + headers
│ ├── searchService.ts # POST /api/search/ → returns route results
│ ├── stationService.ts # GET /api/stations/ (for dropdown suggestions)
│ └── adminService.ts # All admin CRUD (stations, routes, fare matrix)
│
├── types/
│ ├── station.ts # Station, StationType ('JEEPNEY_STOP' | 'TRICYCLE_TERMINAL')
│ ├── route.ts # Route, RouteStation, RouteLeg
│ ├── search.ts # SearchQuery, RouteResult (what the results card renders)
│ ├── fareMatrix.ts # FareMatrix, fare computation response shape
│ └── admin.ts # AdminUser, AuthToken
│
├── lib/ # Pure logic — zero React, fully unit-testable
│ ├── fareComputation.ts # The BR-FCM-02 fare formula
│ ├── haversine.ts # BR-FCM-03 distance fallback
│ ├── routeSorting.ts # Sort results by fare / transfers / time
│ └── formatters.ts # "Php 14.00", "3 KM" — matches wireframe label format
│
└── constants/
├── api.ts # Endpoint paths
├── transport.ts # JEEPNEY_STOP, TRICYCLE_TERMINAL, JEP code
└── map.ts # Default map center coords (Philippines), zoom levels

**How the bottom sheet architecture works in practice:**

The app/page.tsx renders three layers stacked on top of each other:

MapContainer ← always behind everything, full screen
└── SearchBar ← fixed to top, always visible
└── MapOverlayButtons ← Stations / Route toggles, top-right

BottomSheet ← slides up over the map
├── STATE: idle → shows RouteInformationForm + TransportSelector + SearchRoutesButton
└── STATE: results → shows ResultsSheet with SuggestedRouteList
