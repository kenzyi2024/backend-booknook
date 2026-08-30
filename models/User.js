import mongoose from 'mongoose';

// A decorative shelf gadget (a plant or a framed photo).
const decorSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['plant', 'photo'], default: 'plant' },
    variant: { type: String, default: 'succulent' }, // plant style
    image: { type: String, default: '', maxlength: 700000 }, // base64 (downscaled) for photos
    frame: { type: String, default: 'classic' },
    caption: { type: String, default: '', maxlength: 200 },
    position: { type: Number, default: 0 }, // how many books precede it on the shelf
  },
  { _id: true }
);

/**
 * A registered user. Auth is email+password OR Google. Passwords (when present)
 * are bcrypt-hashed; Google accounts have no password.
 */
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    username: { type: String, trim: true, maxlength: 80 },
    name: { type: String, trim: true, default: '', maxlength: 80 },
    passwordHash: { type: String }, // optional: Google users have none
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },

    profilePicture: { type: String, default: '', maxlength: 700000 }, // base64 (downscaled) or URL
    theme: { type: String, default: 'terracotta', maxlength: 30 },
    shelfDecor: { type: [decorSchema], validate: [(a) => a.length <= 100, 'Too many decorations.'] },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
