import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { type: String, default: 'Fiction' },
  totalPages: { type: Number, required: true },
  coverColor: { type: String, default: 'bg-amber-700' },

  // Add these inside your mongoose.Schema({ ... })
  aiAnalysis: { 
    type: String, 
    default: "" 
  },
  smartRecap: { 
    type: String, 
    default: "" 
  },
  recapPage: { 
    type: Number, 
    default: 0 
  },
  
  // 🛡️ THE NEW FIELDS WE NEED TO ALLOW:
  coverUrl: { type: String },
  status: { type: String, default: 'want_to_read' },
  currentPage: { type: Number, default: 0 },
  rating: { type: Number },
  notes: { type: String }
}, { 
  timestamps: true 
});

export default mongoose.model('Book', bookSchema);