export class InfluxQueryBuilder {
	private rangeStart: string = '0';
	private rangeStop!: string;
	private measurement!: string;
	private field!: string;
	private value!: string;
	private bucket: string;
	private aggregateFn!: string;

	public constructor(bucketName: string) {
		this.bucket = bucketName;
	}

	public range(start: string, stop?: string): this {
		this.rangeStart = start;
		this.rangeStop = stop || this.rangeStop;

		return this;
	}

	public addMeasurement(measurement: string): this {
		this.measurement = measurement;
		return this;
	}

	public addField(field: string): this {
		this.field = field;
		return this;
	}

	public addValue(value: string): this {
		this.value = value;

		return this;
	}

	public addAggregateFn(fnName: string): this {
		this.aggregateFn = fnName;
		return this;
	}

	public build(): string {
		let result: string = `from(bucket: "${this.bucket}")`;

		result += `|> range(start: ${this.rangeStart}${
			this.rangeStop ? `, stop: ${this.rangeStop}` : ''
		})`;

		result += `|> filter(fn: (r) => r["_measurement"] == "${this.measurement}")`;

		result += `|> filter(fn: (r) => r["_field"] == "${this.field}")`;

		if (this.aggregateFn) {
			result += `|> aggregateWindow(every: v.windowPeriod, fn: ${this.aggregateFn}, createEmpty: false)|> yield(name: "${this.aggregateFn}")`;
		}

		return result;
	}
}
