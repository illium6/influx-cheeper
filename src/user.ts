import { Point, Row } from '@influxdata/influxdb-client';
import {
	catchError,
	filter,
	finalize,
	from,
	last,
	Observable,
	of,
	startWith, switchMap,
	take,
	tap,
} from 'rxjs';
import { DBInstance } from './DBInstance';
import { InfluxQueryBuilder } from './influx-query-builder';
import { IUnsafe } from './interfaces/unsafe-value';

export class User {
	public constructor(private db: DBInstance) {}

	public createUser(name: string, login: string): Observable<any> {
		return this.getUserByLogin(login).pipe(
			switchMap((row: IUnsafe<Row>) => {
				if (!row) {
					throw new Error('User already exists')
				}

				const user: Point = new Point('users')
					.stringField('name', name)
					.stringField('login', login);

				this.db.writeAPI.writePoint(user);

				return from(this.db.writeAPI.close()) // TODO доделать обработку
			})
		);
	}

	private getUserByLogin(login: string): Observable<IUnsafe<Row>> {
		const queryBuilder: InfluxQueryBuilder = new InfluxQueryBuilder(this.db.bucket);

		queryBuilder.addMeasurement('user');
		queryBuilder.addField('login');
		queryBuilder.addValue(login);

		// const userExistQuery: string = `from(bucket: "${this.db.bucket}")
		// |> range(start: 0)
		// |> filter(fn: (r) => r["_measurement"] == "users")
		// |> filter(fn: (r) => r["_field"] == "login")
		// |> filter(fn: (r) => r["_value"] == "${login}")`;

		return from(this.db.queryAPI.rows(queryBuilder.build())).pipe(
			last(() => true, null),
			catchError((err: any) => {
				console.error(err);
				return of(void 0);
			}),
		);
	}
}
