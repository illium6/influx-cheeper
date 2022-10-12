import { CreateDB } from "./createDB";

const influxDB: CreateDB = new CreateDB(
  "uS41dN2o9_h_lnYCxCACeXYR5lgqxraI2hEp7xoyQuhf29VixPh6EW9poSvEyrKoNZDxhY_jvlU2Pu62uGvoEw==",
  "my-org",
  "test-bucket"
);

influxDB.createUser("John", "111");
