import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { CRMTask, TaskStatus, TaskType, LeadPriority, UserProfile } from '../../types';
import { logActivity } from './activities';
import { isToday, isPast, isFuture, startOfDay, endOfDay } from 'date-fns';

const TASKS_COLLECTION = 'tasks';

/**
 * Fetch CRM tasks filtered by scope or employee
 */
export async function getTasks(params: {
  employeeId?: string;
  status?: TaskStatus;
  viewMode?: 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';
  limitCount?: number;
}): Promise<CRMTask[]> {
  try {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const constraints: any[] = [];

    if (params.employeeId) {
      constraints.push(where('assignedEmployeeId', '==', params.employeeId));
    }

    if (params.status) {
      constraints.push(where('status', '==', params.status));
    }

    // Default order by dueDate asc
    constraints.push(orderBy('dueDate', 'asc'));
    constraints.push(limit(params.limitCount || 100));

    const q = query(tasksRef, ...constraints);
    const snapshot = await getDocs(q);

    let tasks: CRMTask[] = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
      } as CRMTask;
    });

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Filter according to viewMode in-memory for precise date math
    if (params.viewMode === 'today') {
      tasks = tasks.filter(t => {
        if (t.status === 'Completed') return false;
        const d = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
        return d >= todayStart && d <= todayEnd;
      });
    } else if (params.viewMode === 'overdue') {
      tasks = tasks.filter(t => {
        if (t.status === 'Completed') return false;
        const d = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
        return d < todayStart;
      });
    } else if (params.viewMode === 'upcoming') {
      tasks = tasks.filter(t => {
        if (t.status === 'Completed') return false;
        const d = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
        return d > todayEnd;
      });
    } else if (params.viewMode === 'completed') {
      tasks = tasks.filter(t => t.status === 'Completed');
    }

    return tasks;
  } catch (err) {
    console.error('Error fetching tasks:', err);
    return [];
  }
}

/**
 * Fetch tasks linked to a specific seller
 */
export async function getTasksForSeller(sellerId: string): Promise<CRMTask[]> {
  if (!sellerId) return [];
  try {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const q = query(tasksRef, where('sellerId', '==', sellerId), orderBy('dueDate', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CRMTask));
  } catch (err) {
    console.error('Error fetching seller tasks:', err);
    return [];
  }
}

/**
 * Create a new task
 */
export async function createTask(
  taskData: {
    title: string;
    sellerId?: string;
    sellerName?: string;
    sellerPhone?: string;
    assignedEmployeeId: string;
    assignedEmployeeName: string;
    dueDate: Date | string | any;
    priority: LeadPriority;
    taskType: TaskType;
    status: TaskStatus;
    notes?: string;
  },
  currentUser?: UserProfile | null
): Promise<string> {
  const tasksRef = collection(db, TASKS_COLLECTION);
  let dueTimestamp = taskData.dueDate;
  if (taskData.dueDate instanceof Date) {
    dueTimestamp = Timestamp.fromDate(taskData.dueDate);
  } else if (typeof taskData.dueDate === 'string') {
    dueTimestamp = Timestamp.fromDate(new Date(taskData.dueDate));
  }

  const docSnap = await addDoc(tasksRef, {
    ...taskData,
    dueDate: dueTimestamp,
    createdAt: serverTimestamp(),
    createdBy: currentUser?.uid || 'system',
  });

  if (taskData.sellerId) {
    await logActivity({
      sellerId: taskData.sellerId,
      sellerName: taskData.sellerName,
      performedBy: currentUser?.uid || 'system',
      performedByName: currentUser?.displayName || 'System',
      action: `Created task: "${taskData.title}" (${taskData.taskType})`,
      type: 'task',
      details: `Assigned to: ${taskData.assignedEmployeeName}`,
    });
  }

  return docSnap.id;
}

/**
 * Update task
 */
export async function updateTask(
  id: string,
  updates: Partial<CRMTask>,
  currentUser?: UserProfile | null
): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, id);
  let formattedUpdates: any = { ...updates };
  if (updates.dueDate instanceof Date) {
    formattedUpdates.dueDate = Timestamp.fromDate(updates.dueDate);
  }
  await updateDoc(docRef, formattedUpdates);
}

/**
 * Mark a task as completed
 */
export async function completeTask(
  id: string,
  currentUser?: UserProfile | null
): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const task = snap.data() as CRMTask;

  await updateDoc(docRef, {
    status: 'Completed',
    completedAt: serverTimestamp(),
  });

  if (task.sellerId) {
    await logActivity({
      sellerId: task.sellerId,
      sellerName: task.sellerName,
      performedBy: currentUser?.uid || 'system',
      performedByName: currentUser?.displayName || 'System',
      action: `Completed task: "${task.title}"`,
      type: 'task',
    });
  }
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, id);
  await deleteDoc(docRef);
}
