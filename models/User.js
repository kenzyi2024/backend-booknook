import mongoose from 'mongoose';

// A decorative shelf gadget (a plant or a framed photo).
const decorSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['plant', 'photo'], default: 'plant' },
    variant: { type: String, default: 'succulent' }, // plant style
    image: { type: String, default: '' }, // base64 (downscaled) for photos
    frame: { type: String, default: 'classic' },
    caption: { type: String, default: '' },
  },
  { _id: true }
);

/**
 * A registered user. Auth is email+password OR Google. Passwords (when present)
 * are bcrypt-hashed; Google accounts have no password.
 */
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    username: { type: String, trim: true },
    name: { type: String, trim: true, default: '' },
    passwordHash: { type: String }, // optional: Google users have none
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },

    profilePicture: { type: String, default: '' }, // base64 (downscaled) or URL
    theme: { type: String, default: 'terracotta' },
    shelfDecor: [decorSchema],
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
