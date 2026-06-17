import { Router } from 'express';
import {
  getPendingSurveyModal,
  submitSurveyResponse,
} from '../controllers/surveyController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.get('/pending', getPendingSurveyModal);
router.post('/responses', submitSurveyResponse);

export default router;
