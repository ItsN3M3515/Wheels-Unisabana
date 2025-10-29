/**
 * Clean MongoDB Atlas Database
 * 
 * WARNING: This will DELETE ALL DATA from your MongoDB Atlas database!
 * 
 * Usage: node clean-atlas-db.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in .env file');
  process.exit(1);
}

async function cleanDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    console.log(`📍 URI: ${MONGODB_URI.replace(/:[^:]*@/, ':****@')}`); // Hide password
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('ℹ️  No collections found. Database is already empty.');
      await mongoose.disconnect();
      return;
    }

    console.log(`📊 Found ${collections.length} collection(s):\n`);
    
    // Drop each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      
      console.log(`🗑️  Dropping collection: ${collectionName} (${count} documents)`);
      await db.collection(collectionName).drop();
    }

    console.log('\n✅ All collections dropped successfully!');
    console.log('🎯 Database is now completely clean.');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Confirmation
console.log('\n⚠️  WARNING: This will DELETE ALL DATA from MongoDB Atlas!');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

setTimeout(() => {
  cleanDatabase();
}, 5000);

