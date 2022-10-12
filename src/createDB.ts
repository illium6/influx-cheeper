import { InfluxDB, QueryApi, Row, WriteApi } from '@influxdata/influxdb-client';
import {
	catchError,
	concat,
	finalize,
	from,
	map,
	Observable,
	of,
	startWith,
	switchMap,
	tap,
} from 'rxjs';
import { IInfluxResponceRow } from './interfaces/influx-responce-row';
import { IUnsafe } from './interfaces/unsafe-value';

export class CreateDB {
	private client: InfluxDB;
	private writeAPI: WriteApi;
	private queryAPI: QueryApi;

	public constructor(token: string, private org: string, private bucket: string) {
		this.client = new InfluxDB({
			url: 'http://localhost:8086',
			token,
		});

		this.writeAPI = this.client.getWriteApi(this.org, this.bucket);
		this.queryAPI = this.client.getQueryApi(this.org);
	}

	public createUser(name: string, login: string): void {
		this.getUserByLogin(login);
		// const user: Point = new Point('users')
		// 	.stringField('name', name)
		// 	.stringField('login', login);
		//
		// this.writeAPI.writePoint(user);
		// this.writeAPI.close().then(() => {
		// 	console.log('writing user done');
		// });
	}

	private getUserByLogin(login: string): Observable<IUnsafe<Row>> {
		const userExistQuery: string = `from(bucket: "${this.bucket}")
		|> range(start: 0)
		|> filter(fn: (r) => r["_measurement"] == "users")
		|> filter(fn: (r) => r["_field"] == "login")
		|> filter(fn: (r) => r["_value"] == "${login}")`;

		return from(this.queryAPI.rows(userExistQuery));
	}
}
