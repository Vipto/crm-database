import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Store,
  User,
  Filter,
  Phone,
} from 'lucide-react';
import { TaskModal } from './TaskModal';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { TableSkeleton } from '../common/SkeletonLoader';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { CRMTask, Employee, Seller } from '../../types';
import { getTasks, completeTask, deleteTask } from '../../lib/db/tasks';
import { getEmployees } from '../../lib/db/employees';
import { getSellersPaginated } from '../../lib/db/sellers';
import { formatCRMDate, formatRelativeTime, isFollowUpOverdue, isFollowUpToday } from '../../lib/utils/formatters';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

type TaskTab = 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';

export const TasksView: React.FC = () => {
  const {
    isAddTaskOpen,
    setIsAddTaskOpen,
    setSelectedSellerId,
    refreshKey,
    triggerRefresh,
  } = useCRM();

  const { currentUser, isAdmin, isManager } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<TaskTab>('today');
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [editingTask, setEditingTask] = useState<CRMTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<CRMTask | null>(null);

  useEffect(() => {
    getEmployees().then(setEmployees).catch(console.error);
    getSellersPaginated({ pageSize: 100 }).then((r) => setSellers(r.sellers)).catch(console.error);
  }, [refreshKey]);

  useEffect(() => {
    let mounted = true;
    async function loadTasksData() {
      setLoading(true);
      try {
        const res = await getTasks({
          employeeId: selectedEmployeeId || undefined,
          viewMode: activeTab,
        });
        if (mounted) {
          setTasks(res);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    loadTasksData();
    return () => {
      mounted = false;
    };
  }, [activeTab, selectedEmployeeId, refreshKey]);

  const handleResolve = async (task: CRMTask) => {
    try {
      await completeTask(task.id, currentUser);
      success('Task Completed', `"${task.title}" has been marked complete.`);
      triggerRefresh();
    } catch (err: any) {
      error('Failed to complete task', err?.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    try {
      await deleteTask(deletingTask.id);
      success('Task Deleted', 'Task removed successfully.');
      setDeletingTask(null);
      triggerRefresh();
    } catch (err: any) {
      error('Failed to delete task', err?.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Outfit']">
            Tasks & Follow-up Execution
          </h1>
          <p className="text-xs text-slate-400">
            Never miss a seller touchpoint, scheduled call, or verification deadline.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setIsAddTaskOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-vipto-600 hover:bg-vipto-500 text-white text-xs font-semibold shadow-lg shadow-vipto-900/40 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Tabs & Employee Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'today'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today's Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'upcoming'
                ? 'bg-blue-950/60 text-blue-300 border border-blue-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Upcoming</span>
          </button>

          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'overdue'
                ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Overdue</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            All Tasks
          </button>
        </div>

        {/* Filter by assigned employee */}
        {(isAdmin || isManager) && (
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-vipto-500"
            >
              <option value="">All Team Tasks</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Task List Render */}
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No Tasks in this Tab"
          description={`There are no tasks matching "${activeTab}" status.`}
          actionText="Create New Task"
          onAction={() => setIsAddTaskOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const isCompleted = task.status === 'Completed';
            const isOverdue = !isCompleted && isFollowUpOverdue(task.dueDate);
            const isToday = !isCompleted && isFollowUpToday(task.dueDate);

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 shadow-card ${
                  isCompleted
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                    : isOverdue
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : isToday
                    ? 'bg-amber-950/15 border-amber-500/30'
                    : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => !isCompleted && handleResolve(task)}
                        disabled={isCompleted}
                        className={`mt-0.5 p-1 rounded-lg border transition-colors shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 cursor-default'
                            : 'border-slate-700 hover:border-emerald-400 text-slate-500 hover:text-emerald-400'
                        }`}
                        title={isCompleted ? 'Completed' : 'Click to complete'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <div className="min-w-0">
                        <h4
                          className={`font-semibold text-xs leading-relaxed ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
                          }`}
                        >
                          {task.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300">
                            {task.taskType}
                          </span>
                          <StatusBadge status={task.priority} type="priority" size="sm" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setIsAddTaskOpen(true);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-white"
                        title="Edit Task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingTask(task)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {task.notes && (
                    <p className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed">
                      {task.notes}
                    </p>
                  )}
                </div>

                {/* Footer metadata */}
                <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  {task.sellerId ? (
                    <button
                      onClick={() => task.sellerId && setSelectedSellerId(task.sellerId)}
                      className="flex items-center gap-1.5 text-vipto-400 hover:text-vipto-300 font-medium truncate"
                    >
                      <Store className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{task.sellerName || 'View Seller'}</span>
                    </button>
                  ) : (
                    <span className="text-slate-500">General Task</span>
                  )}

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-400">
                      Assigned: <strong className="text-slate-200">{task.assignedEmployeeName}</strong>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className={isOverdue ? 'text-rose-400 font-bold' : ''}>
                      {formatCRMDate(task.dueDate, 'dd MMM, hh:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={isAddTaskOpen}
        onClose={() => {
          setIsAddTaskOpen(false);
          setEditingTask(null);
        }}
        employees={employees}
        sellers={sellers}
        taskToEdit={editingTask}
      />

      {/* Delete Confirmation Modal */}
      {deletingTask && (
        <ConfirmationModal
          isOpen={Boolean(deletingTask)}
          onClose={() => setDeletingTask(null)}
          onConfirm={handleDelete}
          title="Delete Task"
          message={`Are you sure you want to delete the task "${deletingTask.title}"?`}
          confirmText="Delete Task"
          isDestructive={true}
        />
      )}
    </div>
  );
};
