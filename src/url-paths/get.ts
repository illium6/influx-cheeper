import express, { Request, Response, Router } from 'express';

const routes: Router = express.Router();

routes.get('/friends/:login', (req: Request, res: Response) => {
	const userId: string = req.params.login;


});

export default routes;
