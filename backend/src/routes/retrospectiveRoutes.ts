import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { getMidYearRetrospective } from '../controllers/retrospectiveController';

const router = Router();

router.use(authMiddleware);

router.get('/mid-year', getMidYearRetrospective);

export default router;
