import { Router, Request, Response } from 'express';

import { User } from '../models/User';
import { sendResponse } from '../../../../helpers';
import { AuthRouter } from './auth.router';

const router: Router = Router();

router.use('/auth', AuthRouter);

router.get('/', async (req: Request, res: Response) => {
});

router.get('/:id', async (req: Request, res: Response) => {
    const { params: { id } = {} } = req;
    const item = await User.findByPk(id);
    sendResponse(res, item);
});

export const UserRouter: Router = router;