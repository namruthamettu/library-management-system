const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI =
            process.env.MONGO_URI ||
            'mongodb://127.0.0.1:27017/library_management';

        const conn = await mongoose.connect(mongoURI, {
            autoIndex: true,
            serverSelectionTimeoutMS: 5000
        });

        console.log(
            `[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`
        );

        return conn;

    } catch (error) {
        console.error('[MongoDB Connection Failed]');
        console.error(error.message);

        throw error;
    }
};

module.exports = connectDB;
