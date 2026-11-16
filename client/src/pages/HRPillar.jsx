import React, { useState, useEffect } from 'react';
import api from '../api/client';
import StaffPayroll from './StaffPayroll';
import {
  Users,
  ShieldCheck,
  Calculator,
  UserCheck,
  CheckCircle2,
  RotateCcw,
  Plus,
  Briefcase,
  Lock,
  Check,
  X
} from 'lucide-react';

export default function HRPillar() {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'payroll', 'rbac'

  // Payroll Calculation State
  const [payrollData, setPayrollData] = useState(null);
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  // RBAC State
  const [roles, setRoles] = useState([]);
  const [pillarsList, setPillarsList] = useState([]);
  const [loadingRBAC, setLoadingRBAC] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleForm, setRoleForm] = useState(null);

  const fetchPayroll = async () => {
    try {
      setLoadingPayroll(true);
      const res = await api.hr.getPayrollCalculation();
      if (res.success) {
        setPayrollData(res.payroll);
      }
    } catch (err) {
      console.error('Error fetching payroll:', err);
    } finally {
      setLoadingPayroll(false);
    }
  };

  const fetchRBAC = async () => {
    try {
      setLoadingRBAC(true);
      const res = await api.hr.getRBACMatrix();
      if (res.success) {
        setRoles(res.roles || []);
        setPillarsList(res.pillars || []);
      }
    } catch (err) {
      console.error('Error fetching RBAC:', err);
    } finally {
      setLoadingRBAC(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'payroll') fetchPayroll();
    if (activeTab === 'rbac') fetchRBAC();
  }, [activeTab]);

  const handleTogglePermission = (pillarKey) => {
    if (!roleForm) return;
    setRoleForm(prev => ({
      ...prev,
      [pillarKey]: !prev[pillarKey]
    }));
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleForm) return;
    try {
      const res = await api.hr.updateRBACRole(roleForm.id, roleForm);
      if (res.success) {
        setRoles(prev => prev.map(r => r.id === roleForm.id ? res.role : r));
        setEditingRoleId(null);
        setRoleForm(null);
      } else {
        alert(res.error || 'Failed to update role');
      }
    } catch (err) {
      console.error('Save role error:', err);
      alert(err.message || 'Error updating role');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-teal-400" />
            <span>Pillar 6: HR & Staff Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Team Attendance, Payroll & RBAC Permissions
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            1-Click attendance tracker, pro-rated payroll calculator with deductions, and granular Role-Based Access Control.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'attendance' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Staff & Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'payroll' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Payroll Calculator</span>
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'rbac' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>RBAC Settings</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: STAFF & ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div>
          <StaffPayroll />
        </div>
      )}

      {/* SUB-VIEW 2: MONTHLY PAYROLL CALCULATION */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Monthly Net Salary & Payout Calculation
              </h3>
              <p className="text-xs text-slate-400">
                Calculates pro-rated per-day salaries, attendance deductions (absences & half-days), and bonuses.
              </p>
            </div>
            <button
              onClick={fetchPayroll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Recalculate Payroll</span>
            </button>
          </div>

          {loadingPayroll ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent mx-auto"></div>
              <p className="text-xs font-semibold">Auditing attendance logs & calculating net salaries...</p>
            </div>
          ) : payrollData ? (
            <div className="space-y-5">
              {/* Payroll summary ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Pay Period</span>
                  <div className="text-lg font-black text-white">{payrollData.pay_period}</div>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Total Active Staff</span>
                  <div className="text-xl font-black text-teal-400">{payrollData.total_active_staff} Employees</div>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Total Net Payout Liability</span>
                  <div className="text-2xl font-black text-emerald-400">₹{payrollData.total_payroll_liability}</div>
                </div>
              </div>

              {/* Payroll breakdown table */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-3 px-3">Employee Name</th>
                        <th className="py-3 px-3">Designation</th>
                        <th className="py-3 px-3">Base Salary</th>
                        <th className="py-3 px-3">Attendance Days</th>
                        <th className="py-3 px-3">Deductions</th>
                        <th className="py-3 px-3">Bonus</th>
                        <th className="py-3 px-3 text-right">Net Payable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-200">
                      {payrollData.staff_breakdown?.map((emp) => (
                        <tr key={emp.staff_id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-semibold text-white">
                            <div>{emp.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{emp.phone}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-300">{emp.role}</td>
                          <td className="py-3 px-3 text-slate-300">₹{emp.monthly_base_salary}</td>
                          <td className="py-3 px-3">
                            <span className="text-emerald-400 font-bold">{emp.attendance_summary.present}P</span>
                            {emp.attendance_summary.half_day > 0 && <span className="text-amber-400 ml-1">/{emp.attendance_summary.half_day}HD</span>}
                            {emp.attendance_summary.absent > 0 && <span className="text-rose-400 ml-1">/{emp.attendance_summary.absent}A</span>}
                          </td>
                          <td className="py-3 px-3 text-rose-400">-₹{emp.deductions}</td>
                          <td className="py-3 px-3 text-emerald-400">+₹{emp.bonus}</td>
                          <td className="py-3 px-3 text-right font-black text-sm text-teal-400">
                            ₹{emp.net_salary_payable}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* SUB-VIEW 3: ROLE-BASED ACCESS CONTROL (RBAC) */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Role-Based Access Control (RBAC) Permissions Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Configure department and pillar access rights per employee role.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex items-start justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-teal-400" />
                      <span>{role.role_name}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{role.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingRoleId(role.id);
                      setRoleForm({ ...role });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Configure
                  </button>
                </div>

                {/* Pillar Permissions Tags */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'can_executive', label: 'Executive Dashboard' },
                    { key: 'can_marketing', label: 'Marketing Pillar' },
                    { key: 'can_pos', label: 'POS Terminal' },
                    { key: 'can_operations', label: 'Operations & Stock' },
                    { key: 'can_rd', label: 'R&D Module' },
                    { key: 'can_finance', label: 'Finance & GST' },
                    { key: 'can_hr', label: 'HR & Staff' }
                  ].map(p => {
                    const hasAccess = role[p.key];
                    return (
                      <div
                        key={p.key}
                        className={`p-2 rounded-xl border flex items-center justify-between ${
                          hasAccess
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        <span className="text-[11px] font-bold">{p.label}</span>
                        {hasAccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Modal: Edit Role Permissions */}
          {editingRoleId && roleForm && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-black text-white">Configure Role: {roleForm.role_name}</h3>
                  <button onClick={() => { setEditingRoleId(null); setRoleForm(null); }} className="text-slate-400 hover:text-white text-xs">✕</button>
                </div>

                <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Role Title</label>
                    <input
                      type="text"
                      required
                      value={roleForm.role_name}
                      onChange={(e) => setRoleForm({ ...roleForm, role_name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Description</label>
                    <input
                      type="text"
                      value={roleForm.description || ''}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-300 font-bold block">Pillar & Department Access Toggles:</label>
                    <div className="space-y-1.5">
                      {[
                        { key: 'can_executive', label: '1. Executive CEO Dashboard (High-level KPIs & Multi-Branch)' },
                        { key: 'can_marketing', label: '2. Marketing Pillar (AiSensy, Scratch Cards & Greetings)' },
                        { key: 'can_pos', label: '3. Sales Pillar (Fast Cashier POS Billing & Redemptions)' },
                        { key: 'can_operations', label: '4. Operations Pillar (Inventory, Stock & Auto-PO)' },
                        { key: 'can_rd', label: '5. R&D Pillar (Customer Feedback, NPS & A/B Tests)' },
                        { key: 'can_finance', label: '6. Accounts & Finance (Digital Khata, Expenses & GST Reports)' },
                        { key: 'can_hr', label: '7. HR & Staff (Attendance Matrix, Payroll & RBAC)' }
                      ].map(pil => (
                        <label
                          key={pil.key}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700"
                        >
                          <span className="text-slate-200 font-semibold">{pil.label}</span>
                          <input
                            type="checkbox"
                            checked={Boolean(roleForm[pil.key])}
                            onChange={() => handleTogglePermission(pil.key)}
                            className="rounded text-teal-500 focus:ring-0 w-4 h-4 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setEditingRoleId(null); setRoleForm(null); }}
                      className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black"
                    >
                      Save Permissions
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
