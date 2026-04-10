const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing');
const path = require("path");
require('dotenv').config({ path: path.join(__dirname, "../.env") });

const mongoURL = process.env.ATLASDB_URL;

main().then(() => {
    console.log("Connected to MongoDB Atlas");
}).catch(err => {
    console.error("MongoDB connection error:", err);
});

async function main() {
    if (!mongoURL) {
        throw new Error("ATLASDB_URL is not defined in .env file");
    }
    await mongoose.connect(mongoURL);
};

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({ ...obj, owner: "693aca52fdd9e4d0ff76dc23" }));
    await Listing.insertMany(initData.data);
    console.log("Database initialized with sample data");
};

initDB();
