import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Tag, Shield, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Employee, UserRole } from '../../types';
import { createEmployee, updateEmployee } from '../../lib/db/employees';
import { useToast } from '../../context/ToastContext';
import { useCRM } from '../../context/CRMContext';
import { isValidEmail, isValidIndianPhone } from '../../lib/utils/validation';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: Employee | null;
}

const ALL_CATEGORIES = [
  'Fashion',
  'Footwear',
  'Electronics',
  'Jewelry',
  'Home & Living',
  'Beauty & Personal Care',
  'Groceries',
  'Kitchen & Dining',
  'Books & Stationery',
  'Handicrafts',
];

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employeeToEdit,
}) => {
  const { success, error } = useToast();
  const { triggerRefresh } = useCRM();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'employee' as UserRole,
    assignedLocation: 'Pune',
    assignedCategories: ['Fashion', 'Footwear'],
    isActive: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        name: employeeToEdit.name,
        email: employeeToEdit.email,
        phone: employeeToEdit.phone,
        role: employeeToEdit.role,
        assignedLocation: employeeToEdit.assignedLocation,
        assignedCategories: employeeToEdit.assignedCategories || [],
        isActive: employeeToEdit.isActive,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'employee',
        assignedLocation: 'Pune',
        assignedCategories: ['Fashion'],
        isActive: true,
      });
    }
  }, [employeeToEdit, isOpen]);

  const toggleCategory = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedCategories: prev.assignedCategories.includes(cat)
        ? prev.assignedCategories.filter((c) => c !== cat)
        : [...prev.assignedCategories, cat],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      error('Validation', 'Please provide name, email, and phone.');
      return;
    }

    try {
      setLoading(true);
      if (employeeToEdit) {
        await updateEmployee(employeeToEdit.id, formData);
        success('Employee Updated', `Updated profile for "${formData.name}".`);
      } else {
        await createEmployee(formData);
        success('Employee Created', `Added "${formData.name}" to team.`);
      }
      triggerRefresh();
      onClose();
    } catch (err: any) {
      error('Failed to save employee', err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? 'Edit Employee Profile' : 'Add New Team Member'}
      subtitle="Configure employee role, market territory, and assigned category verticals."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="text-slate-300 font-medium block">
            Full Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Mihir Patil"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-vipto-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-slate-300 font-medium block mb-1">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="employee@vipto.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-vipto-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">
              Phone Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="10-digit phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-vipto-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Role / Permissions</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-vipto-500 cursor-pointer"
            >
              <option value="employee">Employee (Field / Ops)</option>
              <option value="manager">Manager (Team Lead)</option>
              <option value="admin">Admin (Full Access)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Assigned Location</label>
            <input
              type="text"
              required
              placeholder="e.g. Pune / Maharashtra"
              value={formData.assignedLocation}
              onChange={(e) => setFormData({ ...formData, assignedLocation: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-vipto-500"
            />
          </div>
        </div>

        {/* Assigned Categories */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium block">Assigned Categories</label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
            {ALL_CATEGORIES.map((cat) => {
              const isSelected = formData.assignedCategories.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-vipto-600 border-vipto-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
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
            <span>{loading ? 'Saving...' : employeeToEdit ? 'Save Changes' : 'Create Employee'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
