const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing');

const mongoURL = "mongodb://127.0.0.1:27017/wanderlust";

main().then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("MongoDB connection error:", err);
});

async function main() {
    await mongoose.connect(mongoURL);
};

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({ ...obj, owner: "693aca52fdd9e4d0ff76dc23" }));
    await Listing.insertMany(initData.data);
    console.log("Database initialized with sample data");
};

initDB();
