const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const Employee = require('../models/Employee');
const TimeOffAllocation = require('../models/TimeOffAllocation');
const { generateAccessToken, generateRefreshToken } = require('../utils/helpers');
const { generateLoginId, generateEmployeeCode } = require('../services/idGenerator');
const { sendVerificationEmail, sendRegistrationPendingEmail, sendRegistrationStatusEmail } = require('../services/emailService');
const AppError = require('../utils/AppError');
const { defaultAllocations } = require('../config/config');

// Employee self-registration
const signUp = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already registered', 400));
    }

    // Find the company (single company system)
    const company = await Company.findOne();
    if (!company) {
      return next(new AppError('System not configured. Please contact administrator.', 500));
    }

    const currentYear = new Date().getFullYear();
    const loginId = await generateLoginId(company.code, firstName, lastName, currentYear);
    const employeeCode = await generateEmployeeCode(company.code, currentYear);

    // Create user with pending status
    const user = await User.create({
      loginId,
      email,
      password,
      role: 'employee',
      isEmailVerified: false,
      registrationStatus: 'pending',
      company: company._id
    });

    // Create employee record
    const employee = await Employee.create({
      user: user._id,
      company: company._id,
      employeeCode,
      firstName,
      lastName,
      phone,
      dateOfJoining: new Date(),
      isActive: false // Will be activated upon approval
    });

    user.employee = employee._id;

    // Generate email verification token
    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    // Send verification email to the employee
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    await sendVerificationEmail(email, `${firstName} ${lastName}`, verificationUrl);

    // Notify HR about pending registration
    const hrUsers = await User.find({
      role: { $in: ['admin', 'hr_officer'] },
      company: company._id,
      isActive: true
    });

    for (const hr of hrUsers) {
      await sendRegistrationPendingEmail(hr.email, `${firstName} ${lastName}`, email);
    }

    res.status(201).json({
      success: true,
      message: 'Registration submitted. Please check your email to verify your account. Your registration is pending HR approval.',
      data: {
        email: user.email,
        registrationStatus: user.registrationStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// Verify email
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Invalid or expired verification token', 400));
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. Please wait for HR approval to login.'
    });
  } catch (error) {
    next(error);
  }
};

// Get pending registrations (for HR/Admin)
const getPendingRegistrations = async (req, res, next) => {
  try {
    const companyId = req.user.company._id || req.user.company;

    const pendingUsers = await User.find({
      company: companyId,
      registrationStatus: 'pending',
      role: 'employee'
    })
      .select('-password -refreshToken')
      .populate('employee', 'firstName lastName phone employeeCode')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { registrations: pendingUsers }
    });
  } catch (error) {
    next(error);
  }
};

// Approve or reject registration (for HR/Admin)
const updateRegistrationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return next(new AppError('Status must be approved or rejected', 400));
    }

    const user = await User.findById(id).populate('employee');
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.registrationStatus !== 'pending') {
      return next(new AppError('This registration has already been processed', 400));
    }

    user.registrationStatus = status;

    if (status === 'approved') {
      user.isActive = true;
      if (user.employee) {
        await Employee.findByIdAndUpdate(user.employee._id, { isActive: true });
      }

      // Create time-off allocations
      const year = new Date().getFullYear();
      const companyId = user.company;
      const existingAllocations = await TimeOffAllocation.findOne({
        employee: user.employee._id,
        year
      });

      if (!existingAllocations) {
        const allocations = Object.entries(defaultAllocations).map(([type, days]) => ({
          employee: user.employee._id,
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
      }
    } else {
      user.registrationRejectedReason = rejectionReason || '';
      user.isActive = false;
      if (user.employee) {
        await Employee.findByIdAndUpdate(user.employee._id, { isActive: false });
      }
    }

    await user.save();

    // Notify employee about registration status
    const employeeName = user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : 'User';
    await sendRegistrationStatusEmail(user.email, employeeName, status, rejectionReason);

    res.status(200).json({
      success: true,
      message: `Registration ${status} successfully`,
      data: { user: { id: user._id, registrationStatus: user.registrationStatus } }
    });
  } catch (error) {
    next(error);
  }
};

// Sign In
const signIn = async (req, res, next) => {
  try {
    const { loginId, password } = req.body;

    const user = await User.findOne({
      $or: [
        { loginId: loginId.toUpperCase() },
        { email: loginId.toLowerCase() }
      ]
    }).select('+password').populate('employee company');

    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Contact your HR.', 401));
    }

    if (!user.isEmailVerified) {
      return next(new AppError('Please verify your email before logging in.', 401));
    }

    if (user.registrationStatus === 'pending') {
      return next(new AppError('Your registration is pending approval from HR.', 401));
    }

    if (user.registrationStatus === 'rejected') {
      return next(new AppError('Your registration has been rejected. Contact HR for details.', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          loginId: user.loginId,
          email: user.email,
          role: user.role,
          employee: user.employee ? {
            id: user.employee._id,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            fullName: user.employee.fullName,
            avatar: user.employee.avatar,
            isCheckedIn: user.employee.isCheckedIn,
            jobPosition: user.employee.jobPosition,
            department: user.employee.department
          } : null,
          company: user.company ? {
            id: user.company._id,
            name: user.company.name,
            logo: user.company.logo
          } : null
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return next(new AppError('Refresh token required', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return next(new AppError('Invalid refresh token', 401));
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(new AppError('Invalid refresh token', 401));
  }
};

// Logout
const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.refreshToken = null;
    await user.save();

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshToken')
      .populate({
        path: 'employee',
        populate: { path: 'manager', select: 'firstName lastName' }
      })
      .populate('company');

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 400));
    }

    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: { accessToken, refreshToken: newRefreshToken }
    });
  } catch (error) {
    next(error);
  }
};

// Resend verification email
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).populate('employee');
    if (!user) {
      return next(new AppError('No account found with this email', 404));
    }

    if (user.isEmailVerified) {
      return next(new AppError('Email is already verified', 400));
    }

    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const name = user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : 'User';
    await sendVerificationEmail(email, name, verificationUrl);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signUp,
  signIn,
  verifyEmail,
  getPendingRegistrations,
  updateRegistrationStatus,
  refreshToken,
  logout,
  getMe,
  changePassword,
  resendVerification
};