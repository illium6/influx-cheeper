import { InfluxDB, QueryApi, WriteApi } from '@influxdata/influxdb-client';

export class DBInstance {
	private client: InfluxDB;
	public writeAPI: WriteApi;
	public queryAPI: QueryApi;

	private static instances: Map<string, DBInstance> = new Map<string, DBInstance>();

	public constructor(private org: string, public bucket: string) {
		this.client = new InfluxDB({
			url: 'http://localhost:8086',
			token: process.env.ROOT_TOKEN,
		});

		this.writeAPI = this.client.getWriteApi(this.org, this.bucket);
		this.queryAPI = this.client.getQueryApi(this.org);
	}

	public static getDBInstance(org: string, bucket: string): DBInstance {
		const key: string = org + bucket;
		if (DBInstance.instances.has(key)) {
			return DBInstance.instances.get(key)!;
		} else {
			const newDbConn: DBInstance = new DBInstance(org, bucket);
			DBInstance.instances.set(key, newDbConn);
			return newDbConn;
		}
	}
}
