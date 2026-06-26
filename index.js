import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Book from './models/Book.js'; // <-- 1. Import your new Book model

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors()); 
app.use(express.json()); 

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB successfully!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- Routes ---
// The test route
app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.status(200).json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Failed to fetch books." });
  }
});

// <-- 2. NEW POST ROUTE: Save a book to the database -->
app.post('/api/books', async (req, res) => {
  try {
    // Extract the book details sent over from React's req.body
    const { title, author, genre, totalPages, coverColor } = req.body;

    // Create a new MongoDB document using your Book blueprint
    const newBook = new Book({
      title,
      author,
      genre,
      totalPages,
      coverColor
    });

    // Save it permanently to the database
    const savedBook = await newBook.save();

    // Send a 201 (Created) success response back to React with the saved data
    res.status(201).json(savedBook);
    
  } catch (error) {
    console.error("Error saving book:", error);
    // If something goes wrong (e.g., missing a required field), send an error response
    res.status(500).json({ message: "Failed to save the book to the database.", error: error.message });
  }
});

// <-- NEW PUT ROUTE: Update an existing book in the database -->
app.put('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the book by its ID and update it with the new data from React
    // { new: true } tells MongoDB to send back the newly updated book, not the old one
    const updatedBook = await Book.findByIdAndUpdate(id, req.body, { returnDocument: 'after' });
    
    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found." });
    }
    
    res.status(200).json(updatedBook);
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ message: "Failed to update the book." });
  }
});

// <-- NEW DELETE ROUTE: Remove a book from the database -->
app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBook = await Book.findByIdAndDelete(id);
    
    if (!deletedBook) {
      return res.status(404).json({ message: "Book not found." });
    }
    
    res.status(200).json({ message: "Book deleted successfully." });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ message: "Failed to delete the book." });
  }
});

console.log("🌟 THE NEW ROUTES ARE OFFICIALLY LOADED!");

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

