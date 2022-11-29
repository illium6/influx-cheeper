import express, { Router } from 'express';
import { catchError, of, take, tap } from 'rxjs';
import { DBInstance } from '../DBInstance';
import { IMessage } from '../interfaces/message';
import { IUnsafe } from '../interfaces/unsafe-value';
import { Message } from '../models/message';
import { User } from '../models/user';
import { UserError } from '../models/user-error';

const getRoutes: Router = express.Router();

const usersModel: User = new User(DBInstance.getDBInstance('my-org', 'test-bucket'));
const messageModel: Message = new Message(
	DBInstance.getDBInstance('my-org', 'test-bucket'),
	usersModel,
);

// routes.get('/friends/:login', (req: Request, res: Response) => {
// 	const userId: string = req.params.login;
//
//
// });

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
