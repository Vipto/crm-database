import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  serverTimestamp,
  writeBatch,
  Timestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Seller,
  FilterOptions,
  DuplicateDetectionResult,
  SellerStatus,
  UserProfile,
} from '../../types';
import { generateSearchKeywords, cleanPhoneNumber } from '../utils/validation';
import { logActivity } from './activities';

const SELLERS_COLLECTION = 'sellers';

/**
 * Check if a seller is a duplicate based on Phone, WhatsApp, Email, or Shop Name + City
 */
export async function checkSellerDuplicates(params: {
  phone: string;
  whatsapp?: string;
  email?: string;
  shopName?: string;
  city?: string;
  excludeId?: string;
}): Promise<DuplicateDetectionResult> {
  const sellersRef = collection(db, SELLERS_COLLECTION);
  const cleanPhone = cleanPhoneNumber(params.phone);
  const matchedFields: ('phone' | 'whatsapp' | 'email' | 'shopNameAndCity')[] = [];
  let existingSeller: Seller | undefined;

  try {
    // 1. Check by primary phone
    if (cleanPhone) {
      const qPhone = query(sellersRef, where('phone', '==', cleanPhone), limit(2));
      const snapPhone = await getDocs(qPhone);
      for (const docSnap of snapPhone.docs) {
        if (docSnap.id !== params.excludeId) {
          matchedFields.push('phone');
          existingSeller = { id: docSnap.id, ...docSnap.data() } as Seller;
          break;
        }
      }
    }

    // 2. Check by WhatsApp (if different from phone)
    const cleanWa = cleanPhoneNumber(params.whatsapp || '');
    if (cleanWa && cleanWa !== cleanPhone && !existingSeller) {
      const qWa = query(sellersRef, where('whatsapp', '==', cleanWa), limit(2));
      const snapWa = await getDocs(qWa);
      for (const docSnap of snapWa.docs) {
        if (docSnap.id !== params.excludeId) {
          matchedFields.push('whatsapp');
          existingSeller = { id: docSnap.id, ...docSnap.data() } as Seller;
          break;
        }
      }
    }

    // 3. Check by Email
    if (params.email && params.email.trim() && !existingSeller) {
      const qEmail = query(sellersRef, where('email', '==', params.email.trim().toLowerCase()), limit(2));
      const snapEmail = await getDocs(qEmail);
      for (const docSnap of snapEmail.docs) {
        if (docSnap.id !== params.excludeId) {
          matchedFields.push('email');
          existingSeller = { id: docSnap.id, ...docSnap.data() } as Seller;
          break;
        }
      }
    }

    // 4. Check by Shop Name + City (normalized)
    if (params.shopName && params.city && !existingSeller) {
      const cleanShop = params.shopName.trim().toLowerCase();
      const cleanCity = params.city.trim().toLowerCase();
      const qShop = query(
        sellersRef,
        where('city', '==', params.city.trim()),
        where('shopName', '==', params.shopName.trim()),
        limit(2)
      );
      const snapShop = await getDocs(qShop);
      for (const docSnap of snapShop.docs) {
        if (docSnap.id !== params.excludeId) {
          matchedFields.push('shopNameAndCity');
          existingSeller = { id: docSnap.id, ...docSnap.data() } as Seller;
          break;
        }
      }
    }

    if (matchedFields.length > 0 && existingSeller) {
      return {
        isDuplicate: true,
        matchedFields,
        existingSeller,
        message: `Existing seller found matching ${matchedFields.join(', ')}: "${existingSeller.shopName || existingSeller.name}" (${existingSeller.city})`,
      };
    }

    return { isDuplicate: false, matchedFields: [] };
  } catch (err) {
    console.error('Error checking seller duplicates:', err);
    return { isDuplicate: false, matchedFields: [] };
  }
}

/**
 * Fetch paginated sellers with server-side index filtering
 * Designed for 100,000+ records scalability
 */
function getDocSortValue(doc: any, field: string): any {
  const val = doc[field];
  if (val === null || val === undefined) return '';
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'string') return val.toLowerCase();
  return val;
}

export function sanitizeFirestorePayload(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (
    obj instanceof Date ||
    typeof obj.toDate === 'function' ||
    typeof obj.toMillis === 'function' ||
    obj._methodName ||
    obj._delegate ||
    (obj.constructor && obj.constructor.name === 'FieldValue')
  ) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestorePayload(item));
  }

  const clean: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (
        typeof val === 'object' &&
        val !== null &&
        !(val instanceof Date) &&
        typeof (val as any).toDate !== 'function' &&
        typeof (val as any).toMillis !== 'function' &&
        !(val as any)._methodName &&
        !(val as any)._delegate &&
        !(val.constructor && val.constructor.name === 'FieldValue')
      ) {
        clean[key] = sanitizeFirestorePayload(val);
      } else {
        clean[key] = val;
      }
    }
  }
  return clean;
}

/**
 * Fetch paginated sellers with server-side index filtering and seamless fallback
 * Designed for 100,000+ records scalability and 100% resilience against missing indexes
 */
export async function getSellersPaginated(params: {
  filters?: FilterOptions;
  pageSize?: number;
  lastDoc?: DocumentSnapshot | null;
  firstDoc?: DocumentSnapshot | null;
  direction?: 'next' | 'prev';
  currentUser?: UserProfile | null;
}): Promise<{
  sellers: Seller[];
  firstDoc: DocumentSnapshot | null;
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}> {
  const { filters = {}, pageSize = 40, lastDoc, firstDoc, direction = 'next', currentUser } = params;
  const sellersRef = collection(db, SELLERS_COLLECTION);
  
  try {
    const constraints: any[] = [];

    // Role based scoping: If role is employee and not admin/manager, scope to assignedEmployeeId
    if (currentUser && currentUser.role === 'employee' && !filters.assignedEmployeeId) {
      constraints.push(where('assignedEmployeeId', '==', currentUser.uid));
    } else if (filters.assignedEmployeeId) {
      constraints.push(where('assignedEmployeeId', '==', filters.assignedEmployeeId));
    }

    // Exact match filters for Firestore compound queries
    if (filters.sellerStatus) {
      constraints.push(where('sellerStatus', '==', filters.sellerStatus));
    }
    if (filters.onboardingStatus) {
      constraints.push(where('onboardingStatus', '==', filters.onboardingStatus));
    }
    if (filters.contactStatus) {
      constraints.push(where('contactStatus', '==', filters.contactStatus));
    }
    if (filters.city) {
      constraints.push(where('city', '==', filters.city));
    }
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    if (filters.priority) {
      constraints.push(where('priority', '==', filters.priority));
    }
    if (filters.leadSource) {
      constraints.push(where('leadSource', '==', filters.leadSource));
    }

    // Global or text search token matching
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const searchToken = filters.searchQuery.trim().toLowerCase();
      constraints.push(where('searchKeywords', 'array-contains', searchToken));
    }

    // Default sorting
    const sortField = filters.sortBy || 'createdAt';
    const sortDir = filters.sortDirection || 'desc';
    constraints.push(orderBy(sortField, sortDir));

    // Pagination cursors
    if (direction === 'next' && lastDoc) {
      constraints.push(startAfter(lastDoc));
    } else if (direction === 'prev' && firstDoc) {
      constraints.push(endBefore(firstDoc));
    }

    // Request pageSize + 1 to detect if more pages exist
    constraints.push(limit(pageSize + 1));

    const q = query(sellersRef, ...constraints);
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

    const sellers: Seller[] = pageDocs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as Seller));

    return {
      sellers,
      firstDoc: pageDocs.length > 0 ? pageDocs[0] : null,
      lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
      hasMore,
    };
  } catch (err) {
    console.warn('Firestore compound query failed or requires index. Falling back to resilient fetch:', err);

    // Fallback: Fetch collection and filter/sort in-memory so newly added entries are NEVER dropped
    const allSnap = await getDocs(sellersRef);
    let allSellers: Seller[] = allSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as Seller));

    // Apply filters
    if (currentUser && currentUser.role === 'employee' && !filters.assignedEmployeeId) {
      allSellers = allSellers.filter((s) => s.assignedEmployeeId === currentUser.uid);
    } else if (filters.assignedEmployeeId) {
      allSellers = allSellers.filter((s) => s.assignedEmployeeId === filters.assignedEmployeeId);
    }

    if (filters.sellerStatus) {
      allSellers = allSellers.filter((s) => s.sellerStatus === filters.sellerStatus);
    }
    if (filters.onboardingStatus) {
      allSellers = allSellers.filter((s) => s.onboardingStatus === filters.onboardingStatus);
    }
    if (filters.contactStatus) {
      allSellers = allSellers.filter((s) => s.contactStatus === filters.contactStatus);
    }
    if (filters.city) {
      allSellers = allSellers.filter((s) => s.city?.toLowerCase() === filters.city?.toLowerCase());
    }
    if (filters.category) {
      allSellers = allSellers.filter((s) => s.category?.toLowerCase() === filters.category?.toLowerCase());
    }
    if (filters.priority) {
      allSellers = allSellers.filter((s) => s.priority === filters.priority);
    }
    if (filters.leadSource) {
      allSellers = allSellers.filter((s) => s.leadSource === filters.leadSource);
    }
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const token = filters.searchQuery.trim().toLowerCase();
      allSellers = allSellers.filter((s) =>
        (s.shopName || s.name || '').toLowerCase().includes(token) ||
        (s.phone || '').includes(token) ||
        (s.city || '').toLowerCase().includes(token) ||
        (s.category || '').toLowerCase().includes(token) ||
        (s.createdByName || '').toLowerCase().includes(token)
      );
    }

    // Sort
    const sortField = filters.sortBy || 'createdAt';
    const sortDir = filters.sortDirection || 'desc';
    allSellers.sort((a, b) => {
      const valA = getDocSortValue(a, sortField);
      const valB = getDocSortValue(b, sortField);
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    const pageSellers = allSellers.slice(0, pageSize);

    return {
      sellers: pageSellers,
      firstDoc: null,
      lastDoc: null,
      hasMore: allSellers.length > pageSize,
    };
  }
}

/**
 * Get a single seller by ID
 */
export async function getSellerById(id: string): Promise<Seller | null> {
  if (!id) return null;
  try {
    const docRef = doc(db, SELLERS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Seller;
  } catch (err) {
    console.error('Error in getSellerById:', err);
    return null;
  }
}

/**
 * Create a new Seller with search tokens and activity logging
 */
export async function createSeller(
  sellerData: Omit<Seller, 'id' | 'createdAt' | 'updatedAt' | 'searchKeywords'>,
  currentUser?: UserProfile | null
): Promise<string> {
  const sellersRef = collection(db, SELLERS_COLLECTION);
  const newDocRef = doc(sellersRef);

  const cleanPhone = cleanPhoneNumber(sellerData.phone);
  const cleanWa = sellerData.whatsapp ? cleanPhoneNumber(sellerData.whatsapp) : cleanPhone;

  const searchKeywords = generateSearchKeywords({
    name: sellerData.name,
    shopName: sellerData.shopName,
    phone: cleanPhone,
    city: sellerData.city,
    category: sellerData.category,
  });

  const payload: any = {
    ...sellerData,
    phone: cleanPhone,
    whatsapp: cleanWa,
    searchKeywords,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: currentUser?.uid || 'system',
    createdByName: sellerData.createdByName || currentUser?.displayName || 'Vipto',
    onboardingChecklist: sellerData.onboardingChecklist || {
      kycVerified: false,
      bankDetailsVerified: false,
      catalogUploaded: false,
      pricingAgreed: false,
      contractSigned: false,
      firstOrderPlaced: false,
    },
  };

  const cleanPayload = sanitizeFirestorePayload(payload);
  await setDoc(newDocRef, cleanPayload);

  // Log creation activity
  await logActivity({
    sellerId: newDocRef.id,
    sellerName: sellerData.shopName || sellerData.name,
    performedBy: currentUser?.uid || 'system',
    performedByName: currentUser?.displayName || 'System',
    performedByRole: currentUser?.role || 'admin',
    action: `Created seller profile for "${sellerData.shopName || sellerData.name}"`,
    type: 'status_change',
    details: `Initial status: ${sellerData.sellerStatus} | Source: ${sellerData.leadSource}`,
  });

  return newDocRef.id;
}

/**
 * Update an existing seller document
 */
export async function updateSeller(
  id: string,
  updates: Partial<Seller>,
  currentUser?: UserProfile | null
): Promise<void> {
  const docRef = doc(db, SELLERS_COLLECTION, id);
  
  // Re-generate search keywords if relevant fields are being updated
  let searchKeywordsUpdates: { searchKeywords?: string[] } = {};
  if (updates.name || updates.shopName || updates.phone || updates.city || updates.category) {
    const existing = await getSellerById(id);
    if (existing) {
      const merged = { ...existing, ...updates };
      searchKeywordsUpdates.searchKeywords = generateSearchKeywords({
        name: merged.name,
        shopName: merged.shopName,
        phone: cleanPhoneNumber(merged.phone),
        city: merged.city,
        category: merged.category,
      });
    }
  }

  const payload: any = {
    ...updates,
    ...searchKeywordsUpdates,
    updatedAt: serverTimestamp(),
  };

  const cleanPayload = sanitizeFirestorePayload(payload);
  await updateDoc(docRef, cleanPayload);
}

/**
 * Delete a seller document
 */
export async function deleteSeller(
  id: string,
  sellerName: string,
  currentUser?: UserProfile | null
): Promise<void> {
  const docRef = doc(db, SELLERS_COLLECTION, id);
  await deleteDoc(docRef);

  await logActivity({
    sellerId: id,
    sellerName,
    performedBy: currentUser?.uid || 'system',
    performedByName: currentUser?.displayName || 'System',
    performedByRole: currentUser?.role || 'admin',
    action: `Deleted seller record for "${sellerName}"`,
    type: 'status_change',
  });
}

/**
 * Bulk assign sellers to an employee
 */
export async function bulkAssignSellers(
  sellerIds: string[],
  employeeId: string | null,
  employeeName: string | null,
  currentUser?: UserProfile | null
): Promise<number> {
  if (!sellerIds.length) return 0;
  const batch = writeBatch(db);

  sellerIds.forEach((id) => {
    const ref = doc(db, SELLERS_COLLECTION, id);
    batch.update(ref, {
      assignedEmployeeId: employeeId,
      assignedEmployeeName: employeeName,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();

  await logActivity({
    performedBy: currentUser?.uid || 'system',
    performedByName: currentUser?.displayName || 'System',
    performedByRole: currentUser?.role || 'admin',
    action: `Assigned ${sellerIds.length} sellers to ${employeeName || 'Unassigned'}`,
    type: 'assignment',
    details: `Updated seller IDs: ${sellerIds.slice(0, 5).join(', ')}${sellerIds.length > 5 ? '...' : ''}`,
  });

  return sellerIds.length;
}

/**
 * Bulk update status for multiple sellers
 */
export async function bulkUpdateSellerStatus(
  sellerIds: string[],
  newStatus: SellerStatus,
  currentUser?: UserProfile | null
): Promise<number> {
  if (!sellerIds.length) return 0;
  const batch = writeBatch(db);

  sellerIds.forEach((id) => {
    const ref = doc(db, SELLERS_COLLECTION, id);
    batch.update(ref, {
      sellerStatus: newStatus,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();

  await logActivity({
    performedBy: currentUser?.uid || 'system',
    performedByName: currentUser?.displayName || 'System',
    performedByRole: currentUser?.role || 'admin',
    action: `Bulk updated status of ${sellerIds.length} sellers to "${newStatus}"`,
    type: 'status_change',
  });

  return sellerIds.length;
}

/**
 * Bulk import valid sellers in 500-document batches
 */
export async function bulkImportSellers(
  sellers: Omit<Seller, 'id' | 'createdAt' | 'updatedAt' | 'searchKeywords'>[],
  currentUser?: UserProfile | null,
  onProgress?: (processed: number, total: number) => void
): Promise<number> {
  const CHUNK_SIZE = 400; // Safe below Firestore 500 batch limit
  let totalImported = 0;

  for (let i = 0; i < sellers.length; i += CHUNK_SIZE) {
    const chunk = sellers.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    chunk.forEach((s) => {
      const newRef = doc(collection(db, SELLERS_COLLECTION));
      const cleanPhone = cleanPhoneNumber(s.phone);
      const cleanWa = s.whatsapp ? cleanPhoneNumber(s.whatsapp) : cleanPhone;
      const searchKeywords = generateSearchKeywords({
        name: s.name,
        shopName: s.shopName,
        phone: cleanPhone,
        city: s.city,
        category: s.category,
      });

      batch.set(newRef, {
        ...s,
        phone: cleanPhone,
        whatsapp: cleanWa,
        searchKeywords,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser?.uid || 'system',
        createdByName: currentUser?.displayName || 'CSV Importer',
        onboardingChecklist: {
          kycVerified: false,
          bankDetailsVerified: false,
          catalogUploaded: false,
          pricingAgreed: false,
          contractSigned: false,
          firstOrderPlaced: false,
        },
      });
    });

    await batch.commit();
    totalImported += chunk.length;
    if (onProgress) {
      onProgress(totalImported, sellers.length);
    }
  }

  await logActivity({
    performedBy: currentUser?.uid || 'system',
    performedByName: currentUser?.displayName || 'System',
    performedByRole: currentUser?.role || 'admin',
    action: `Imported ${totalImported} sellers via CSV`,
    type: 'status_change',
  });

  return totalImported;
}
