import { Router, Request, Response } from 'express'
import { filterImageFromURL, sendFileAsync, deleteLocalFiles, sendResp } from '../../../../util/util';
const router: Router = Router()

// Get all feed items
router.get('/', async (req: Request, res: Response) => {
	const { query: {image_url} = {} } = req;
    
    if (!image_url) {
			sendResp(res, { message: 'Image URL required' }, 400);
      return;
    }
    
    if (!image_url.startsWith('https://') && !image_url.startsWith('http://')) {
			sendResp(res, { message: 'Image URL is not a full path' }, 400);	
      return;
    }

    // process image
    try {
      const result = await filterImageFromURL(image_url);
      await sendFileAsync(res.sendFile.bind(res), result);
      deleteLocalFiles([result]);
    } catch (e: any) {
			sendResp(res, { message: `Server error: ${e.message}` }, 500);
    }
});

export const FilteredImageRouter: Router = router;
