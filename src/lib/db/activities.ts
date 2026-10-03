import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Activity, ActivityType } from '../../types';

const ACTIVITIES_COLLECTION = 'activities';

/**
 * Log an activity to the audit trail
 */
export async function logActivity(activity: {
  sellerId?: string;
  sellerName?: string;
  performedBy: string;
  performedByName: string;
  performedByRole?: string;
  action: string;
  details?: string;
  type: ActivityType;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    const ref = collection(db, ACTIVITIES_COLLECTION);
    const docSnap = await addDoc(ref, {
      ...activity,
      timestamp: serverTimestamp(),
    });
    return docSnap.id;
  } catch (err) {
    console.error('Failed to log activity:', err);
    return '';
  }
}

/**
 * Get recent activity feed across the entire CRM
 */
export async function getRecentActivities(maxCount: number = 20): Promise<Activity[]> {
  try {
    const ref = collection(db, ACTIVITIES_COLLECTION);
    const q = query(ref, orderBy('timestamp', 'desc'), limit(maxCount));
    const snap = await getDocs(q);

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    } as Activity));
  } catch (err) {
    console.error('Error fetching recent activities:', err);
    return [];
  }
}

/**
 * Get activity timeline for a specific seller
 */
export async function getSellerActivities(sellerId: string, maxCount: number = 50): Promise<Activity[]> {
  if (!sellerId) return [];
  try {
    const ref = collection(db, ACTIVITIES_COLLECTION);
    const q = query(
      ref,
      where('sellerId', '==', sellerId),
      orderBy('timestamp', 'desc'),
      limit(maxCount)
    );
    const snap = await getDocs(q);

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    } as Activity));
  } catch (err) {
    console.error('Error fetching seller activities:', err);
    return [];
  }
}
