import bodyParser from 'body-parser';
import express, { Express, NextFunction, Request, Response } from 'express';
import { catchError, of } from 'rxjs';
import { DBInstance } from './DBInstance';
import * as dotenv from 'dotenv';
import { IUser } from './interfaces/user';
import { User } from './user';
dotenv.config();

const influxDB: DBInstance = new DBInstance(process.env.ROOT_TOKEN!, 'my-org', 'test-bucket');

const users: User = new User(influxDB);
//
// users.createUser("John", "john_doe");

const server: Express = express();
const port: number = parseInt(process.env.PORT!);

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use((req, res, next) => {
	console.log(req.url);
	next();
});

server.get('/', (req: Request, res: Response) => {
	res.send('Hello world');
});

server.put('/create-user', (req: Request, res: Response) => {
	const user: IUser = req.body;

	users.createUser(user.name, user.login).pipe(
		catchError((err: any) => {
			console.error(err);
			res.status(400).json({ errorMessage: err.message });
			return of(void 0);
		}),
	);
});

server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
