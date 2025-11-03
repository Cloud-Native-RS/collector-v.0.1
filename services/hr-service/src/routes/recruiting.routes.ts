import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { RecruitingService } from '../services/recruiting.service';
import { AppError } from '../middleware/error-handler';

const router = Router();

const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Job Posting routes
router.post('/job-postings', [
  body('title').isString().notEmpty(),
  body('description').isString().notEmpty(),
  body('department').optional().isString(),
  body('location').optional().isString(),
  body('status').optional().isIn(['OPEN', 'CLOSED', 'DRAFT', 'FILLED']),
], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const posting = await RecruitingService.createJobPosting(req.body, tenantId);
    res.status(201).json({ success: true, data: posting });
  } catch (error) {
    next(error);
  }
});

router.get('/job-postings/:id', [param('id').isUUID()], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const posting = await RecruitingService.getJobPostingById(req.params.id, tenantId);
    if (!posting) return next(new AppError('Job posting not found', 404));
    res.json({ success: true, data: posting });
  } catch (error) {
    next(error);
  }
});

router.get('/job-postings', [
  query('status').optional().isIn(['OPEN', 'CLOSED', 'DRAFT', 'FILLED']),
  query('department').optional().isString(),
], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const result = await RecruitingService.listJobPostings(tenantId, {
      status: req.query.status as any,
      department: req.query.department as string,
    });
    res.json({ success: true, data: result.postings, meta: { total: result.total } });
  } catch (error) {
    next(error);
  }
});

// Applicant routes
router.post('/applicants', [
  body('jobPostingId').isUUID(),
  body('applicantName').isString().notEmpty(),
  body('email').isEmail(),
  body('phone').optional().isString(),
  body('resumeUrl').optional().isURL(),
], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const applicant = await RecruitingService.createApplicant(req.body, tenantId);
    res.status(201).json({ success: true, data: applicant });
  } catch (error) {
    next(error);
  }
});

router.get('/applicants/:id', [param('id').isUUID()], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const applicant = await RecruitingService.getApplicantById(req.params.id, tenantId);
    if (!applicant) return next(new AppError('Applicant not found', 404));
    res.json({ success: true, data: applicant });
  } catch (error) {
    next(error);
  }
});

router.get('/applicants', [
  query('jobPostingId').optional().isUUID(),
  query('status').optional().isIn(['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN']),
], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const result = await RecruitingService.listApplicants(tenantId, {
      jobPostingId: req.query.jobPostingId as string,
      status: req.query.status as any,
    });
    res.json({ success: true, data: result.applicants, meta: { total: result.total } });
  } catch (error) {
    next(error);
  }
});

router.put('/applicants/:id', [
  param('id').isUUID(),
  body('status').optional().isIn(['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN']),
  body('interviewDate').optional().isISO8601(),
  body('offerDate').optional().isISO8601(),
], validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const applicant = await RecruitingService.updateApplicant(req.params.id, req.body, tenantId);
    res.json({ success: true, data: applicant });
  } catch (error) {
    next(error);
  }
});

export default router;

