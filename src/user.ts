import { Point, Row } from '@influxdata/influxdb-client';
import { catchError, forkJoin, from, last, map, Observable, of, switchMap } from 'rxjs';
import { DBInstance } from './DBInstance';
import { IQueryResponse } from './interfaces/query-response';
import { UserError } from './models/user-error';

export class User {
	public constructor(private db: DBInstance) {}

	public addFriend(userLogin: string, friendLogin: string): Observable<void> {
		// TODO проверить на существующую пару друзей
		return forkJoin([this.getUserByLogin(userLogin), this.getUserByLogin(friendLogin)]).pipe(
			switchMap((users: IQueryResponse[]) => {
				if (users.some((user: IQueryResponse) => !!user.err)) {
					const erroredUser: IQueryResponse = users.find(
						(user: IQueryResponse) => !!user.err,
					)!;
					throw new Error(erroredUser.err!.message);
				}

				if (!users.every((user: IQueryResponse) => user.status)) {
					throw new UserError('No matching users found.');
				}

				const user: Point = new Point('friends')
					.stringField('userLogin', userLogin)
					.stringField('friendLogin', friendLogin);

				this.db.writeAPI.writePoint(user);

				return from(this.db.writeAPI.flush());
			}),
		);
	}

	public createUser(name: string, login: string): Observable<void> {
		return this.getUserByLogin(login).pipe(
			switchMap((row: IQueryResponse) => {
				if (row.err) {
					throw new Error(row.err.message);
				}

				if (row.status) {
					throw new UserError('User already exists');
				}

				const user: Point = new Point('users')
					.stringField('name', name)
					.stringField('login', login);

				this.db.writeAPI.writePoint(user);

				return from(this.db.writeAPI.flush());
			}),
		);
	}

	private getUserByLogin(login: string): Observable<IQueryResponse> {
		// const queryBuilder: InfluxQueryBuilder = new InfluxQueryBuilder(this.db.bucket);
		//
		// queryBuilder.addMeasurement('user');
		// queryBuilder.addField('login');
		// queryBuilder.addValue(login);

		const userExistQuery: string = `from(bucket: "${this.db.bucket}")
		|> range(start: 0)
		|> filter(fn: (r) => r["_measurement"] == "users")
		|> filter(fn: (r) => r["_field"] == "login")
		|> filter(fn: (r) => r["_value"] == "${login}")`;

		return from(this.db.queryAPI.rows(userExistQuery)).pipe(
			map((row: Row) => ({ body: row, status: true })),
			last(() => true, { body: null, status: false }),
			catchError((err: any) => {
				console.error(err);
				return of({ body: null, status: false, err });
			}),
		);
	}
}
