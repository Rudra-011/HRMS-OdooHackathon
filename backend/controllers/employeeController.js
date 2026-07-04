const path = require('path');
const fs = require('fs').promises;
const Employee = require('../models/Employee');
const User = require('../models/User');
const Company = require('../models/Company');
const Salary = require('../models/Salary');
const TimeOffAllocation = require('../models/TimeOffAllocation');
const { generateLoginId, generateEmployeeCode } = require('../services/idGenerator');
const { generatePassword } = require('../services/passwordGenerator');
const { calculateSalaryComponents } = require('../services/salaryCalculator');
const { sendWelcomeEmail, sendVerificationEmail } = require('../services/emailService');
const { defaultAllocations } = require('../config/config');
const AppError = require('../utils/AppError');

const UPLOAD_BASE_PATH = path.join(__dirname, '../../upload');

const ensureUploadDir = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
};

const getAllEmployees = async (req, res, next) => {
  try {
    const { search, department, status, page = 1, limit = 20 } = req.query;
    const companyId = req.user.company._id || req.user.company;

    let query = { company: companyId, isActive: true };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (status) {
      query.workStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const employees = await Employee.find(query)
      .populate('user', 'loginId email role isActive')
      .populate('manager', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Employee.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        employees,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'loginId email role isActive lastLogin')
      .populate('manager', 'firstName lastName jobPosition')
      .populate('company', 'name code logo');

    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    // Employees can only view their own full profile
    if (req.user.role === 'employee') {
      const userEmployeeId = req.user.employee._id || req.user.employee;
      if (employee._id.toString() !== userEmployeeId.toString()) {
        // Return limited info for other employees
        return res.status(200).json({
          success: true,
          data: {
            employee: {
              _id: employee._id,
              firstName: employee.firstName,
              lastName: employee.lastName,
              fullName: employee.fullName,
              avatar: employee.avatar,
              jobPosition: employee.jobPosition,
              department: employee.department,
              workStatus: employee.workStatus,
              isCheckedIn: employee.isCheckedIn
            }
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      data: { employee }
    });
  } catch (error) {
    next(error);
  }
};

// HR creates employees, Admin creates HR officers
const createEmployee = async (req, res, next) => {
  try {
    const {
      firstName, lastName, email, phone, dateOfJoining,
      department, jobPosition, location, monthlyWage,
      role = 'employee'
    } = req.body;

    const companyId = req.user.company._id || req.user.company;

    // Role creation permission check
    if (role === 'hr_officer' && req.user.role !== 'admin') {
      return next(new AppError('Only admin can create HR officers', 403));
    }

    if (role === 'employee' && !['admin', 'hr_officer'].includes(req.user.role)) {
      return next(new AppError('Only admin or HR can create employees', 403));
    }

    if (role === 'admin') {
      return next(new AppError('Cannot create admin accounts', 403));
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already registered', 400));
    }

    const joiningYear = new Date(dateOfJoining).getFullYear();
    const loginId = await generateLoginId(company.code, firstName, lastName, joiningYear);
    const employeeCode = await generateEmployeeCode(company.code, joiningYear);
    const password = generatePassword();

    const user = await User.create({
      loginId,
      email,
      password,
      role: role || 'employee',
      isEmailVerified: false,
      registrationStatus: 'approved',
      isActive: true,
      company: companyId,
      createdBy: req.user._id
    });

    const employee = await Employee.create({
      user: user._id,
      company: companyId,
      employeeCode,
      firstName,
      lastName,
      phone,
      dateOfJoining: new Date(dateOfJoining),
      department: department || '',
      jobPosition: jobPosition || '',
      location: location || '',
      isActive: true
    });

    user.employee = employee._id;
    await user.save();

    // Create upload directory for this employee
    const employeeUploadDir = path.join(UPLOAD_BASE_PATH, `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${employeeCode}`);
    await ensureUploadDir(path.join(employeeUploadDir, 'avatars'));
    await ensureUploadDir(path.join(employeeUploadDir, 'documents'));

    if (monthlyWage && monthlyWage > 0) {
      const salaryData = calculateSalaryComponents(monthlyWage);
      await Salary.create({
        employee: employee._id,
        company: companyId,
        monthlyWage,
        yearlyWage: monthlyWage * 12,
        workingDaysPerWeek: company.workingDaysPerWeek || 5,
        breakTimeHours: company.breakTimeHours || 1,
        ...salaryData
      });
    }

    // Create time-off allocations
    const year = new Date().getFullYear();
    const allocations = Object.entries(defaultAllocations).map(([type, days]) => ({
      employee: employee._id,
      company: companyId,
      leaveType: type,
      totalAllocated: days,
      used: 0,
      remaining: days,
      validityStart: new Date(year, 0, 1),
      validityEnd: new Date(year, 11, 31),
      year
    }));
    await TimeOffAllocation.insertMany(allocations);

    // Send welcome email with credentials and verification link
    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    await sendWelcomeEmail(email, loginId, password, `${firstName} ${lastName}`, verificationUrl);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully. Login credentials and verification email sent.',
      data: {
        employee,
        credentials: {
          loginId,
          email,
          temporaryPassword: password
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    let allowedFields;
    if (['admin', 'hr_officer'].includes(req.user.role)) {
      allowedFields = [
        'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender',
        'maritalStatus', 'nationality', 'personalEmail', 'residingAddress',
        'jobPosition', 'department', 'location', 'manager',
        'bankDetails', 'about', 'whatILove', 'interestsAndHobbies',
        'skills', 'certifications', 'workStatus'
      ];
    } else {
      // Employee can only edit their own limited fields
      const userEmployeeId = req.user.employee._id || req.user.employee;
      if (employee._id.toString() !== userEmployeeId.toString()) {
        return next(new AppError('You can only edit your own profile', 403));
      }
      allowedFields = [
        'phone', 'residingAddress', 'personalEmail',
        'about', 'whatILove', 'interestsAndHobbies', 'skills'
      ];
    }

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('user', 'loginId email role')
     .populate('manager', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: { employee: updatedEmployee }
    });
  } catch (error) {
    next(error);
  }
};

const deactivateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    employee.isActive = false;
    employee.workStatus = 'terminated';
    await employee.save();

    await User.findByIdAndUpdate(employee.user, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a file', 400));
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    // Check permission - employee can only upload their own avatar
    if (req.user.role === 'employee') {
      const userEmployeeId = req.user.employee._id || req.user.employee;
      if (employee._id.toString() !== userEmployeeId.toString()) {
        return next(new AppError('You can only update your own avatar', 403));
      }
    }

    // Move file to employee's folder
    const folderName = `${employee.firstName.toLowerCase()}_${employee.lastName.toLowerCase()}_${employee.employeeCode}`;
    const destDir = path.join(UPLOAD_BASE_PATH, folderName, 'avatars');
    await ensureUploadDir(destDir);

    const destPath = path.join(destDir, req.file.filename);
    await fs.rename(req.file.path, destPath);

    const avatarPath = `/upload/${folderName}/avatars/${req.file.filename}`;

    // Delete old avatar if exists
    if (employee.avatar) {
      const oldPath = path.join(__dirname, '../..', employee.avatar);
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        // Ignore if old file doesn't exist
      }
    }

    employee.avatar = avatarPath;
    await employee.save();

    res.status(200).json({
      success: true,
      data: { avatar: employee.avatar }
    });
  } catch (error) {
    next(error);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a file', 400));
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    // Move file to employee's folder
    const folderName = `${employee.firstName.toLowerCase()}_${employee.lastName.toLowerCase()}_${employee.employeeCode}`;
    const destDir = path.join(UPLOAD_BASE_PATH, folderName, 'documents');
    await ensureUploadDir(destDir);

    const destPath = path.join(destDir, req.file.filename);
    await fs.rename(req.file.path, destPath);

    const documentPath = `/upload/${folderName}/documents/${req.file.filename}`;

    employee.documents.push({
      name: req.body.documentName || req.file.originalname,
      url: documentPath,
      uploadedAt: new Date()
    });
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { documents: employee.documents }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  uploadAvatar,
  uploadDocument
};