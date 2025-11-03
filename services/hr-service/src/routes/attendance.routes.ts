import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AttendanceService } from '../services/attendance.service';
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
  body('checkInTime').optional().isISO8601(),
  body('checkOutTime').optional().isISO8601(),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('status').optional().isIn(['PRESENT', 'ABSENT', 'ON_LEAVE', 'REMOTE', 'SICK_LEAVE', 'VACATION']),
], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const attendance = await AttendanceService.createAttendance(req.body, tenantId);
    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
});

router.post('/check-in', [
  body('employeeId').isUUID(),
  body('checkInTime').optional().isISO8601(),
], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const attendance = await AttendanceService.checkIn(req.body.employeeId, req.body.checkInTime, tenantId);
    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
});

router.post('/check-out', [
  body('employeeId').isUUID(),
  body('checkOutTime').optional().isISO8601(),
], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const attendance = await AttendanceService.checkOut(req.body.employeeId, req.body.checkOutTime, tenantId);
    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', [param('id').isUUID()], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const attendance = await AttendanceService.getAttendanceById(req.params.id, tenantId);
    if (!attendance) return next(new AppError('Attendance not found', 404));
    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
});

router.get('/', [
  query('employeeId').optional().isUUID(),
  query('status').optional().isIn(['PRESENT', 'ABSENT', 'ON_LEAVE', 'REMOTE', 'SICK_LEAVE', 'VACATION']),
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
    const result = await AttendanceService.listAttendance(tenantId, filters);
    res.json({ success: true, data: result.records, meta: { total: result.total } });
  } catch (error) {
    next(error);
  }
});

export default router;
