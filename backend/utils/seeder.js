const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Category = require('../models/Category');
const Book = require('../models/Book');
const Settings = require('../models/Settings');
const Transaction = require('../models/Transaction');
const Reservation = require('../models/Reservation');

dotenv.config({ path: __dirname + '/../.env' });

const seedData = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library_management';
    await mongoose.connect(mongoURI);
    console.log('[Seeder] Connected to database...');

    // Clear existing data optionally or upsert default users
    console.log('[Seeder] Ensuring default Admin, Librarian, and Member accounts...');

    // 1. Admin Account
    let admin = await User.findOne({ email: 'admin@library.edu' });
    if (!admin) {
      admin = await User.create({
        name: 'System Administrator',
        email: 'admin@library.edu',
        password: 'Admin@123',
        role: 'admin',
        memberId: 'ADM-001',
        phone: '+91 9876543210',
        isActive: true,
      });
      console.log(' -> Admin created: admin@library.edu / Admin@123');
    } else {
      console.log(' -> Admin account already exists.');
    }

    // 2. Librarian Account
    let librarian = await User.findOne({ email: 'librarian@library.edu' });
    if (!librarian) {
      librarian = await User.create({
        name: 'Chief Librarian',
        email: 'librarian@library.edu',
        password: 'Librarian@123',
        role: 'librarian',
        memberId: 'LIB-001',
        phone: '+91 9876543211',
        isActive: true,
      });
      console.log(' -> Librarian created: librarian@library.edu / Librarian@123');
    } else {
      console.log(' -> Librarian account already exists.');
    }

    // 3. Member Account
    let member = await User.findOne({ email: 'student@library.edu' });
    if (!member) {
      member = await User.create({
        name: 'Jane Doe',
        email: 'student@library.edu',
        password: 'Student@123',
        role: 'member',
        memberId: 'MEM-10001',
        phone: '+91 9876543212',
        isActive: true,
      });
      console.log(' -> Member created: student@library.edu / Student@123');
    } else {
      console.log(' -> Member account already exists.');
    }

    // 4. Default Settings
    await Settings.getSettings();
    console.log(' -> Default Settings verified.');

    // 5. Default Categories
    const categoriesData = [
      { name: 'Computer Science & Engineering', description: 'Algorithms, Data Structures, AI, Web Development' },
      { name: 'Information Technology', description: 'Cloud, Networking, Cybersecurity, Database Systems' },
      { name: 'Electronics & Communication', description: 'VLSI, Digital Signal Processing, Embedded Systems' },
      { name: 'Mechanical Engineering', description: 'Thermodynamics, Robotics, Fluid Mechanics' },
      { name: 'Business & Management', description: 'Finance, Marketing, Organizational Behavior, Operations' },
      { name: 'Mathematics & Natural Sciences', description: 'Calculus, Linear Algebra, Quantum Mechanics' },
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      let existingCat = await Category.findOne({ name: cat.name });
      if (!existingCat) {
        existingCat = await Category.create(cat);
      }
      categoryMap[cat.name] = existingCat._id;
    }
    console.log(' -> Default categories verified.');

    // 6. Sample Books
    const sampleBooks = [
      {
        title: 'Introduction to Algorithms (CLRS)',
        author: 'Thomas H. Cormen, Charles E. Leiserson',
        isbn: '978-0262033848',
        category: categoryMap['Computer Science & Engineering'],
        publisher: 'MIT Press',
        publishedYear: 2009,
        totalCopies: 5,
        availableCopies: 5,
        shelfLocation: 'Rack CS-01, Shelf A',
        coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&auto=format&fit=crop&q=80',
      },
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        category: categoryMap['Computer Science & Engineering'],
        publisher: 'Prentice Hall',
        publishedYear: 2008,
        totalCopies: 4,
        availableCopies: 4,
        shelfLocation: 'Rack CS-02, Shelf B',
        coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      },
      {
        title: 'Artificial Intelligence: A Modern Approach',
        author: 'Stuart Russell, Peter Norvig',
        isbn: '978-0136042594',
        category: categoryMap['Computer Science & Engineering'],
        publisher: 'Pearson',
        publishedYear: 2020,
        totalCopies: 3,
        availableCopies: 3,
        shelfLocation: 'Rack CS-03, Shelf C',
        coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
      },
      {
        title: 'Database System Concepts',
        author: 'Abraham Silberschatz, Henry F. Korth',
        isbn: '978-0078022159',
        category: categoryMap['Information Technology'],
        publisher: 'McGraw-Hill',
        publishedYear: 2019,
        totalCopies: 6,
        availableCopies: 6,
        shelfLocation: 'Rack IT-01, Shelf A',
        coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
      },
      {
        title: 'Computer Networking: A Top-Down Approach',
        author: 'James F. Kurose, Keith W. Ross',
        isbn: '978-0133594140',
        category: categoryMap['Information Technology'],
        publisher: 'Pearson',
        publishedYear: 2017,
        totalCopies: 4,
        availableCopies: 4,
        shelfLocation: 'Rack IT-02, Shelf B',
        coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
      },
    ];

    for (const book of sampleBooks) {
      const existing = await Book.findOne({ isbn: book.isbn });
      if (!existing && book.category) {
        await Book.create(book);
      }
    }
    console.log(' -> Sample library books verified.');

    console.log('\n[Seeder] Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error.message);
    process.exit(1);
  }
};

seedData();
