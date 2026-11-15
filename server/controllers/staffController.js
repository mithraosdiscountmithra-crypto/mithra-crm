import db from '../db/index.js';

/**
 * List all staff members for the authenticated merchant
 */
export const getStaff = async (req, res) => {
  try {
    const merchantId = req.merchantId;

    const result = await db.query(
      `SELECT * FROM staff WHERE merchant_id = $1 ORDER BY id ASC`,
      [merchantId]
    );

    const staff = result.rows;
    const totalPayroll = staff.reduce((sum, s) => sum + (parseFloat(s.monthly_salary) || 0), 0);
    const activeStaff = staff.filter(s => s.is_active);

    return res.json({
      success: true,
      staff,
      stats: {
        totalStaff: staff.length,
        activeStaffCount: activeStaff.length,
        totalMonthlyPayroll: totalPayroll.toFixed(2)
      }
    });
  } catch (err) {
    console.error('[Get Staff Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Add a new staff member
 */
export const createStaff = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { name, role, phone, monthly_salary, joining_date } = req.body;

    if (!name || !role || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Please provide staff name, role, and phone number.'
      });
    }

    const result = await db.query(
      `INSERT INTO staff (merchant_id, name, role, phone, monthly_salary, joining_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [
        merchantId,
        name.trim(),
        role.trim(),
        phone.trim(),
        parseFloat(monthly_salary) || 0,
        joining_date || new Date().toISOString().split('T')[0]
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Staff member added successfully',
      staff: result.rows[0]
    });
  } catch (err) {
    console.error('[Create Staff Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update staff member details
 */
export const updateStaff = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;
    const { name, role, phone, monthly_salary, is_active } = req.body;

    const result = await db.query(
      `UPDATE staff 
       SET name = $1, role = $2, phone = $3, monthly_salary = $4, is_active = $5
       WHERE id = $6 AND merchant_id = $7
       RETURNING *`,
      [
        name,
        role,
        phone,
        parseFloat(monthly_salary) || 0,
        is_active !== undefined ? is_active : true,
        id,
        merchantId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Staff member not found.' });
    }

    return res.json({
      success: true,
      message: 'Staff member updated successfully',
      staff: result.rows[0]
    });
  } catch (err) {
    console.error('[Update Staff Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Delete staff member
 */
export const deleteStaff = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM staff WHERE id = $1 AND merchant_id = $2`,
      [id, merchantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Staff member not found.' });
    }

    return res.json({
      success: true,
      message: 'Staff member removed successfully.'
    });
  } catch (err) {
    console.error('[Delete Staff Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get daily attendance for a specific date (defaults to today)
 */
export const getAttendance = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    // 1. Fetch all active staff
    const staffRes = await db.query(
      `SELECT * FROM staff WHERE merchant_id = $1 AND is_active = true ORDER BY name ASC`,
      [merchantId]
    );
    const staffMembers = staffRes.rows;

    // 2. Fetch attendance records for targetDate
    const attRes = await db.query(
      `SELECT * FROM staff_attendance WHERE merchant_id = $1 AND attendance_date = $2`,
      [merchantId, targetDate]
    );
    const attendanceRecords = attRes.rows;

    // Merge staff with attendance status
    const attendanceMap = {};
    attendanceRecords.forEach(a => {
      attendanceMap[a.staff_id] = a;
    });

    let presentCount = 0;
    let absentCount = 0;
    let halfDayCount = 0;

    const staffWithAttendance = staffMembers.map(s => {
      const att = attendanceMap[s.id];
      const status = att ? att.status : 'ABSENT';
      if (status === 'PRESENT') presentCount++;
      else if (status === 'HALF_DAY') halfDayCount++;
      else absentCount++;

      return {
        ...s,
        attendance_id: att ? att.id : null,
        status,
        check_in_time: att ? att.check_in_time : null,
        attendance_notes: att ? att.notes : '',
        attendance_date: targetDate
      };
    });

    return res.json({
      success: true,
      date: targetDate,
      attendance: staffWithAttendance,
      summary: {
        totalStaff: staffMembers.length,
        presentCount,
        absentCount,
        halfDayCount,
        attendanceRate: staffMembers.length > 0 
          ? Math.round(((presentCount + (halfDayCount * 0.5)) / staffMembers.length) * 100) 
          : 0
      }
    });
  } catch (err) {
    console.error('[Get Attendance Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Mark or toggle attendance for a staff member on a given date
 */
export const markAttendance = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { staff_id, attendance_date, status, check_in_time, notes } = req.body;

    if (!staff_id || !status) {
      return res.status(400).json({
        success: false,
        error: 'Please provide staff_id and status (PRESENT, ABSENT, HALF_DAY, LEAVE).'
      });
    }

    const aDate = attendance_date || new Date().toISOString().split('T')[0];
    const validStatus = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'];
    if (!validStatus.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be PRESENT, ABSENT, HALF_DAY, or LEAVE.'
      });
    }

    // Verify staff belongs to merchant
    const staffCheck = await db.query(
      `SELECT id, name FROM staff WHERE id = $1 AND merchant_id = $2`,
      [staff_id, merchantId]
    );

    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Staff member not found.' });
    }

    const result = await db.query(
      `INSERT INTO staff_attendance (merchant_id, staff_id, attendance_date, status, check_in_time, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        merchantId,
        staff_id,
        aDate,
        status.toUpperCase(),
        check_in_time || '09:00 AM',
        notes || ''
      ]
    );

    return res.json({
      success: true,
      message: `Marked ${staffCheck.rows[0].name} as ${status.toUpperCase()} for ${aDate}`,
      record: result.rows[0]
    });
  } catch (err) {
    console.error('[Mark Attendance Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
