import { Row } from '@influxdata/influxdb-client';
import { IUnsafe } from './unsafe-value';

export interface IQueryResponse {
	body: IUnsafe<Row>;
	status: boolean;
	err?: Error;
}
