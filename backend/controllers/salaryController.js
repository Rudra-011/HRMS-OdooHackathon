const Salary = require('../models/Salary');
const Employee = require('../models/Employee');
const { calculateSalaryComponents } = require('../services/salaryCalculator');
const AppError = require('../utils/AppError');

const getMySalary = async (req, res, next) => {
  try {
    // Only admin/HR can view salary info
    if (req.user.role === 'employee') {
      return next(new AppError('Salary information is only visible to Admin/HR', 403));
    }

    const employeeId = req.user.employee._id || req.user.employee;

    const salary = await Salary.findOne({ employee: employeeId, isActive: true })
      .populate('employee', 'firstName lastName employeeCode');

    if (!salary) {
      return res.status(200).json({
        success: true,
        data: { salary: null, message: 'No salary structure defined' }
      });
    }

    res.status(200).json({
      success: true,
      data: { salary }
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeSalary = async (req, res, next) => {
  try {
    const salary = await Salary.findOne({
      employee: req.params.employeeId,
      isActive: true
    }).populate('employee', 'firstName lastName employeeCode');

    if (!salary) {
      return res.status(200).json({
        success: true,
        data: { salary: null, message: 'No salary structure defined' }
      });
    }

    res.status(200).json({
      success: true,
      data: { salary }
    });
  } catch (error) {
    next(error);
  }
};

const upsertSalary = async (req, res, next) => {
  try {
    const { monthlyWage, workingDaysPerWeek, breakTimeHours, customRates } = req.body;

    if (!monthlyWage || monthlyWage <= 0) {
      return next(new AppError('Valid monthly wage is required', 400));
    }

    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    const companyId = req.user.company._id || req.user.company;
    const salaryData = calculateSalaryComponents(monthlyWage, customRates || {});

    let salary = await Salary.findOne({ employee: req.params.employeeId, isActive: true });

    if (salary) {
      salary.monthlyWage = monthlyWage;
      salary.workingDaysPerWeek = workingDaysPerWeek || salary.workingDaysPerWeek;
      salary.breakTimeHours = breakTimeHours || salary.breakTimeHours;
      salary.components = salaryData.components;
      salary.pfEmployee = salaryData.pfEmployee;
      salary.pfEmployer = salaryData.pfEmployer;
      salary.professionalTax = salaryData.professionalTax;
      await salary.save();
    } else {
      salary = await Salary.create({
        employee: req.params.employeeId,
        company: companyId,
        monthlyWage,
        workingDaysPerWeek: workingDaysPerWeek || 5,
        breakTimeHours: breakTimeHours || 1,
        ...salaryData
      });
    }

    res.status(200).json({
      success: true,
      message: 'Salary structure updated successfully',
      data: { salary }
    });
  } catch (error) {
    next(error);
  }
};

const getAllSalaries = async (req, res, next) => {
  try {
    const companyId = req.user.company._id || req.user.company;

    const salaries = await Salary.find({ company: companyId, isActive: true })
      .populate('employee', 'firstName lastName employeeCode department jobPosition')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { salaries }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySalary,
  getEmployeeSalary,
  upsertSalary,
  getAllSalaries
};