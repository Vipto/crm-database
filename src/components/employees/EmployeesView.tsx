import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Mail,
  Phone,
  MapPin,
  Tag,
  Shield,
  CheckCircle2,
  Clock,
  Briefcase,
  Edit2,
  ExternalLink,
  Store,
} from 'lucide-react';
import { EmployeeModal } from './EmployeeModal';
import { StatusBadge } from '../common/StatusBadge';
import { TableSkeleton } from '../common/SkeletonLoader';
import { Employee } from '../../types';
import { getEmployees, toggleEmployeeActive } from '../../lib/db/employees';
import { formatPhoneNumber } from '../../lib/utils/formatters';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const EmployeesView: React.FC = () => {
  const { applyQuickFilter, refreshKey, triggerRefresh } = useCRM();
  const { canManageEmployees } = useAuth();
  const { success, error } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadEmployees() {
      setLoading(true);
      try {
        const res = await getEmployees();
        if (mounted) {
          setEmployees(res);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    loadEmployees();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const handleToggleActive = async (emp: Employee) => {
    try {
      await toggleEmployeeActive(emp.id, emp.isActive);
      success('Status Changed', `${emp.name} is now ${emp.isActive ? 'Inactive' : 'Active'}.`);
      triggerRefresh();
    } catch (err: any) {
      error('Toggle failed', err?.message);
    }
  };

  const handleViewAssignedSellers = (emp: Employee) => {
    applyQuickFilter({ assignedEmployeeId: emp.id }, 'sellers', 'all');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Outfit']">
            Team & Employee Management
          </h1>
          <p className="text-xs text-slate-400">
            Monitor team workload distribution, territory ownership, and onboarding productivity.
          </p>
        </div>

        {canManageEmployees && (
          <button
            onClick={() => {
              setEditingEmployee(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-vipto-600 hover:bg-vipto-500 text-white text-xs font-semibold shadow-lg shadow-vipto-900/40 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        )}
      </div>

      {/* Employee Cards Grid */}
      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-card flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="space-y-3">
                {/* Employee Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-vipto-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                      {emp.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{emp.name}</h4>
                      <p className="text-xs text-slate-400">{emp.assignedLocation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={emp.role} type="role" size="sm" />
                    {canManageEmployees && (
                      <button
                        onClick={() => {
                          setEditingEmployee(emp);
                          setIsModalOpen(true);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-white"
                        title="Edit Employee"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Contact items */}
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono">{formatPhoneNumber(emp.phone)}</span>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {(emp.assignedCategories || []).map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                    >
                      {c}
                    </span>
                  ))}
                </div>

                {/* Live Calculated Stats */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Assigned</span>
                    <span className="font-bold text-white text-sm">
                      {emp.stats?.assignedSellersCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Onboarded</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {emp.stats?.completedOnboardingsCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Tasks Due</span>
                    <span className="font-bold text-amber-400 text-sm">
                      {emp.stats?.pendingFollowUpsCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleActive(emp)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    emp.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <span>{emp.isActive ? 'Active' : 'Inactive'}</span>
                </button>

                <button
                  onClick={() => handleViewAssignedSellers(emp)}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-vipto-600 text-slate-200 hover:text-white transition-colors border border-slate-700 font-medium"
                >
                  <Store className="w-3.5 h-3.5 text-vipto-400" />
                  <span>View Sellers</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmployee(null);
        }}
        employeeToEdit={editingEmployee}
      />
    </div>
  );
};
