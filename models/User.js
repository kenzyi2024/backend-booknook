import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // --- Account Info ---
  username: {
    type: String,
    required: true,
    unique: true, // Ensures no two users have the same handle
    trim: true,
    minLength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  // When we plug in Clerk or Firebase later, they will manage the actual passwords securely 
  // and give us a unique string of characters to identify the user.
  authProviderId: {
    type: String,
    required: true,
    unique: true
  },

  // --- Profile Customization ---
  profilePicture: {
    type: String,
    default: '' // Can be a URL to an image later
  },
  bio: {
    type: String,
    maxLength: 160
  },

  // --- The Multiplayer Network (References) ---
  // This array stores the unique IDs of all the books sitting on their personal shelf
  savedBooks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }],
  
  // Future-proofing for your Book Clubs feature!
  clubs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club' 
  }],
  
  // Future-proofing for a social network friends list!
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
  
}, { timestamps: true }); // Automatically tracks exactly when they joined

const User = mongoose.model('User', userSchema);

export default User;