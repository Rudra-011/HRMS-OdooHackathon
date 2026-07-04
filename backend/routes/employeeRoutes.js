const express = require('express');
const router = express.Router();
const {
  getAllEmployees, getEmployee, createEmployee,
  updateEmployee, deactivateEmployee, uploadAvatar, uploadDocument
} = require('../controllers/employeeController');
const { authenticate } = require('../middleware/auth');
const { authorize, isAdminOrHR, isSelfOrAdmin, canCreateRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createEmployeeValidator, updateEmployeeValidator } = require('../validators/employeeValidator');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', getAllEmployees);
router.post('/', isAdminOrHR, canCreateRole, createEmployeeValidator, validate, createEmployee);
router.delete('/:id', authorize('admin'), deactivateEmployee);
router.get('/:id', getEmployee);
router.put('/:id', isSelfOrAdmin, updateEmployeeValidator, validate, updateEmployee);
router.post('/:id/avatar', isSelfOrAdmin, upload.single('avatar'), uploadAvatar);
router.post('/:id/document', isSelfOrAdmin, upload.single('document'), uploadDocument);

module.exports = router;