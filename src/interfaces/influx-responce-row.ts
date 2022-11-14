export interface IInfluxResponseRow {
	result: string;
	table: number;
	_start: string;
	_stop: string;
	_time: string;
	_value: string;
	_field: string;
	_measurement: string;
}
