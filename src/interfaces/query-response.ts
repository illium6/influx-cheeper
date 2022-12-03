import { Row } from '@influxdata/influxdb-client';
import { IUnsafe } from './unsafe-value';

export interface IQueryResponse<T = Row> {
	body: IUnsafe<T>;
	status: boolean;
	err?: Error;
}
