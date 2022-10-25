import { DBInstance } from "./DBInstance";
import * as dotenv from 'dotenv';
import { User } from './user';
dotenv.config()

const influxDB: DBInstance = new DBInstance(
  process.env.ROOT_TOKEN!,
  "my-org",
  "test-bucket"
);

const users: User = new User(influxDB);

users.createUser("John", "john_doe");
