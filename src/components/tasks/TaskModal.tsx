import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Clock, User, Store, Sparkles, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { CRMTask, Employee, LeadPriority, Seller, TaskType } from '../../types';
import { createTask, updateTask } from '../../lib/db/tasks';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCRM } from '../../context/CRMContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  sellers?: Seller[];
  taskToEdit?: CRMTask | null;
}

const TASK_TYPES: TaskType[] = [
  'Call task',
  'WhatsApp follow-up',
  'Seller onboarding task',
  'Research task',
  'Verification task',
  'General task',
];

const PRIORITIES: LeadPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  employees,
  sellers = [],
  taskToEdit,
}) => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const { triggerRefresh } = useCRM();

  const [formData, setFormData] = useState({
    title: '',
    sellerId: '',
    assignedEmployeeId: '',
    dueDate: '',
    priority: 'Medium' as LeadPriority,
    taskType: 'Call task' as TaskType,
    notes: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      let dStr = '';
      if (taskToEdit.dueDate?.toDate) {
        dStr = taskToEdit.dueDate.toDate().toISOString().slice(0, 16);
      } else if (taskToEdit.dueDate) {
        dStr = new Date(taskToEdit.dueDate).toISOString().slice(0, 16);
      }

      setFormData({
        title: taskToEdit.title,
        sellerId: taskToEdit.sellerId || '',
        assignedEmployeeId: taskToEdit.assignedEmployeeId,
        dueDate: dStr,
        priority: taskToEdit.priority,
        taskType: taskToEdit.taskType,
        notes: taskToEdit.notes || '',
      });
    } else {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setFormData({
        title: '',
        sellerId: '',
        assignedEmployeeId: currentUser?.uid || employees[0]?.id || '',
        dueDate: tomorrow.toISOString().slice(0, 16),
        priority: 'Medium',
        taskType: 'Call task',
        notes: '',
      });
    }
  }, [taskToEdit, isOpen, currentUser, employees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.dueDate) {
      error('Required Fields', 'Please enter a title and due date.');
      return;
    }

    try {
      setLoading(true);
      const assignedEmp = employees.find((e) => e.id === formData.assignedEmployeeId);
      const linkedSeller = sellers.find((s) => s.id === formData.sellerId);

      const payload = {
        title: formData.title.trim(),
        sellerId: formData.sellerId || undefined,
        sellerName: linkedSeller?.shopName || linkedSeller?.name || undefined,
        sellerPhone: linkedSeller?.phone || undefined,
        assignedEmployeeId: formData.assignedEmployeeId,
        assignedEmployeeName: assignedEmp?.name || currentUser?.displayName || 'CRM Staff',
        dueDate: new Date(formData.dueDate),
        priority: formData.priority,
        taskType: formData.taskType,
        status: taskToEdit ? taskToEdit.status : ('Pending' as const),
        notes: formData.notes.trim() || undefined,
      };

      if (taskToEdit) {
        await updateTask(taskToEdit.id, payload, currentUser);
        success('Task Updated', 'Follow-up task updated successfully.');
      } else {
        await createTask(payload as any, currentUser);
        success('Task Scheduled', 'Follow-up task created.');
      }

      triggerRefresh();
      onClose();
    } catch (err: any) {
      error('Failed to save task', err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'Schedule New CRM Task'}
      subtitle="Create follow-ups, calls, onboarding reminders, or verification visits."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="text-slate-300 font-medium block">
            Task Title / Objective <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Call owner to confirm GST registration & pickup location"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-vipto-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-slate-300 font-medium block mb-1">
              Due Date & Time <span className="text-rose-400">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-vipto-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Task Type</label>
            <select
              value={formData.taskType}
              onChange={(e) => setFormData({ ...formData, taskType: e.target.value as TaskType })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-vipto-500 cursor-pointer"
            >
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Assigned Employee</label>
            <select
              value={formData.assignedEmployeeId}
              onChange={(e) => setFormData({ ...formData, assignedEmployeeId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-vipto-500 cursor-pointer"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.assignedLocation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as LeadPriority })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-vipto-500 cursor-pointer"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-slate-300 font-medium block mb-1">Linked Seller (Optional)</label>
          <select
            value={formData.sellerId}
            onChange={(e) => setFormData({ ...formData, sellerId: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-vipto-500 cursor-pointer"
          >
            <option value="">No linked seller (General Task)</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.shopName || s.name} ({s.city})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-slate-300 font-medium block mb-1">Additional Notes</label>
          <textarea
            rows={2}
            placeholder="Context, agenda, or background details..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-vipto-500"
          />
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-vipto-600 hover:bg-vipto-500 text-white font-semibold shadow-lg shadow-vipto-900/40 disabled:opacity-50 transition-all hover:scale-105"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Schedule Task'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
