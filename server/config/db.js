import mongoose from 'mongoose';

export let isDbConnected = false;

const connectDB = async () => {
    // Check if we are in explicit JSON mode to avoid connection errors
    if (process.env.DB_MODE === 'JSON') {
        isDbConnected = false;
        console.log('📦 DB MODE: JSON (Local Persistence)');
        console.log('🚀 System: Local data storage via data/store.json is ACTIVE.');
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000 // Shorten timeout to trigger mock mode faster
        });
        isDbConnected = true;
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        isDbConnected = false;
        console.log('⚠️ MongoDB Connection Error:', error.message);
        console.log('🚀 Hybrid System: MOCK MODE ACTIVATED. App is fully functional via In-Memory Storage.');
    }
};

export default connectDB;
