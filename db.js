const { MongoClient } = require('mongodb');
require('dotenv').config();

console.log('Admin Credentials:', {
    user: process.env.ADMIN_USERNAME,
    pass: process.env.ADMIN_PASSWORD ? '***' : 'NOT SET'
});

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);

let db;
let isConnected = false;

async function connect() {
    try {
        if (!isConnected) {
            await client.connect();
            db = client.db(process.env.DB_NAME || "codeEditorDB");
            await createIndexes();
            isConnected = true;
            console.log("Successfully connected to MongoDB");
        }
        return db;
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}

async function createIndexes() {
    const users = db.collection('users');
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ createdAt: 1 });
    
    const otps = db.collection('otps');
    await otps.createIndex({ email: 1 });
    await otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

function getDb() {
    if (!isConnected) {
        throw new Error("Database not connected. Call connect() first.");
    }
    return db;
}

module.exports = { connect, getDb };