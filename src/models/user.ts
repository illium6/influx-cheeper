import { Point, Row } from '@influxdata/influxdb-client';
import {
	catchError,
	concatMap,
	first,
	forkJoin,
	from,
	map,
	Observable,
	of,
	reduce,
	switchMap,
} from 'rxjs';
import { DBInstance } from '../DBInstance';
import { IQueryResponse } from '../interfaces/query-response';
import { IFriendsCount, IUser } from '../interfaces/user';
import { UserError, UserExistError } from './user-error';

export class User {
	public constructor(private db: DBInstance) {}

	public getFriends(user: string): Observable<IQueryResponse<IUser[]>> {
		return this.getFriendsLogin(user).pipe(
			concatMap((row: IQueryResponse) => {
				if (!row.status) {
					throw row.err;
				}

				const o = row.body && row.body.tableMeta.toObject(row.body.values);
				return this.getUserByLogin(o!._value);
			}),
			map((userRow: IQueryResponse) => {
				const o = userRow.body && userRow.body.tableMeta.toObject(userRow.body.values);
				return {
					name: o && o.name,
					login: o && o.login,
				};
			}),
			reduce(
				(acc: IQueryResponse<IUser[]>, cur: IUser) => {
					acc.body!.push(cur);
					return acc;
				},
				{ body: [], status: true },
			),
			map((value: IQueryResponse<IUser[]>) => {
				value.body && value.body.sort((a, b) => a.name.localeCompare(b.name));
				return value;
			}),
			first(() => true, { body: null, status: false }),
			catchError((err: any) => {
				console.error(err);
				return of({ body: null, status: false, err });
			}),
		);
	}

	public getFriendsCount(user: string): Observable<IQueryResponse<IFriendsCount>> {
		const countQuery: string = `from(bucket: "${this.db.bucket}")
		|> range(start: 0)
		|> filter(fn: (r) => r["_measurement"] == "${user} friends")
		|> filter(fn: (r) => r._field == "friendLogin")
		|> count()`;

		return from(this.db.queryAPI.rows(countQuery)).pipe(
			map((row: Row) => {
				const o = row.tableMeta.toObject(row.values);
				return { body: { friendsCount: o._value }, status: true };
			}),
			first(() => true, { body: null, status: false }),
			catchError((err: any) => {
				console.error(err);
				return of({ body: null, status: false, err });
			}),
		);
	}

	private getFriendsLogin(user: string, friend?: string): Observable<IQueryResponse> {
		let pairQuery: string = `from(bucket: "${this.db.bucket}")
		|> range(start: 0)
		|> filter(fn: (r) => r["_measurement"] == "${user} friends")
		|> filter(fn: (r) => r._field == "friendLogin")`;

		if (friend) {
			pairQuery += `\n		|> filter(fn: (r) => r._value == "${friend}")`;
		}

		return from(this.db.queryAPI.rows(pairQuery)).pipe(
			map((row: Row) => ({ body: row, status: true })),
			catchError((err: any) => {
				console.error(err);
				return of({ body: null, status: false, err });
			}),
		);
	}

	public addFriend(userLogin: string, friendLogin: string): Observable<void> {
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

				return this.getFriendsLogin(userLogin, friendLogin).pipe(
					first(() => true, { body: null, status: false }),
				);
			}),
			switchMap((friendsPairs: IQueryResponse) => {
				if (friendsPairs.status) {
					throw new UserExistError('Given users is already friends.');
				}

				const userEntry: Point = new Point(`${userLogin} friends`).stringField(
					'friendLogin',
					friendLogin,
				);

				const friendEntry: Point = new Point(`${friendLogin} friends`).stringField(
					'friendLogin',
					userLogin,
				);

				this.db.writeAPI.writePoint(userEntry);
				this.db.writeAPI.writePoint(friendEntry);

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
					throw new UserExistError('User already exists');
				}

				const user: Point = new Point('users')
					.stringField('name', name)
					.stringField('login', login);

				this.db.writeAPI.writePoint(user);

				return from(this.db.writeAPI.flush());
			}),
		);
	}

	public getUserByLogin(login: string): Observable<IQueryResponse> {
		const userExistQuery: string = `from(bucket: "${this.db.bucket}")
		|> range(start: 0)
		|> filter(fn: (r) => r["_measurement"] == "users")
		|> filter(fn: (r) => r["_field"] == "login" or r["_field"] == "name")
		|> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
		|> filter(fn: (r) => r.login == "${login}")`;

		return from(this.db.queryAPI.rows(userExistQuery)).pipe(
			map((row: Row) => ({ body: row, status: true })),
			first(() => true, { body: null, status: false }),
			catchError((err: any) => {
				console.error(err);
				return of({ body: null, status: false, err });
			}),
		);
	}
}
