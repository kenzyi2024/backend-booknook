import mongoose from 'mongoose';

/**
 * A registered user. Auth is email + password; the password is stored only as a
 * bcrypt hash (never plain text). Book ownership references this document's _id
 * via Book.owner.
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    username: { type: String, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

// Never expose the password hash in JSON responses.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
