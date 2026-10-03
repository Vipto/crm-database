// Core Types for Vipto CRM

export type UserRole = 'admin' | 'manager' | 'employee';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  phone?: string;
  assignedLocation?: string;
  assignedCategories?: string[];
  isActive: boolean;
  createdAt?: any;
}

export type SellerStatus =
  | 'Not started'
  | 'New'
  | 'Researching'
  | 'Contacted'
  | 'Interested'
  | 'Follow-up Required'
  | 'Onboarding Started'
  | 'Onboarded'
  | 'Not Interested'
  | 'Invalid Lead'
  | 'Unresponsive'
  | 'Lost';

export type ContactStatus =
  | 'Not Contacted'
  | 'Call Connected'
  | 'Call Not Answered'
  | 'WhatsApp Sent'
  | 'WhatsApp Replied'
  | 'Meeting Scheduled'
  | 'Visited In Person';

export type OnboardingStatus =
  | 'Not Started'
  | 'Documents Pending'
  | 'Documents Verified'
  | 'Catalog Creation'
  | 'Pricing & Margin Setup'
  | 'Agreement Signed'
  | 'Go Live Ready'
  | 'Completed'
  | 'Rejected';

export type LeadPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export const CREATED_BY_OPTIONS = [
  'Vipto',
  'Krishna Israni',
  'Swaraj Suryavanshi',
  'Hitesh Patil',
  'Dhruo Gadhiya',
  'Dhiren Lodha',
  'Khushi Gupta',
  'Riddhi Gopalani',
  'Shweta Chavan',
  'Sanika Patil',
  'Drishti Bhalotia',
  'Neha Bhoye',
] as const;

export type CreatedByName = (typeof CREATED_BY_OPTIONS)[number];

export type LeadSource =
  | 'Field Research'
  | 'Google Maps'
  | 'Instagram'
  | 'Indiamart'
  | 'Justdial'
  | 'Referral'
  | 'Inbound'
  | 'Trade Show'
  | 'CSV Import';

export interface Seller {
  id: string;
  name: string;
  shopName: string;
  phone: string;
  whatsapp?: string;
  googleMapOrInstagramLink?: string;
  email?: string;
  category: string;
  subcategory?: string;
  city?: string;
  state?: string;
  area?: string;
  address?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    googleMapsUrl?: string;
  };
  
  // Business info
  shopType?: 'Retailer' | 'Wholesaler' | 'Manufacturer' | 'Distributor';
  productsSold?: string[];
  productCountEstimated?: number;
  storeDescription?: string;
  storeImages?: string[];
  websiteUrl?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };

  // CRM status
  assignedEmployeeId?: string | null;
  assignedEmployeeName?: string | null;
  sellerStatus: SellerStatus;
  contactStatus: ContactStatus;
  onboardingStatus: OnboardingStatus;
  leadSource: LeadSource;
  priority: LeadPriority;
  
  // Research info
  researcherId?: string;
  researcherName?: string;
  researchNotes?: string;
  
  // Lifecycle timestamps
  lastContactedAt?: any;
  nextFollowUpAt?: any;
  createdAt: any;
  updatedAt: any;
  createdBy?: string;
  createdByName?: string;
  
  // Onboarding checklist steps
  onboardingChecklist?: {
    kycVerified: boolean;
    bankDetailsVerified: boolean;
    catalogUploaded: boolean;
    pricingAgreed: boolean;
    contractSigned: boolean;
    firstOrderPlaced: boolean;
  };

  // Search indexing helpers
  searchKeywords?: string[];
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  assignedLocation: string;
  assignedCategories: string[];
  isActive: boolean;
  stats?: {
    assignedSellersCount: number;
    completedOnboardingsCount: number;
    pendingFollowUpsCount: number;
  };
  createdAt?: any;
}

export type TaskType =
  | 'Call task'
  | 'WhatsApp follow-up'
  | 'Seller onboarding task'
  | 'Research task'
  | 'Verification task'
  | 'General task';

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';

export interface CRMTask {
  id: string;
  title: string;
  sellerId?: string;
  sellerName?: string;
  sellerPhone?: string;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  dueDate: any;
  priority: LeadPriority;
  taskType: TaskType;
  status: TaskStatus;
  notes?: string;
  completedAt?: any;
  createdAt: any;
  createdBy: string;
}

export type ActivityType =
  | 'call'
  | 'whatsapp'
  | 'note'
  | 'status_change'
  | 'assignment'
  | 'onboarding'
  | 'task'
  | 'research';

export interface Activity {
  id: string;
  sellerId?: string;
  sellerName?: string;
  performedBy: string;
  performedByName: string;
  performedByRole?: string;
  action: string;
  details?: string;
  type: ActivityType;
  timestamp: any;
  metadata?: Record<string, any>;
}

export interface FilterOptions {
  searchQuery?: string;
  city?: string;
  state?: string;
  category?: string;
  assignedEmployeeId?: string;
  sellerStatus?: SellerStatus | '';
  contactStatus?: ContactStatus | '';
  onboardingStatus?: OnboardingStatus | '';
  leadSource?: LeadSource | '';
  priority?: LeadPriority | '';
  dateRange?: 'all' | 'today' | 'this_week' | 'this_month' | 'custom';
  hasFollowUpDue?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastContactedAt' | 'nextFollowUpAt' | 'name' | 'shopName';
  sortDirection?: 'asc' | 'desc';
}

export interface PaginationState {
  pageSize: number;
  currentPage: number;
  totalEstimated?: number;
  hasMore: boolean;
  firstVisibleDoc?: any;
  lastVisibleDoc?: any;
  cursorStack: any[];
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  matchedFields: ('phone' | 'whatsapp' | 'email' | 'shopNameAndCity')[];
  existingSeller?: Seller;
  message?: string;
}

export interface CSVImportRow {
  name: string;
  shopName: string;
  phone: string;
  whatsapp?: string;
  googleMapOrInstagramLink?: string;
  email?: string;
  category: string;
  city?: string;
  state?: string;
  area?: string;
  address?: string;
  sellerStatus?: string;
  priority?: string;
  leadSource?: string;
  assignedEmployeeId?: string;
  notes?: string;
  
  // Validation status
  _isValid?: boolean;
  _errors?: string[];
  _isDuplicate?: boolean;
  _duplicateReason?: string;
  _existingSellerId?: string;
}

export interface DashboardMetrics {
  totalSellers: number;
  newSellers: number;
  contactedSellers: number;
  followUpRequired: number;
  interestedSellers: number;
  onboardingInProgress: number;
  onboardedSellers: number;
  notInterestedSellers: number;
  totalEmployees: number;
  tasksDueToday: number;
  
  // Chart data
  acquisitionOverTime: { date: string; count: number; onboarded: number }[];
  sellersByCity: { city: string; count: number }[];
  sellersByCategory: { category: string; count: number }[];
  onboardingFunnel: { stage: string; count: number; percentage: number }[];
  sellersByEmployee: { name: string; count: number; completed: number }[];
  weeklyAdditions: { day: string; count: number }[];
}
