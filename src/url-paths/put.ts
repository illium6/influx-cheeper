import express, { Request, Response, Router } from 'express';
import { catchError, of, tap } from 'rxjs';
import { DBInstance } from '../DBInstance';
import { IUser } from '../interfaces/user';
import { UserError } from '../models/user-error';
import { User } from '../user';

const routes: Router = express.Router();

const users: User = new User(DBInstance.getDBInstance('my-org', 'test-bucket'));

routes.put('/create-user', (req: Request, res: Response) => {
	const user: IUser = req.body;

	users
		.createUser(user.name, user.login)
		.pipe(
			tap(() => res.sendStatus(201)),
			catchError((err: any) => {
				console.error(err.message);
				if (err instanceof UserError) {
					res.status(400).json({ errorMessage: err.message });
				} else {
					res.status(500).json({ errorMessage: err.message });
				}

				return of(void 0);
			}),
		)
		.subscribe();
});

routes.put('/add-friend/:user', (req, res) => {
	const friend: string = req.body.friend;
	const user: string = req.params.user as string;

	users
		.addFriend(user, friend)
		.pipe(
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

export default routes;
