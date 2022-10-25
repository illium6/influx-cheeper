import { Point, Row } from '@influxdata/influxdb-client';
import { finalize, from, Observable, take, tap } from 'rxjs';
import { DBInstance } from './DBInstance';
import { InfluxQueryBuilder } from './influx-query-builder';
import { IUnsafe } from './interfaces/unsafe-value';

export class User {
	public constructor(private db: DBInstance) {
	}

	public createUser(name: string, login: string): void {
		let hasValue: boolean = false;
		this.getUserByLogin(login)
			.pipe(
				take(1),
				tap((value: IUnsafe<Row>) => (hasValue = !!value)),
				finalize(() => {
					if (!hasValue) {
						const user: Point = new Point('users')
							.stringField('name', name)
							.stringField('login', login)
							// очень грязный хак, писать в поле через пробел логины друзей
							.stringField('friends', '');

						this.db.writeAPI.writePoint(user);
						this.db.writeAPI.close().then(() => {
							console.log('writing user done');
						});
					} else {
						console.error('User with such login already exist');
					}
				}),
			)
			.subscribe();
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

		return from(this.db.queryAPI.rows(queryBuilder.build()));
	}

}
