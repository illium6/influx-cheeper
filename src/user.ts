import { Point, Row } from '@influxdata/influxdb-client';
import { catchError, finalize, from, Observable, of, take, tap } from 'rxjs';
import { DBInstance } from './DBInstance';
import { InfluxQueryBuilder } from './influx-query-builder';
import { IUnsafe } from './interfaces/unsafe-value';

export class User {
	public constructor(private db: DBInstance) {}

	public createUser(name: string, login: string): Observable<any> {
		let hasValue: boolean = false;
		return this.getUserByLogin(login).pipe(
			take(1),
			tap((value: IUnsafe<Row>) => (hasValue = !!value)),
			finalize(() => {
				if (!hasValue) {
					const user: Point = new Point('users')
						.stringField('name', name)
						.stringField('login', login);

					this.db.writeAPI.writePoint(user);
					this.db.writeAPI.close().then(() => {
						console.log('writing user done');
					});
				} else {
					throw new Error('User with such login already exist');
				}
			}),
		);
	}

	private getUserByLogin(login: string): Observable<IUnsafe<Row>> {
		const queryBuilder: InfluxQueryBuilder = new InfluxQueryBuilder(this.db.bucket);

		queryBuilder.addMeasurement('user');
		queryBuilder.addField('login');
		queryBuilder.addValue(login);

		// const userExistQuery: string = `from(bucket: "${this.bucket}")
		// |> range(start: 0)
		// |> filter(fn: (r) => r["_measurement"] == "users")
		// |> filter(fn: (r) => r["_field"] == "login")
		// |> filter(fn: (r) => r["_value"] == "${login}")`;

		return from(this.db.queryAPI.rows(queryBuilder.build())).pipe(
			catchError((err: any) => {
				console.error(err);
				return of(void 0);
			}),
		);
	}
}
