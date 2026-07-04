const User = require('../models/User');
const Company = require('../models/Company');
const Employee = require('../models/Employee');
const TimeOffAllocation = require('../models/TimeOffAllocation');
const { generateLoginId, generateEmployeeCode } = require('./idGenerator');
const { defaultAllocations } = require('../config/config');

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'System Admin';
    const companyName = process.env.COMPANY_NAME || 'Default Company';

    if (!adminEmail || !adminPassword) {
      console.log('⚠️  ADMIN_EMAIL and ADMIN_PASSWORD not set in .env. Skipping admin seed.');
      return;
    }

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin already exists. Skipping seed.');
      return;
    }

    const companyCode = companyName.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();

    let company = await Company.findOne({ code: companyCode });
    if (!company) {
      company = await Company.create({
        name: companyName,
        code: companyCode,
        email: adminEmail
      });
    }

    const nameParts = adminName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];

    const currentYear = new Date().getFullYear();
    const loginId = await generateLoginId(companyCode, firstName, lastName, currentYear);
    const employeeCode = await generateEmployeeCode(companyCode, currentYear);

    const user = await User.create({
      loginId,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isEmailVerified: true,
      registrationStatus: 'approved',
      isActive: true,
      company: company._id
    });

    const employee = await Employee.create({
      user: user._id,
      company: company._id,
      employeeCode,
      firstName,
      lastName,
      dateOfJoining: new Date(),
      jobPosition: 'Administrator',
      department: 'Management'
    });

    user.employee = employee._id;
    await user.save();

    company.createdBy = user._id;
    await company.save();

    const year = new Date().getFullYear();
    const allocations = Object.entries(defaultAllocations).map(([type, days]) => ({
      employee: employee._id,
      company: company._id,
      leaveType: type,
      totalAllocated: days,
      used: 0,
      remaining: days,
      validityStart: new Date(year, 0, 1),
      validityEnd: new Date(year, 11, 31),
      year
    }));
    await TimeOffAllocation.insertMany(allocations);

    console.log(`✅ Admin seeded successfully. Login ID: ${loginId}, Email: ${adminEmail}`);
  } catch (error) {
    if (error.code === 11000) {
      console.log('✅ Admin already exists (duplicate). Skipping seed.');
    } else {
      console.error('❌ Admin seed error:', error.message);
    }
  }
};

module.exports = { seedAdmin };
