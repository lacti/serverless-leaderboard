import * as fs from "fs";

import SqliteDbContext from "../models/SqliteDbContext";

export default function closeSqliteDatabase({
  db,
  localDbFile,
}: SqliteDbContext): void {
  db.close();
  fs.unlinkSync(localDbFile);
}
