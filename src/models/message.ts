import { Point, Row } from '@influxdata/influxdb-client';
import { v4 as uuidv4 } from 'uuid';
import { from, map, Observable, reduce, switchMap } from 'rxjs';
import { DBInstance } from '../DBInstance';
import { IMessage } from '../interfaces/message';
import { IQueryResponse } from '../interfaces/query-response';
import { IUnsafe } from '../interfaces/unsafe-value';
import { User } from './user';
import { UserError } from './user-error';

export class Message {
	public constructor(private db: DBInstance, private userModel: User) {}

	public getMessages(
		userLogin: string,
		searchStart?: IUnsafe<string>,
		searchEnd?: IUnsafe<string>,
	): Observable<IMessage[]> {
		return this.userModel.getUserByLogin(userLogin).pipe(
			switchMap((row: IQueryResponse) => {
				if (row.err) {
					throw new Error(row.err.message);
				}

				if (!row.status) {
					throw new UserError('No matching user found.');
				}

				const query: string = `from(bucket: "${this.db.bucket}")
				|> range(start: ${searchStart || '0'}, stop: ${searchEnd || 'now()'})
				|> filter(fn: (r) => r["_measurement"] == "messages")
				|> filter(fn: (r) => r._field == "userLogin" or r._field == "message" or r._field == "id")
				|> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
				|> filter(fn: (r) => r.userLogin == "${userLogin}")`;

				return from(this.db.queryAPI.rows(query)).pipe(
					map((row: Row) => {
						const o = row.tableMeta.toObject(row.values);
						return {
							id: o.id,
							message: o.message,
						};
					}),
					reduce((acc: IMessage[], cur: IMessage) => {
						acc.push(cur);
						return acc;
					}, []),
				);
			}),
		);
	}

	public addMessage(userLogin: string, message: string): Observable<void> {
		return this.userModel.getUserByLogin(userLogin).pipe(
			switchMap((row: IQueryResponse) => {
				if (row.err) {
					throw new Error(row.err.message);
				}

				if (!row.status) {
					throw new UserError('No matching user found.');
				}

				const messageToWrite: Point = new Point('messages')
					.stringField('userLogin', userLogin)
					.stringField('id', uuidv4())
					.stringField('message', message);

				this.db.writeAPI.writePoint(messageToWrite);

				return from(this.db.writeAPI.flush());
			}),
		);
	}
}
