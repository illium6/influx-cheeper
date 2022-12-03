////////////////
import * as dotenv from 'dotenv';
dotenv.config();
////////////////

import bodyParser from 'body-parser';
import express, { Express } from 'express';
import { catchError, forkJoin, of, switchMap, take } from 'rxjs';
import { DBInstance } from './DBInstance';
import { Message } from './models/message';
import { User } from './models/user';
import getRoutes from './url-paths/get';
import putRoutes from './url-paths/put';

const server: Express = express();
const port: number = parseInt(process.env.PORT!);

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

server.use(putRoutes);
server.use(getRoutes);

const usersModel: User = new User(DBInstance.getDBInstance('my-org', process.env.BUCKET!));
const messageModel: Message = new Message(
	DBInstance.getDBInstance('my-org', process.env.BUCKET!),
	usersModel,
);

function initValues(): void {
	forkJoin([
		usersModel.createUser('Aria Stark', 'SnowQueen3451'),
		usersModel.createUser('Harry Potter', 'boyWho-lived1337'),
		usersModel.createUser('JavaScript', 'js-rocks'),
		usersModel.createUser('Boba Fett', 'no-money-maker'),
		usersModel.createUser('Mario', 'hateLuigi-MUCH'),
	])
		.pipe(
			switchMap(() =>
				forkJoin([
					usersModel.addFriend('hateLuigi-MUCH', 'SnowQueen3451'),
					usersModel.addFriend('no-money-maker', 'boyWho-lived1337'),
					usersModel.addFriend('SnowQueen3451', 'js-rocks'),
					usersModel.addFriend('SnowQueen3451', 'no-money-maker'),
					usersModel.addFriend('js-rocks', 'no-money-maker'),
					usersModel.addFriend('boyWho-lived1337', 'hateLuigi-MUCH'),
				]),
			),
			switchMap(() =>
				forkJoin([
					messageModel.addMessage('SnowQueen3451', "I'm a potat"),
					messageModel.addMessage(
						'no-money-maker',
						'My head literally goes off when I see a Jedi',
					),
					messageModel.addMessage('hateLuigi-MUCH', 'MARIO BRAZA, WOOHOO'),
					messageModel.addMessage('boyWho-lived1337', 'Voldemort is gay'),
					messageModel.addMessage(
						'boyWho-lived1337',
						'Love gingers, my bf is one of them ;)',
					),
					messageModel.addMessage('boyWho-lived1337', 'Licking my eyeballs rn...'),
					messageModel.addMessage('js-rocks', 'Better use TypeScript'),
					messageModel.addMessage('hateLuigi-MUCH', 'SHROOOOOOOOOOMSSSSSS'),
					messageModel.addMessage('SnowQueen3451', 'Miss my dad so much'),
					messageModel.addMessage(
						'no-money-maker',
						'There is a party in a Sarlacc stomach, come and join me!',
					),
				]),
			),
			catchError((users: any) => {
				console.error(users.message);
				return of(void 0);
			}),
			take(1),
		)
		.subscribe();
}
server.listen(port, () => {
	initValues();

	console.log(`Server running on port ${port}`);
});
