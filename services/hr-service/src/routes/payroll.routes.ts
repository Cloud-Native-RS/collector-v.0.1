import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PayrollService } from '../services/payroll.service';
import { AppError } from '../middleware/error-handler';

const router = Router();

const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.post('/', [
  body('employeeId').isUUID(),
  body('salaryBase').isFloat({ min: 0 }),
  body('bonuses').optional().isFloat({ min: 0 }),
  body('deductions').optional().isFloat({ min: 0 }),
  body('taxes').optional().isFloat({ min: 0 }),
  body('payPeriodStart').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('payPeriodEnd').matches(/^\d{4}-\d{2}-\d{2}$/),
], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const payroll = await PayrollService.createPayroll(req.body, tenantId);
    res.status(201).json({ success: true, data: payroll });
  } catch (error) {
    next(error);
  }
});

router.post('/process', [
  body('employeeIds').optional().isArray(),
  body('employeeIds.*').optional().isUUID(),
  body('payPeriodStart').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('payPeriodEnd').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('department').optional().isString(),
], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const payrolls = await PayrollService.processPayroll(req.body, tenantId);
    res.status(201).json({ success: true, data: payrolls, count: payrolls.length });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', [param('id').isUUID()], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const payroll = await PayrollService.getPayrollById(req.params.id, tenantId);
    if (!payroll) return next(new AppError('Payroll not found', 404));
    res.json({ success: true, data: payroll });
  } catch (error) {
    next(error);
  }
});

router.get('/employee/:employeeId', [param('employeeId').isUUID()], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const payrolls = await PayrollService.getEmployeePayroll(req.params.employeeId, tenantId);
    res.json({ success: true, data: payrolls });
  } catch (error) {
    next(error);
  }
});

router.get('/', [
  query('employeeId').optional().isUUID(),
  query('status').optional().isIn(['PENDING', 'PROCESSED', 'PAID', 'CANCELLED']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const filters = {
      employeeId: req.query.employeeId as string,
      status: req.query.status as any,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
    };
    const result = await PayrollService.listPayroll(tenantId, filters);
    res.json({ success: true, data: result.records, meta: { total: result.total } });
  } catch (error) {
    next(error);
  }
});

export default router;

