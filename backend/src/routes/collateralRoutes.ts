import { Router } from 'express';
import {
  uploadCollateral,
  listCollaterals,
  getCollateral,
  downloadCollateral,
  deleteCollateral,
} from '../controllers/collateralController';
import { authMiddleware } from '../middlewares/auth';
import { upload } from '../config/multer';

const router = Router();

router.use(authMiddleware);

router.post('/', upload.single('file'), uploadCollateral);
router.get('/', listCollaterals);
router.get('/:id', getCollateral);
router.get('/:id/download', downloadCollateral);
router.delete('/:id', deleteCollateral);

export default router;
