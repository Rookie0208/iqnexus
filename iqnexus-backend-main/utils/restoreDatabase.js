import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import readline from "readline";

dotenv.config();

// this action will overwrite existing data in the database!

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function restoreDatabase(dumpDirPath) {
  try {
    if (!process.env.MONGO_URI) {
      console.error(" Error: MONGO_URI is not defined in .env file");
      process.exit(1);
    }

    // Verify dump directory exists
    if (!fs.existsSync(dumpDirPath)) {
      console.error(` Dump directory not found: ${dumpDirPath}`);
      process.exit(1);
    }

    const summaryPath = path.join(dumpDirPath, '_DUMP_SUMMARY.json');
    if (!fs.existsSync(summaryPath)) {
      console.error(` Summary file not found in dump directory`);
      process.exit(1);
    }

    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    
    console.log("\n📋 DUMP INFORMATION:");
    console.log("=".repeat(70));
    console.log(`Database: ${summary.database}`);
    console.log(`Timestamp: ${summary.timestamp}`);
    console.log(`Collections: ${summary.collections.length}`);
    console.log(`Total Documents: ${summary.collections.reduce((sum, col) => sum + (col.documentCount || 0), 0)}`);
    console.log("=".repeat(70) + "\n");

    // Warning prompt
    console.log("  WARNING: This will OVERWRITE existing data in the database!");
    console.log("  Make sure you have a backup before proceeding!\n");
    
    const confirm1 = await askQuestion("Type 'YES' to continue: ");
    if (confirm1 !== 'YES') {
      console.log("\n❌ Restore cancelled");
      rl.close();
      process.exit(0);
    }

    const confirm2 = await askQuestion("\n  Are you absolutely sure? Type 'RESTORE' to proceed: ");
    if (confirm2 !== 'RESTORE') {
      console.log("\n❌ Restore cancelled");
      rl.close();
      process.exit(0);
    }

    rl.close();

    console.log("\n🔌 Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(" MongoDB connected successfully\n");

    const db = mongoose.connection.db;
    console.log(" Starting restore process...\n");

    let restoredCount = 0;
    let errorCount = 0;

    // Restore each collection
    for (const collectionInfo of summary.collections) {
      if (collectionInfo.error) {
        console.log(`     Skipping ${collectionInfo.name} (had error in dump)`);
        continue;
      }

      const filename = path.join(dumpDirPath, collectionInfo.filename);
      
      try {
        const documents = JSON.parse(fs.readFileSync(filename, 'utf8'));
        
        if (documents.length > 0) {
          const collection = db.collection(collectionInfo.name);
          
          // Clear existing data
          await collection.deleteMany({});
          
          // Insert dumped data
          await collection.insertMany(documents);
          
          console.log(`    ${collectionInfo.name.padEnd(40)} - ${documents.length} documents restored`);
          restoredCount++;
        } else {
          console.log(`     ${collectionInfo.name.padEnd(40)} - Empty collection, skipped`);
        }
      } catch (error) {
        console.log(`   ❌ ${collectionInfo.name.padEnd(40)} - Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log(" DATABASE RESTORE COMPLETED!");
    console.log("=".repeat(70));
    console.log(` Successfully restored: ${restoredCount} collections`);
    console.log(`❌ Errors: ${errorCount} collections`);
    console.log("=".repeat(70) + "\n");

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB\n");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ RESTORE FAILED:", error);
    console.error("\nError details:", error.message);
    
    await mongoose.disconnect().catch(() => {});
    rl.close();
    process.exit(1);
  }
}

// Main execution
console.log("╔════════════════════════════════════════════════════════════════════╗");
console.log("║          MongoDB Database Restore - Recovery Utility               ║");
console.log("║                                                                    ║");
console.log("╚════════════════════════════════════════════════════════════════════╝\n");

const dumpDir = process.argv[2];

if (!dumpDir) {
  console.error("❌ Usage: node restoreDatabase.js <dump-directory-path>");
  console.error("\nExample:");
  console.error("  node restoreDatabase.js utils/db-dump-2025-11-08-1699459200000\n");
  process.exit(1);
}

restoreDatabase(dumpDir);
