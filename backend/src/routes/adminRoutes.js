import { Router } from 'express';
import {
  getUsers,
  getAnalytics,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestions,
  getDomains,
  getVersions,
} from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(requireAuth, requireAdmin);

router.get('/users', getUsers);
router.get('/analytics', getAnalytics);
router.get('/questions', getQuestions);
router.post('/questions', createQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);
router.get('/domains', getDomains);
router.get('/versions', getVersions);

export default router;
