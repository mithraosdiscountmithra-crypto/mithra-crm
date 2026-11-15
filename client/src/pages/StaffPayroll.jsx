import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  DollarSign, 
  Plus, 
  Search, 
  Calendar, 
  Phone, 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  Edit3,
  RefreshCw,
  Award
} from 'lucide-react';

const ATTENDANCE_STATUSES = [
  { id: 'PRESENT', label: 'Present', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30' },
  { id: 'HALF_DAY', label: 'Half Day', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30' },
  { id: 'ABSENT', label: 'Absent', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30' },
  { id: 'LEAVE', label: 'Leave', color: 'bg-sky-500/20 text-sky-400 border-sky-500/40 hover:bg-sky-500/30' },
];

export default function StaffPayroll() {
  const [staffList, setStaffList] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Add/Edit Staff Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'Staff Member',
    phone: '',
    monthly_salary: '',
    joining_date: new Date().toISOString().split('T')[0],
    is_active: true
  });
  const [submittingStaff, setSubmittingStaff] = useState(false);

  const fetchStaffAndAttendance = async (date = attendanceDate) => {
    try {
      setLoading(true);
      setError('');
      const [staffRes, attRes] = await Promise.all([
        api.staff.getAll(),
        api.staff.getAttendance(date)
      ]);

      if (staffRes.success) {
        setStaffList(staffRes.staff || []);
      }
      if (attRes.success) {
        setAttendanceRecords(attRes.attendance || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch staff directory or attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndAttendance(attendanceDate);
  }, [attendanceDate]);

  const handleStaffFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStaffForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOpenAddModal = () => {
    setEditingStaffId(null);
    setStaffForm({
      name: '',
      role: 'Staff Member',
      phone: '',
      monthly_salary: '',
      joining_date: new Date().toISOString().split('T')[0],
      is_active: true
    });
    setIsStaffModalOpen(true);
  };

  const handleOpenEditModal = (staff) => {
    setEditingStaffId(staff.id);
    setStaffForm({
      name: staff.name,
      role: staff.role || 'Staff Member',
      phone: staff.phone || '',
      monthly_salary: staff.monthly_salary ? String(staff.monthly_salary) : '',
      joining_date: staff.joining_date ? String(staff.joining_date).split('T')[0] : '',
      is_active: staff.is_active !== undefined ? staff.is_active : true
    });
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!staffForm.name.trim()) {
      setError('Staff name is required');
      return;
    }

    try {
      setSubmittingStaff(true);
      setError('');

      if (editingStaffId) {
        await api.staff.update(editingStaffId, staffForm);
        setSuccess('Staff member updated successfully');
      } else {
        await api.staff.create(staffForm);
        setSuccess('New staff member added successfully');
      }

      setIsStaffModalOpen(false);
      await fetchStaffAndAttendance(attendanceDate);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save staff details');
    } finally {
      setSubmittingStaff(false);
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the staff directory?`)) {
      return;
    }

    try {
      const res = await api.staff.delete(id);
      if (res.success) {
        setSuccess(`Staff member ${name} removed`);
        await fetchStaffAndAttendance(attendanceDate);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete staff member');
    }
  };

  const handleQuickMarkAttendance = async (staffId, status) => {
    try {
      setError('');
      const res = await api.staff.markAttendance({
        staff_id: staffId,
        attendance_date: attendanceDate,
        status: status,
        check_in_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      if (res.success) {
        // Update local state smoothly
        setAttendanceRecords(prev => {
          const filtered = prev.filter(r => r.staff_id !== staffId);
          return [...filtered, res.attendance];
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to update attendance');
    }
  };

  // Metrics
  const activeStaff = staffList.filter(s => s.is_active);
  const totalPayroll = activeStaff.reduce((acc, s) => acc + (parseFloat(s.monthly_salary) || 0), 0);

  // Today's attendance counts for selected date
  const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
  const halfDayCount = attendanceRecords.filter(r => r.status === 'HALF_DAY').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'ABSENT').length;
  const totalMarked = attendanceRecords.length;
  const attendanceRate = activeStaff.length > 0 
    ? Math.round(((presentCount + (halfDayCount * 0.5)) / activeStaff.length) * 100) 
    : 0;

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.role && s.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.phone && s.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Human Resources & Payroll</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Daily Attendance Roster
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Staff Attendance & Payroll
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Monitor team roster, 1-click log daily present/absent status, and calculate monthly payroll obligations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchStaffAndAttendance(attendanceDate)}
            disabled={loading}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Attendance"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-sm hover:opacity-95 transition shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Staff */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Active Team</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">{activeStaff.length} Employees</div>
          <div className="text-[11px] text-slate-500">{staffList.length} total on directory</div>
        </div>

        {/* Daily Attendance Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Attendance Rate</span>
            <UserCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-300 tracking-tight">{attendanceRate}%</div>
          <div className="text-[11px] text-slate-500">{presentCount} present on {attendanceDate}</div>
        </div>

        {/* Present vs Absent Today */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Daily Breakdown</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 flex items-center gap-3 pt-1">
            <span className="text-emerald-400">{presentCount} Present</span>
            <span className="text-amber-400">{halfDayCount} Half-day</span>
            <span className="text-rose-400">{absentCount} Absent</span>
          </div>
          <div className="text-[11px] text-slate-500">{totalMarked} / {activeStaff.length} status logged</div>
        </div>

        {/* Monthly Payroll */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Monthly Payroll Liability</span>
            <DollarSign className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-300 tracking-tight">
            ${totalPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500">Fixed monthly employee commitments</div>
        </div>
      </div>

      {/* Date Selector & Attendance Roster */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Daily Attendance Roster</h2>
            </div>
            <p className="text-xs text-slate-400">
              Pick a date and 1-click mark employee status. Changes are saved automatically.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Picker */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Date:</span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none"
              />
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff name, role..."
                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition w-44 sm:w-52"
              />
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role / Department</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Monthly Salary</th>
                <th className="py-3 px-4 text-center">Attendance for {attendanceDate}</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No staff members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const att = attendanceRecords.find(r => r.staff_id === staff.id);
                  const currentStatus = att ? att.status : null;

                  return (
                    <tr key={staff.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{staff.name}</span>
                              {!staff.is_active && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-semibold">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal">
                              Joined: {staff.joining_date ? String(staff.joining_date).split('T')[0] : '—'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-slate-200 border border-slate-700/60">
                          <Briefcase className="w-3 h-3 text-emerald-400" />
                          <span>{staff.role}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {staff.phone || <span className="text-slate-600">—</span>}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                        ${parseFloat(staff.monthly_salary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* 1-Click Attendance Buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {ATTENDANCE_STATUSES.map(statusOption => {
                            const isSelected = currentStatus === statusOption.id;
                            return (
                              <button
                                key={statusOption.id}
                                onClick={() => handleQuickMarkAttendance(staff.id, statusOption.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                                  isSelected 
                                    ? statusOption.color + ' ring-1 ring-white/30 font-black' 
                                    : 'bg-slate-950/60 text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700'
                                }`}
                                title={`Mark as ${statusOption.label}`}
                              >
                                {statusOption.label}
                              </button>
                            );
                          })}
                          {att?.check_in_time && (
                            <span className="text-[10px] text-slate-500 ml-1 font-mono">
                              ({att.check_in_time})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(staff)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Edit Staff Member"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(staff.id, staff.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete Staff Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        title={editingStaffId ? 'Edit Staff Member' : 'Add New Staff Member'}
      >
        <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              value={staffForm.name}
              onChange={handleStaffFormChange}
              required
              placeholder="e.g. David Kim or Sarah Miller"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Role / Designation *</label>
              <input
                type="text"
                name="role"
                value={staffForm.role}
                onChange={handleStaffFormChange}
                required
                placeholder="e.g. Head Barista, Cashier, Manager"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={staffForm.phone}
                onChange={handleStaffFormChange}
                placeholder="e.g. +1 555-0199"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Monthly Salary ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="monthly_salary"
                value={staffForm.monthly_salary}
                onChange={handleStaffFormChange}
                required
                placeholder="2500.00"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Joining Date</label>
              <input
                type="date"
                name="joining_date"
                value={staffForm.joining_date}
                onChange={handleStaffFormChange}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={staffForm.is_active}
              onChange={handleStaffFormChange}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
            />
            <label htmlFor="is_active" className="text-slate-300 cursor-pointer">
              Active Employee (included in attendance & payroll totals)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsStaffModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingStaff}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:opacity-95 transition shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {submittingStaff ? 'Saving...' : editingStaffId ? 'Update Staff' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
