import { Router, Response } from 'express';
import { FilteredImageRouter } from './filteredimage/routes/filteredimage.router';

const router: Router = Router();

router.use('/filteredimage', FilteredImageRouter);

router.get('/', async (_, res: Response) => {    
    res.send(`V0`);
});

export const IndexRouter: Router = router;