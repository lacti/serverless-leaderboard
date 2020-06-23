import * as fs from "fs";

import SqliteDbContext from "../models/SqliteDbContext";
import { elapsedSync } from "../elapsed";

function closeSqliteDatabase({ db, localDbFile }: SqliteDbContext): void {
  db.close();
  fs.unlinkSync(localDbFile);
}

export default elapsedSync(closeSqliteDatabase);
