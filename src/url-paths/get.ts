import express, { Router } from 'express';
import { catchError, of, take, tap } from 'rxjs';
import { DBInstance } from '../DBInstance';
import { IMessage } from '../interfaces/message';
import { IQueryResponse } from '../interfaces/query-response';
import { IUnsafe } from '../interfaces/unsafe-value';
import { IFriendsCount } from '../interfaces/user';
import { Message } from '../models/message';
import { User } from '../models/user';
import { UserError } from '../models/user-error';

const getRoutes: Router = express.Router();

const usersModel: User = new User(DBInstance.getDBInstance('my-org', process.env.BUCKET!));
const messageModel: Message = new Message(
	DBInstance.getDBInstance('my-org', process.env.BUCKET!),
	usersModel,
);

getRoutes.get('/friends/:user', (req, res) => {
	const user: string = req.params.user as string;
	usersModel
		.getFriends(user)
		.pipe(
			tap((value) => {
				console.log(value);
				res.status(200).json({ friends: value && value.body });
			}),
		)
		.subscribe();
});

getRoutes.get('/friends/count/:user', (req, res) => {
	const user: string = req.params.user as string;

	usersModel
		.getFriendsCount(user)
		.pipe(
			take(1),
			tap((value: IQueryResponse<IFriendsCount>) => {
				res.status(200).json({ count: value && value.body && value.body.friendsCount });
			}),
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

getRoutes.get('/messages/:user', (req, res) => {
	const user: string = req.params.user as string;
	const startDate: IUnsafe<string> = req.query.startDate as IUnsafe<string>;
	const endDate: IUnsafe<string> = req.query.endDate as IUnsafe<string>;

	messageModel
		.getMessages(user, startDate, endDate)
		.pipe(
			take(1),
			tap((values: IMessage[]) => {
				res.status(200).json({ messages: values });
			}),
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

export default getRoutes;
