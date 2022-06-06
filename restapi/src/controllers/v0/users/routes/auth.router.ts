import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { NextFunction } from 'connect';
import * as EmailValidator from 'email-validator';
import { User } from '../models/User';

import { config } from '../../../../config/config';
import { sendResponse } from '../../../../helpers';

const router: Router = Router();

async function generatePassword(rawText: string): Promise<string> {
	const rounds = parseInt(config.jwt.rounds, 0) || 10
	const salt = await bcrypt.genSalt(rounds)
	const hashedText = await bcrypt.hash(rawText, salt)
	return hashedText;
}

async function comparePasswords(rawText: string, hashedText: string): Promise<boolean> {
  return bcrypt.compare(rawText, hashedText)
}

function generateJWT(user: User): string {
  return jwt.sign(user.toJSON(), config.jwt.secret || 'Aiqw12#76~Xz', { expiresIn: 100 * 24 * 60 * 60 });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const { headers: { authorization } = {} } = req;
	if (!authorization) {
		sendResponse(res, { message: 'No authorization headers.' }, 401)
		// end process
		return
	}
	
	const token_bearer = req.headers.authorization.split(' ')
	let [bearer = '', token] = token_bearer
	bearer = bearer.toLowerCase().trim()
	if (bearer !== 'bearer' ||token_bearer.length !== 2) {
		sendResponse(res, { message: 'Malformed token.'}, 401)
		return;
	}

	return jwt.verify(token, config.jwt.secret || 'Aiqw12#76~Xz', (err, decoded) => {
		// error
		if (err) {
			sendResponse(res, { auth: false, message: 'Failed to authenticate.' }, 500)
			return;
		}
		// success
		return next();
	});
}

router.get('/verification', 
	requireAuth, 
	async (_, res: Response) => {
		sendResponse(res, { auth: true, message: 'Authenticated.' })
});

router.post('/login', async (req: Request, res: Response) => {
	const { body: { email, password } = {} } = req
	// check email is valid
	if (!email || !EmailValidator.validate(email)) {
		sendResponse(res, { auth: false, message: 'Email is required or malformed' }, 400)
		return
	}

	// check email password valid
	if (!password) {
		sendResponse(res, { auth: false, message: 'Password is required' }, 400)
		return
	}

	const user = await User.findByPk(email);
	// check that user exists
	if (!user) {
		sendResponse(res, { auth: false, message: 'User not exist' }, 404)
		return
	}

	// check that the password matches
	const authValid = await comparePasswords(password, user.password_hash)

	if (!authValid) {
		sendResponse(res, { auth: false, message: 'Unauthorized' }, 401)
		return
	}

	// Generate JWT
	const jwt = generateJWT(user);
	sendResponse(res, { auth: true, token: jwt, user: user.short()}, 200)
});

//register a new user
router.post('/', async (req: Request, res: Response) => {
	const { body: { email, password: rawText } = {} } = req;
	
	// check email is valid
	if (!email || !EmailValidator.validate(email)) {
		sendResponse(res, { auth: false, message: 'Email is required or malformed' }, 400)
		return
	}

	// check email password valid
	if (!rawText) {
		sendResponse(res, { auth: false, message: 'Password is required' }, 400)
		return
	}

	// find the user
	const user = await User.findByPk(email)
	// check that user doesnt exists
	if (user) {
		sendResponse(res, { auth: false, message: 'User may already exist' }, 422)
		return
	}

	const password_hash = await generatePassword(rawText);
	const newUser = await new User({
		email: email,
		password_hash: password_hash
	})

	let savedUser;
	try {
		savedUser = await newUser.save()
	} catch (e) {
		throw e
	}

	// Generate JWT
	const jwt = generateJWT(savedUser)
	sendResponse(res, {token: jwt, user: savedUser.short()}, 201)
});

router.get('/', async (_, res: Response) => {
  res.send('auth')
});

export const AuthRouter: Router = router;
