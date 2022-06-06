import { Router, Request, Response } from 'express'
import { FeedItem } from '../models/FeedItem'
import { requireAuth } from '../../users/routes/auth.router'
import * as AWS from '../../../../aws'
import { sendResponse, setUpdateFields } from '../../../../helpers'
import { getFieldsChanges } from '../../../../helpers/index'
import { UpdatedAt } from 'sequelize-typescript';

const router: Router = Router()

// Get all feed items
router.get('/', async (_, res: Response) => {
	const items = await FeedItem.findAndCountAll({ order: [['id', 'DESC']] })
	items.rows.map((item) => {
		if (item.url) {
			item.url = AWS.getGetSignedUrl(item.url)
		}
	});
	res.send(items);
});

// Get feed item by id
router.get('/:id', async (req: Request, res: Response) => {
	const { params: { id } = {} } = req
	const item = await FeedItem.findByPk(id)
	sendResponse(res, item);
});

// update a specific resource
router.patch('/:id', 
	requireAuth, 
	async (req: Request, res: Response) => {
		const { 
			params: { id } = {},
			body: {
				caption, url
			} = {}
		} = req
		if (!id) {
			sendResponse(res, { message: 'Feed id is required' }, 401)
			return
		}
		if (!caption && !url) {
			sendResponse(res, { message: 'Caption or Url is required' }, 401)
			return
		}
		let item = await FeedItem.findByPk(id)
		if (!item) {
			sendResponse(res, { message: `Feed not found` }, 404)
			return
		}
		const changes = getFieldsChanges({ caption, url }, item)
		if (!changes) {
			sendResponse(res, item);	
			return
		}
		try {
			item = setUpdateFields(changes, item)
			await item.save()
			sendResponse(res, item.get({ plain: true}))
		} catch ({ message }) {
			console.log(`Update feed ID ${id}, Error: ${message}`)
			sendResponse(res, changes)
		}
});


// Get a signed url to put a new item in the bucket
router.get('/signed-url/:fileName', 
    requireAuth, 
    async (req: Request, res: Response) => {
    let { fileName } = req.params;
    const url = AWS.getPutSignedUrl(fileName);
    res.status(201).send({url: url});
});

// Post meta data and the filename after a file is uploaded 
// NOTE the file name is they key name in the s3 bucket.
// body : {caption: string, fileName: string};
router.post('/', 
    requireAuth, 
    async (req: Request, res: Response) => {
    const { body: { caption, url } = {} } = req

    // check Caption is valid
    if (!caption) {
			sendResponse(res, { message: 'Caption is required or malformed' }, 400)
      return;
    }

    // check Filename is valid
    if (!url) {
			sendResponse(res, { message: 'File url is required' }, 400)
      return;
    }

    const item = await new FeedItem({ caption, url });
		const saved_item = await item.save();
    saved_item.url = AWS.getGetSignedUrl(saved_item.url);
		sendResponse(res, saved_item, 201)
});

export const FeedRouter: Router = router;