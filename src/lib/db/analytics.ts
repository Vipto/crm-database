import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { DashboardMetrics, Seller, CRMTask } from '../../types';
import { isToday, startOfDay, endOfDay, subDays, format, parseISO } from 'date-fns';

const SELLERS_COLLECTION = 'sellers';
const EMPLOYEES_COLLECTION = 'employees';
const TASKS_COLLECTION = 'tasks';

/**
 * Fetch and compute actual real-time analytics directly from Firestore collections
 * Zero fake metrics - 100% computed from live data
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    // 1. Fetch sellers collection
    const sellersSnap = await getDocs(collection(db, SELLERS_COLLECTION));
    const employeesSnap = await getDocs(collection(db, EMPLOYEES_COLLECTION));
    const tasksSnap = await getDocs(collection(db, TASKS_COLLECTION));

    const sellers: Seller[] = sellersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Seller));
    const tasks: CRMTask[] = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as CRMTask));

    let totalSellers = sellers.length;
    let newSellers = 0;
    let contactedSellers = 0;
    let followUpRequired = 0;
    let interestedSellers = 0;
    let onboardingInProgress = 0;
    let onboardedSellers = 0;
    let notInterestedSellers = 0;

    const cityCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const employeeStatsMap: Record<string, { name: string; count: number; completed: number }> = {};
    const monthAcquisitionMap: Record<string, { count: number; onboarded: number }> = {};
    const weekdayAdditionsMap: Record<string, number> = {
      'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
    };

    employeesSnap.docs.forEach(docSnap => {
      const e = docSnap.data();
      employeeStatsMap[docSnap.id] = {
        name: e.name || 'Staff',
        count: 0,
        completed: 0,
      };
    });

    sellers.forEach(seller => {
      // Status counts
      switch (seller.sellerStatus) {
        case 'New':
          newSellers++;
          break;
        case 'Contacted':
          contactedSellers++;
          break;
        case 'Follow-up Required':
          followUpRequired++;
          break;
        case 'Interested':
          interestedSellers++;
          break;
        case 'Onboarding Started':
          onboardingInProgress++;
          break;
        case 'Onboarded':
          onboardedSellers++;
          break;
        case 'Not Interested':
        case 'Invalid Lead':
        case 'Lost':
        case 'Unresponsive':
          notInterestedSellers++;
          break;
        default:
          break;
      }

      // City distribution
      const city = seller.city ? seller.city.trim() : 'Other';
      cityCounts[city] = (cityCounts[city] || 0) + 1;

      // Category distribution
      const category = seller.category ? seller.category.trim() : 'General';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      // Employee assignments
      if (seller.assignedEmployeeId && employeeStatsMap[seller.assignedEmployeeId]) {
        employeeStatsMap[seller.assignedEmployeeId].count++;
        if (seller.sellerStatus === 'Onboarded' || seller.onboardingStatus === 'Completed') {
          employeeStatsMap[seller.assignedEmployeeId].completed++;
        }
      }

      // Acquisition by month
      if (seller.createdAt) {
        let createdDate: Date;
        if (seller.createdAt.toDate) createdDate = seller.createdAt.toDate();
        else if (seller.createdAt.seconds) createdDate = new Date(seller.createdAt.seconds * 1000);
        else createdDate = new Date(seller.createdAt);

        if (!isNaN(createdDate.getTime())) {
          const monthKey = format(createdDate, 'MMM yyyy');
          if (!monthAcquisitionMap[monthKey]) {
            monthAcquisitionMap[monthKey] = { count: 0, onboarded: 0 };
          }
          monthAcquisitionMap[monthKey].count++;
          if (seller.sellerStatus === 'Onboarded' || seller.onboardingStatus === 'Completed') {
            monthAcquisitionMap[monthKey].onboarded++;
          }

          const dayKey = format(createdDate, 'EEE');
          if (weekdayAdditionsMap[dayKey] !== undefined) {
            weekdayAdditionsMap[dayKey]++;
          }
        }
      }
    });

    // Compute Tasks Due Today
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const tasksDueToday = tasks.filter(t => {
      if (t.status === 'Completed') return false;
      const d = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
      return d >= todayStart && d <= todayEnd;
    }).length;

    // Build Chart Arrays
    const sellersByCity = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    const sellersByCategory = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const sellersByEmployee = Object.values(employeeStatsMap)
      .filter(e => e.count > 0 || e.completed > 0)
      .slice(0, 6);

    const acquisitionOverTime = Object.entries(monthAcquisitionMap)
      .map(([date, data]) => ({ date, count: data.count, onboarded: data.onboarded }));

    const weeklyAdditions = Object.entries(weekdayAdditionsMap)
      .map(([day, count]) => ({ day, count }));

    // Onboarding Funnel
    const totalLeadBase = Math.max(totalSellers, 1);
    const contactedCount = totalSellers - newSellers;
    const interestedCount = interestedSellers + onboardingInProgress + onboardedSellers;
    const onboardingStartedCount = onboardingInProgress + onboardedSellers;

    const onboardingFunnel = [
      { stage: 'Discovered / New', count: totalSellers, percentage: 100 },
      { stage: 'Contacted', count: contactedCount, percentage: Math.round((contactedCount / totalLeadBase) * 100) },
      { stage: 'Interested', count: interestedCount, percentage: Math.round((interestedCount / totalLeadBase) * 100) },
      { stage: 'In Onboarding', count: onboardingStartedCount, percentage: Math.round((onboardingStartedCount / totalLeadBase) * 100) },
      { stage: 'Active Onboarded', count: onboardedSellers, percentage: Math.round((onboardedSellers / totalLeadBase) * 100) },
    ];

    return {
      totalSellers,
      newSellers,
      contactedSellers,
      followUpRequired,
      interestedSellers,
      onboardingInProgress,
      onboardedSellers,
      notInterestedSellers,
      totalEmployees: employeesSnap.docs.length,
      tasksDueToday,
      acquisitionOverTime,
      sellersByCity,
      sellersByCategory,
      onboardingFunnel,
      sellersByEmployee,
      weeklyAdditions,
    };
  } catch (err) {
    console.error('Error computing dashboard metrics:', err);
    return {
      totalSellers: 0,
      newSellers: 0,
      contactedSellers: 0,
      followUpRequired: 0,
      interestedSellers: 0,
      onboardingInProgress: 0,
      onboardedSellers: 0,
      notInterestedSellers: 0,
      totalEmployees: 0,
      tasksDueToday: 0,
      acquisitionOverTime: [],
      sellersByCity: [],
      sellersByCategory: [],
      onboardingFunnel: [],
      sellersByEmployee: [],
      weeklyAdditions: [],
    };
  }
}
