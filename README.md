# Vipto CRM — Enterprise Seller Lifecycle & Operations Platform

A production-ready internal SaaS CRM built for **Vipto** to manage high-volume seller discovery, merchant operations, team assignments, communication logs, follow-up tasks, and onboarding workflows connected directly to **Cloud Firestore** and **Firebase Auth/Storage**.

Designed and engineered to scale seamlessly from hundreds to **100,000+ seller records** with server-side indexed queries, cursor-based pagination, batch writing, and real-time activity audit trails.

---

## 🚀 Key Modules & Capabilities

### 1. Main Dashboard & Real-Time Intelligence
- **10 Clickable KPI Metric Cards:** Total Sellers, New Leads, Contacted, Follow-up Required, Interested, Onboarding in Progress, Onboarded, Not Interested / Lost, Active Employees, Tasks Due Today. Clicking any card instantly loads the filtered CRM view.
- **Computed Visual Analytics (Recharts):**
  - **Seller Acquisition Velocity:** Monthly lead intake vs. onboarded conversions.
  - **Onboarding Conversion Funnel:** Stage-by-stage drop-off tracking.
  - **Top Seller Clusters by City:** Geographic distribution across Pune, Mumbai, Delhi NCR, Bengaluru, Ahmedabad, Surat, Jaipur, etc.
  - **Category Diversification:** Donut chart breakdown across Fashion, Footwear, Electronics, Home & Living, Jewelry, Groceries, etc.
  - **Employee Workload & Output:** Assigned volume vs. onboarded merchants.
  - **Weekly Seller Additions:** Day-by-day discovery velocity.
- **Live Activity Feed:** Instant audit stream of team calls, WhatsApp chats, notes, and milestone updates.

### 2. Scalable Seller Management
- **Enterprise Table View & Kanban Board View:** Seamless switcher between structured data tables and visual pipeline boards.
- **Cursor-Based Pagination & Limits:** Never loads the entire collection into the browser; utilizes Firestore cursors (`startAfter`, `limit`) for sub-second page transitions.
- **Multi-Attribute Compound Filtering:** City, Category, Status, Onboarding Stage, Priority, Lead Source, Assigned Employee.
- **Global & Tokenized Search:** Fast prefix and token search indexing on Firestore.
- **Column Visibility Picker:** Toggle columns on the fly.
- **Bulk Operations:** Multi-select checkboxes for bulk employee assignment, bulk status updates, CSV export, and bulk deletion.

### 3. Detailed Seller Profile Drawer
- **Basic Info Tab:** Contact person, shop name, category, subcategory, full address, phone, WhatsApp with 1-click launcher, email, and Google Maps location.
- **Business Info & Media Tab:** Shop type (Retailer, Wholesaler, Manufacturer, Distributor), product counts, catalog tags, store overview, website, Instagram links, and **Firebase Storage photo gallery with live uploads**.
- **Activity Timeline Tab:** Chronological audit trail with quick action loggers for **Phone Calls** (Connected, Not Answered, Visited), **WhatsApp Messages**, and **Internal Notes**.
- **Tasks & Follow-ups Tab:** View and schedule seller-linked follow-up tasks with due dates and priority badges.
- **Onboarding Checklist Tab:** Interactive 6-step verification pipeline (KYC verification, Bank settlement, Catalog ingestion, Pricing agreement, Contract sign, Go Live) with a progress meter and celebratory completion trigger.

### 4. Market Research & Seller Discovery
- Dedicated discovery portal for field scouts and research associates.
- Capture field findings, Instagram stores, Google Maps merchants, and wholesale market contacts.
- Auto-tracks who discovered the lead and enables 1-click "Promote to Active Lead" workflow.

### 5. Task & Follow-Up Management
- Status categories: **Today's Tasks**, **Upcoming**, **Overdue**, **Completed**, and **All Tasks**.
- Task types: Call task, WhatsApp follow-up, Seller onboarding task, Research task, Verification task, General task.
- 1-click completion and direct link to seller profile.

### 6. Employee Workload Management
- Team directory with role badges (`Admin`, `Manager`, `Employee`).
- Live calculated workload metrics: Assigned Sellers count, Completed Onboardings count, and Pending Tasks.
- Direct "View Sellers" button to inspect any team member's portfolio.

### 7. CSV Import & Duplicate Detection Engine
- Upload CSV files with automatic header normalization and column mapping.
- **Pre-import duplicate scanner:** Checks phone, WhatsApp, email, and shop name + city against Cloud Firestore.
- Real-time preview with row-level validation errors and duplicate flags.
- Safe chunked writes using Firestore `writeBatch` (400 records per batch) with live progress meter.

### 8. Role-Based Access Control (RBAC) & Security
- Demo role switcher in the navbar to test permissions as **Admin (Ayush)**, **Manager (Mihir)**, or **Employee (Rahul)**.
- Exportable, verified `firestore.rules` and `firestore.indexes.json` configured for production deployment.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Database:** Cloud Firestore (Scalable native mode)
- **Authentication:** Firebase Authentication
- **Storage:** Firebase Storage for store photos & KYC
- **Visualizations:** Recharts
- **Icons:** Lucide React
- **CSV Engine:** PapaParse
- **Date Utilities:** date-fns

---

## 📁 Firestore Data Architecture

```text
/sellers/{sellerId}
  ├── name, shopName, phone, whatsapp, email
  ├── category, subcategory, city, state, area, address, location
  ├── shopType, productsSold, productCountEstimated, storeDescription, storeImages, websiteUrl
  ├── assignedEmployeeId, assignedEmployeeName
  ├── sellerStatus, contactStatus, onboardingStatus, leadSource, priority
  ├── onboardingChecklist: { kycVerified, bankDetailsVerified, catalogUploaded, pricingAgreed, contractSigned, firstOrderPlaced }
  ├── searchKeywords: string[] (tokenized prefixes)
  └── lastContactedAt, nextFollowUpAt, createdAt, updatedAt, createdBy, createdByName

/employees/{employeeId}
  ├── name, email, phone, role, assignedLocation, assignedCategories, isActive
  └── stats: { assignedSellersCount, completedOnboardingsCount, pendingFollowUpsCount }

/tasks/{taskId}
  ├── title, sellerId, sellerName, sellerPhone, assignedEmployeeId, assignedEmployeeName
  ├── dueDate, priority, taskType, status, notes, completedAt, createdAt, createdBy

/activities/{activityId}
  ├── sellerId, sellerName, performedBy, performedByName, performedByRole
  ├── action, details, type (call | whatsapp | note | status_change | onboarding | assignment)
  └── timestamp (serverTimestamp)

/users/{userId}
  ├── uid, email, displayName, role (admin | manager | employee), isActive, createdAt
```

---

## ⚡ Running Locally

```bash
# Install dependencies
npm install

# Start Vite Development Server
npm run dev

# Run Production Build
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Click **"Seed Sample Data"** in the top navigation bar to populate sample sellers, employees, and activities into your Firestore database.
