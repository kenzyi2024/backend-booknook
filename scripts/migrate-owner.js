/**
 * ONE-TIME MIGRATION
 *
 * Reassigns every owner-less book to a user you provide. Useful if you have old
 * books in the database and want to attach them to a freshly-registered account.
 *
 * HOW TO FIND YOUR USER ID:
 *   Register/log in, then in the browser console run:
 *     JSON.parse(atob(localStorage.getItem('booknook_token').split('.')[1])).userId
 *   (or look up your user in MongoDB — it's the _id of your users document).
 *
 * RUN:
 *   node scripts/migrate-owner.js 66f1a2b3c4d5e6f7a8b9c0d1
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Book from '../models/Book.js';

dotenv.config();

const ownerId = process.argv[2];

if (!ownerId || !/^[a-f0-9]{24}$/i.test(ownerId)) {
  console.error('❌ Please pass a valid MongoDB user id (24 hex chars), e.g.:');
  console.error('   node scripts/migrate-owner.js 66f1a2b3c4d5e6f7a8b9c0d1');
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const result = await Book.updateMany(
    { $or: [{ owner: { $exists: false } }, { owner: null }, { owner: '' }] },
    { $set: { owner: ownerId } }
  );

  console.log(`📚 Assigned ${result.modifiedCount} book(s) to ${ownerId}`);
  await mongoose.disconnect();
  console.log('✅ Done');
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
