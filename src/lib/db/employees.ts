import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Employee, UserRole } from '../../types';

const EMPLOYEES_COLLECTION = 'employees';
const SELLERS_COLLECTION = 'sellers';
const TASKS_COLLECTION = 'tasks';

/**
 * Fetch all employees with live calculated workload statistics
 */
export async function getEmployees(): Promise<Employee[]> {
  try {
    const empRef = collection(db, EMPLOYEES_COLLECTION);
    const q = query(empRef, orderBy('name', 'asc'));
    const snap = await getDocs(q);

    const employees: Employee[] = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as Employee));

    // Also fetch counts from sellers and tasks to ensure stats are accurate
    const sellersSnap = await getDocs(collection(db, SELLERS_COLLECTION));
    const tasksSnap = await getDocs(collection(db, TASKS_COLLECTION));

    const statsMap: Record<string, { assigned: number; completed: number; pendingFollowUps: number }> = {};
    employees.forEach(emp => {
      statsMap[emp.id] = { assigned: 0, completed: 0, pendingFollowUps: 0 };
    });

    sellersSnap.docs.forEach(docSnap => {
      const s = docSnap.data();
      const empId = s.assignedEmployeeId;
      if (empId && statsMap[empId]) {
        statsMap[empId].assigned += 1;
        if (s.onboardingStatus === 'Completed' || s.sellerStatus === 'Onboarded') {
          statsMap[empId].completed += 1;
        }
      }
    });

    tasksSnap.docs.forEach(docSnap => {
      const t = docSnap.data();
      const empId = t.assignedEmployeeId;
      if (empId && statsMap[empId] && t.status !== 'Completed') {
        statsMap[empId].pendingFollowUps += 1;
      }
    });

    return employees.map(emp => ({
      ...emp,
      stats: {
        assignedSellersCount: statsMap[emp.id]?.assigned || emp.stats?.assignedSellersCount || 0,
        completedOnboardingsCount: statsMap[emp.id]?.completed || emp.stats?.completedOnboardingsCount || 0,
        pendingFollowUpsCount: statsMap[emp.id]?.pendingFollowUps || emp.stats?.pendingFollowUpsCount || 0,
      }
    }));
  } catch (err) {
    console.error('Error fetching employees:', err);
    return [];
  }
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  if (!id) return null;
  try {
    const docRef = doc(db, EMPLOYEES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Employee;
  } catch (err) {
    console.error('Error getting employee:', err);
    return null;
  }
}

/**
 * Create a new employee
 */
export async function createEmployee(
  employeeData: Omit<Employee, 'id' | 'createdAt' | 'stats'>
): Promise<string> {
  const empRef = collection(db, EMPLOYEES_COLLECTION);
  const newDoc = doc(empRef);

  await setDoc(newDoc, {
    ...employeeData,
    stats: {
      assignedSellersCount: 0,
      completedOnboardingsCount: 0,
      pendingFollowUpsCount: 0,
    },
    createdAt: serverTimestamp(),
  });

  return newDoc.id;
}

/**
 * Update employee profile
 */
export async function updateEmployee(
  id: string,
  updates: Partial<Employee>
): Promise<void> {
  const docRef = doc(db, EMPLOYEES_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Toggle employee active status
 */
export async function toggleEmployeeActive(id: string, currentStatus: boolean): Promise<void> {
  const docRef = doc(db, EMPLOYEES_COLLECTION, id);
  await updateDoc(docRef, {
    isActive: !currentStatus,
    updatedAt: serverTimestamp(),
  });
}
