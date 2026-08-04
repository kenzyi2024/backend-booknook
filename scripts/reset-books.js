/**
 * Backup + optional wipe of the books collection.
 *   node scripts/reset-books.js            → connect, count, export a JSON backup
 *   node scripts/reset-books.js --wipe     → same, then delete ALL books
 *
 * Loads env from a given path or the local .env.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'node:fs';
import Book from '../models/Book.js';

const envPath = process.env.ENV_PATH || '.env';
dotenv.config({ path: envPath });

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('CONNECTED');

  const all = await Book.find().lean();
  console.log('BOOK_COUNT=' + all.length);

  const out = process.env.BACKUP_PATH || '/tmp/books-backup.json';
  fs.writeFileSync(out, JSON.stringify(all, null, 2));
  console.log('BACKUP_WRITTEN=' + out);

  if (process.argv.includes('--wipe')) {
    const res = await Book.deleteMany({});
    console.log('DELETED=' + res.deletedCount);
  }

  await mongoose.disconnect();
  console.log('DONE');
};

run().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
