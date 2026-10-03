import React, { useState } from 'react';
import { Users, Check, UserX } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Employee } from '../../types';

interface AssignSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (employeeId: string | null, employeeName: string | null) => Promise<void>;
  employees: Employee[];
  sellerCount: number;
}

export const AssignSellerModal: React.FC<AssignSellerModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  employees,
  sellerCount,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedEmpId === 'unassign') {
        await onAssign(null, null);
      } else {
        const emp = employees.find((e) => e.id === selectedEmpId);
        await onAssign(selectedEmpId, emp?.name || null);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign ${sellerCount} Seller${sellerCount > 1 ? 's' : ''}`}
      subtitle="Select a team member to manage the seller lifecycle and communications."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-2">
          <label className="text-slate-300 font-medium">Select Employee / Account Manager</label>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <div
              onClick={() => setSelectedEmpId('unassign')}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedEmpId === 'unassign'
                  ? 'border-vipto-500 bg-vipto-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-200">Unassign (Leave in Pool)</p>
                  <p className="text-[11px] text-slate-500">Remove current assignment</p>
                </div>
              </div>
              {selectedEmpId === 'unassign' && <Check className="w-4 h-4 text-vipto-400" />}
            </div>

            {employees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => setSelectedEmpId(emp.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedEmpId === emp.id
                    ? 'border-vipto-500 bg-vipto-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                    {emp.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">{emp.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {emp.role.toUpperCase()} • {emp.assignedLocation} ({emp.stats?.assignedSellersCount || 0} active)
                    </p>
                  </div>
                </div>
                {selectedEmpId === emp.id && <Check className="w-4 h-4 text-vipto-400" />}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedEmpId || loading}
            className="px-5 py-2 rounded-xl bg-vipto-600 hover:bg-vipto-500 text-white font-semibold shadow-lg shadow-vipto-900/40 disabled:opacity-50 transition-all"
          >
            {loading ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
