import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { CRMTask, LeadPriority, Seller, TaskType } from '../../types';
import { getTasksForSeller, createTask, completeTask, deleteTask } from '../../lib/db/tasks';
import { formatCRMDate, formatRelativeTime, isFollowUpOverdue } from '../../lib/utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCRM } from '../../context/CRMContext';

interface TasksTabProps {
  seller: Seller;
}

export const TasksTab: React.FC<TasksTabProps> = ({ seller }) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const { triggerRefresh } = useCRM();

  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Task Form
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<LeadPriority>('Medium');
  const [taskType, setTaskType] = useState<TaskType>('Call task');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadTasks() {
      setLoading(true);
      const res = await getTasksForSeller(seller.id);
      if (mounted) {
        setTasks(res);
        setLoading(false);
      }
    }
    loadTasks();
    return () => {
      mounted = false;
    };
  }, [seller.id]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    try {
      setSubmitting(true);
      await createTask(
        {
          title: title.trim(),
          sellerId: seller.id,
          sellerName: seller.shopName || seller.name,
          sellerPhone: seller.phone,
          assignedEmployeeId: seller.assignedEmployeeId || currentUser?.uid || 'admin-vipto',
          assignedEmployeeName: seller.assignedEmployeeName || currentUser?.displayName || 'Vipto',
          dueDate: new Date(dueDate),
          priority,
          taskType,
          status: 'Pending',
          notes: notes.trim(),
        },
        currentUser
      );

      const refreshed = await getTasksForSeller(seller.id);
      setTasks(refreshed);
      setTitle('');
      setNotes('');
      setIsAddingTask(false);
      success('Task Created', 'Follow-up task scheduled.');
      triggerRefresh();
    } catch (err: any) {
      error('Failed to create task', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await completeTask(taskId, currentUser);
      const refreshed = await getTasksForSeller(seller.id);
      setTasks(refreshed);
      success('Task Completed', 'Marked task as resolved.');
      triggerRefresh();
    } catch (err: any) {
      error('Failed to complete task', err?.message);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      success('Task Deleted', 'Removed task.');
      triggerRefresh();
    } catch (err: any) {
      error('Failed to delete task', err?.message);
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-300">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-vipto-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Follow-up Tasks ({tasks.length})</span>
          </h4>
          <p className="text-[11px] text-slate-400">Assigned follow-ups, calls, and onboarding checkpoints</p>
        </div>

        <button
          onClick={() => setIsAddingTask(!isAddingTask)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-vipto-600 hover:bg-vipto-500 text-white font-semibold shadow-md shadow-vipto-900/30 transition-all hover:scale-105"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAddingTask ? 'Cancel' : 'New Task'}</span>
        </button>
      </div>

      {/* Task Creation Form */}
      {isAddingTask && (
        <form
          onSubmit={handleCreateTask}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl space-y-3 animate-slide-down"
        >
          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Task Title / Action Item</label>
            <input
              type="text"
              required
              placeholder="e.g. Call owner to collect bank cancelled cheque"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-vipto-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Due Date</label>
              <input
                type="datetime-local"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-vipto-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Task Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TaskType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-vipto-500 cursor-pointer"
              >
                <option value="Call task">Call task</option>
                <option value="WhatsApp follow-up">WhatsApp follow-up</option>
                <option value="Seller onboarding task">Seller onboarding task</option>
                <option value="Research task">Research task</option>
                <option value="Verification task">Verification task</option>
                <option value="General task">General task</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as LeadPriority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-vipto-500 cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <textarea
              rows={2}
              placeholder="Additional instructions or context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-vipto-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="px-3 py-1.5 text-slate-400 hover:text-white rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-xl bg-vipto-600 hover:bg-vipto-500 text-white font-semibold shadow-md shadow-vipto-900/40 disabled:opacity-50"
            >
              {submitting ? 'Scheduling...' : 'Save Task'}
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-slate-500 animate-pulse">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 text-slate-500">
            No follow-up tasks currently assigned for this seller.
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = task.status === 'Completed';
            const isOverdue = !isCompleted && isFollowUpOverdue(task.dueDate);

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 ${
                  isCompleted
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : isOverdue
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => !isCompleted && handleComplete(task.id)}
                    disabled={isCompleted}
                    className={`mt-0.5 p-1 rounded-lg border transition-colors ${
                      isCompleted
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 cursor-default'
                        : 'border-slate-700 hover:border-vipto-500 text-slate-500 hover:text-vipto-400'
                    }`}
                    title={isCompleted ? 'Task Completed' : 'Click to complete task'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <div className="space-y-1 min-w-0">
                    <p
                      className={`font-semibold text-xs leading-relaxed ${
                        isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
                      }`}
                    >
                      {task.title}
                    </p>

                    {task.notes && (
                      <p className="text-[11px] text-slate-400 leading-relaxed">{task.notes}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <StatusBadge status={task.priority} type="priority" size="sm" />
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
                        {task.taskType}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] ${
                          isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Due: {formatCRMDate(task.dueDate, 'dd MMM, hh:mm a')}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
                  title="Delete Task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
