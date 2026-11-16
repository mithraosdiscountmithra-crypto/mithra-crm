import db from '../db/index.js';

/**
 * HR & Staff Pillar Controller
 * Features:
 * 1. Staff roster & daily attendance matrix
 * 2. Automated monthly payroll calculation & deductions
 * 3. Role-Based Access Control (RBAC) permission settings
 */

// 1. Detailed Payroll Calculation
export const getPayrollCalculation = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;

    // Fetch active staff
    const staffRes = await db.query(
      `SELECT * FROM staff WHERE merchant_id = $1 AND is_active = true`,
      [merchantId]
    );
    const staffList = staffRes.rows || [];

    // Fetch attendance for current month
    const today = new Date();
    const curYearMonth = today.toISOString().slice(0, 7); // e.g. '2026-11'
    const totalWorkingDaysInMonth = 26; // Standard 6-day workweek

    const attendanceRes = await db.query(
      `SELECT * FROM staff_attendance WHERE merchant_id = $1 AND attendance_date >= $2`,
      [merchantId, `${curYearMonth}-01`]
    );
    const attendanceRecords = attendanceRes.rows || [];

    // Calculate payroll per staff
    let totalPayrollLiability = 0;
    const payrollDetails = staffList.map(emp => {
      const empAttendance = attendanceRecords.filter(a => a.staff_id === emp.id);
      const presentCount = empAttendance.filter(a => a.status === 'PRESENT').length;
      const halfDayCount = empAttendance.filter(a => a.status === 'HALF_DAY').length;
      const absentCount = empAttendance.filter(a => a.status === 'ABSENT').length;
      const leaveCount = empAttendance.filter(a => a.status === 'LEAVE').length;

      const baseSalary = parseFloat(emp.monthly_salary || 0);
      const perDaySalary = parseFloat((baseSalary / totalWorkingDaysInMonth).toFixed(2));

      // Deductions: 1 full day for absent, 0.5 day for half day
      const deductionDays = absentCount + (halfDayCount * 0.5);
      const attendanceDeduction = parseFloat((deductionDays * perDaySalary).toFixed(2));

      // Overtime or performance allowance (demo: ₹500 if present > 20 days)
      const bonus = presentCount >= 20 ? 500.00 : 0.00;
      const netPayable = parseFloat(Math.max(0, baseSalary - attendanceDeduction + bonus).toFixed(2));

      totalPayrollLiability += netPayable;

      return {
        staff_id: emp.id,
        name: emp.name,
        role: emp.role,
        phone: emp.phone,
        monthly_base_salary: baseSalary,
        per_day_rate: perDaySalary,
        working_days: totalWorkingDaysInMonth,
        attendance_summary: {
          present: presentCount,
          half_day: halfDayCount,
          absent: absentCount,
          leave: leaveCount
        },
        deductions: attendanceDeduction,
        bonus,
        net_salary_payable: netPayable
      };
    });

    totalPayrollLiability = parseFloat(totalPayrollLiability.toFixed(2));

    res.json({
      success: true,
      payroll: {
        pay_period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        total_active_staff: staffList.length,
        total_payroll_liability: totalPayrollLiability,
        staff_breakdown: payrollDetails
      }
    });
  } catch (err) {
    next(err);
  }
};

// 2. Role-Based Access Control (RBAC)
export const getRBACMatrix = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const result = await db.query(
      `SELECT * FROM roles_permissions WHERE merchant_id = $1 ORDER BY id ASC`,
      [merchantId]
    );

    res.json({
      success: true,
      roles: result.rows || [],
      pillars: [
        { key: 'can_executive', label: 'Executive CEO Dashboard' },
        { key: 'can_marketing', label: 'Marketing Pillar (AiSensy, Coupons, Greetings)' },
        { key: 'can_pos', label: 'Sales Pillar (Fast POS Billing)' },
        { key: 'can_operations', label: 'Operations Pillar (Inventory & POs)' },
        { key: 'can_rd', label: 'R&D Pillar (Feedback & Experiments)' },
        { key: 'can_finance', label: 'Accounts & Finance (Khata, P&L, GST)' },
        { key: 'can_hr', label: 'HR Pillar (Attendance, Payroll, RBAC)' }
      ]
    });
  } catch (err) {
    next(err);
  }
};

export const updateRBACRole = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;
    const {
      role_name,
      description,
      can_executive = false,
      can_marketing = false,
      can_pos = true,
      can_operations = false,
      can_rd = false,
      can_finance = false,
      can_hr = false
    } = req.body;

    const result = await db.query(
      `UPDATE roles_permissions SET 
        role_name = $1, description = $2,
        can_executive = $3, can_marketing = $4, can_pos = $5, can_operations = $6,
        can_rd = $7, can_finance = $8, can_hr = $9
       WHERE id = $10 AND merchant_id = $11
       RETURNING *`,
      [
        role_name,
        description,
        Boolean(can_executive),
        Boolean(can_marketing),
        Boolean(can_pos),
        Boolean(can_operations),
        Boolean(can_rd),
        Boolean(can_finance),
        Boolean(can_hr),
        parseInt(id, 10),
        merchantId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }

    res.json({
      success: true,
      message: `Role "${result.rows[0].role_name}" permissions updated successfully!`,
      role: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};
