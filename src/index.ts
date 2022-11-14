////////////////
import * as dotenv from 'dotenv';
dotenv.config();
////////////////

import bodyParser from 'body-parser';
import express, { Express, Request, Response } from 'express';
import routes from './url-paths/put';
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

server.use(routes);

server.get('/', (req: Request, res: Response) => {
	res.send('Hello world');
});

server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
