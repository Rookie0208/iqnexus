import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

/**
 * Complete Database Dump Script
 * Creates a full backup of all collections in the database
 * Safe: Only reads data, does not modify anything
 */

async function dumpDatabase() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ Error: MONGO_URI is not defined in .env file");
      process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully\n");

    // Get database name from connection string
    const dbName = process.env.DATABASE_NAME || "Epoch-olympiad-foundation_New";
    console.log(`📊 Database: ${dbName}\n`);

    // Get all collection names
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`📂 Found ${collections.length} collections:\n`);
    collections.forEach((col, idx) => {
      console.log(`   ${idx + 1}. ${col.name}`);
    });
    console.log("");

    // Create dump directory with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const dumpDir = path.join(process.cwd(), 'utils', `db-dump-${timestamp}-${Date.now()}`);
    
    if (!fs.existsSync(dumpDir)) {
      fs.mkdirSync(dumpDir, { recursive: true });
    }

    console.log(`💾 Dumping data to: ${dumpDir}\n`);
    console.log("⏳ Starting dump process...\n");

    const dumpSummary = {
      timestamp: new Date().toISOString(),
      database: dbName,
      mongoUri: process.env.MONGO_URI.replace(/\/\/.*:.*@/, '//***:***@'), // Hide credentials
      collections: []
    };

    // Dump each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      
      try {
        const collection = db.collection(collectionName);
        const documents = await collection.find({}).toArray();
        const count = documents.length;

        // Save to JSON file
        const filename = path.join(dumpDir, `${collectionName}.json`);
        fs.writeFileSync(filename, JSON.stringify(documents, null, 2));

        console.log(`   ✅ ${collectionName.padEnd(40)} - ${count} documents`);
        
        dumpSummary.collections.push({
          name: collectionName,
          documentCount: count,
          filename: `${collectionName}.json`
        });
      } catch (error) {
        console.log(`   ❌ ${collectionName.padEnd(40)} - Error: ${error.message}`);
        dumpSummary.collections.push({
          name: collectionName,
          error: error.message
        });
      }
    }

    // Save dump summary
    const summaryFile = path.join(dumpDir, '_DUMP_SUMMARY.json');
    fs.writeFileSync(summaryFile, JSON.stringify(dumpSummary, null, 2));

    // Calculate total size
    const files = fs.readdirSync(dumpDir);
    let totalSize = 0;
    files.forEach(file => {
      const filePath = path.join(dumpDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    });

    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    console.log("\n" + "=".repeat(70));
    console.log("✅ DATABASE DUMP COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(70));
    console.log(`📁 Location: ${dumpDir}`);
    console.log(`📊 Total Collections: ${collections.length}`);
    console.log(`📄 Total Documents: ${dumpSummary.collections.reduce((sum, col) => sum + (col.documentCount || 0), 0)}`);
    console.log(`💾 Total Size: ${totalSizeMB} MB`);
    console.log(`📋 Summary File: _DUMP_SUMMARY.json`);
    console.log("=".repeat(70));
    console.log("\n💡 To restore this dump, use the restore script");
    console.log("⚠️  Keep this backup safe before making any database changes!\n");

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB\n");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ DUMP FAILED:", error);
    console.error("\nError details:", error.message);
    
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

// Run the dump
console.log("╔════════════════════════════════════════════════════════════════════╗");
console.log("║          MongoDB Database Dump - Safe Backup Utility              ║");
console.log("║                 Read-Only Operation                                ║");
console.log("╚════════════════════════════════════════════════════════════════════╝\n");

dumpDatabase();
