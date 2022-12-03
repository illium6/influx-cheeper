import express, { Request, Response, Router } from 'express';
import { catchError, of, take, tap } from 'rxjs';
import { DBInstance } from '../DBInstance';
import { IUser } from '../interfaces/user';
import { Message } from '../models/message';
import { UserError, UserExistError } from '../models/user-error';
import { User } from '../models/user';

const putRoutes: Router = express.Router();

const usersModel: User = new User(DBInstance.getDBInstance('my-org', process.env.BUCKET!));
const messageModel: Message = new Message(
	DBInstance.getDBInstance('my-org', process.env.BUCKET!),
	usersModel,
);

putRoutes.put('/create-user', (req: Request, res: Response) => {
	const user: IUser = req.body;

	usersModel
		.createUser(user.name, user.login)
		.pipe(
			tap(() => res.sendStatus(201)),
			catchError((err: any) => {
				console.error(err.message);
				if (err instanceof UserExistError) {
					res.status(400).json({ errorMessage: err.message });
				} else if (err instanceof UserError) {
					res.status(404).json({ errorMessage: err.message });
				} else {
					res.status(500).json({ errorMessage: err.message });
				}

				return of(void 0);
			}),
		)
		.subscribe();
});

putRoutes.put('/add-friend/:user', (req, res) => {
	const friend: string = req.body.friend;
	const user: string = req.params.user as string;

	usersModel
		.addFriend(user, friend)
		.pipe(
			tap(() => res.sendStatus(201)),
			catchError((err: any) => {
				console.error(err.message);
				if (err instanceof UserExistError) {
					res.status(400).json({ errorMessage: err.message });
				} else if (err instanceof UserError) {
					res.status(404).json({ errorMessage: err.message });
				} else {
					res.status(500).json({ errorMessage: err.message });
				}

				return of(void 0);
			}),
		)
		.subscribe();
});

putRoutes.put('/add-message/:user', (req, res) => {
	const message: string = req.body.message;
	const user: string = req.params.user as string;

	messageModel
		.addMessage(user, message)
		.pipe(
			take(1),
			tap(() => res.sendStatus(201)),
			catchError((err: any) => {
				console.error(err.message);
				if (err instanceof UserError) {
					res.status(404).json({ errorMessage: err.message });
				} else {
					res.status(500).json({ errorMessage: err.message });
				}

				return of(void 0);
			}),
		)
		.subscribe();
});

export default putRoutes;
