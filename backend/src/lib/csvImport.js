import fs from "fs";
import { parse } from "csv-parse";
import { pool } from "./db.js";

// Usage: node backend/src/lib/csvImport.js ../data.csv
const file = process.argv[2];
if(!file){ console.error("CSV file path is required"); process.exit(1); }

(async ()=>{
  const parser = fs.createReadStream(file).pipe(parse({ columns:true, trim:true }));
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for await (const row of parser) {
      await conn.query("INSERT INTO records (payload) VALUES (?)", [JSON.stringify(row)]);
    }
    await conn.commit();
    console.log("CSV import done.");
  } catch (e) { await conn.rollback(); console.error(e); }
  finally { conn.release(); }
})();