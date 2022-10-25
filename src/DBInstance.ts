import { InfluxDB, Point, QueryApi, Row, WriteApi } from '@influxdata/influxdb-client';
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
	take,
	tap,
} from 'rxjs';
import { IInfluxResponceRow } from './interfaces/influx-responce-row';
import { IUnsafe } from './interfaces/unsafe-value';

export class DBInstance {
	private client: InfluxDB;
	public writeAPI: WriteApi;
	public queryAPI: QueryApi;

	public constructor(token: string, private org: string, public bucket: string) {
		this.client = new InfluxDB({
			url: 'http://localhost:8086',
			token,
		});

		this.writeAPI = this.client.getWriteApi(this.org, this.bucket);
		this.queryAPI = this.client.getQueryApi(this.org);
	}
}
