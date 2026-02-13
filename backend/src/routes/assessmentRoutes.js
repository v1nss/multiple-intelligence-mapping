import { Router } from 'express';
import {
  startAssessment,
  getQuestions,
  submitAssessment,
  getResult,
  getHistory,
} from '../controllers/assessmentController.js';
import { downloadReport } from '../controllers/reportController.js';
import { requireAuth, requireOwnership } from '../middleware/auth.js';

const router = Router();

// All assessment routes require authentication
router.use(requireAuth);

router.post('/start', startAssessment);
router.get('/history', getHistory);
router.get('/:id/questions', requireOwnership(), getQuestions);
router.post('/:id/submit', requireOwnership(), submitAssessment);
router.get('/:id/result', requireOwnership(), getResult);
router.get('/:id/report', requireOwnership(), downloadReport);

export default router;
