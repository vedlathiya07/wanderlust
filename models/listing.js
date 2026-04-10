const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review.js');
const { types } = require('joi');

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    images: [{
        url: String,
        filename: String
    }],
    image: {
        url: String,
        filename: String
    },
    price: Number,
    location: String,
    country: String,
    avgRating: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        enum: ['Curated', 'Coastal', 'Mountain', 'Urban', 'Nature', 'Winter', 'Wellness'],
        default: 'Curated'
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review"
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    bookings: [{
        type: Schema.Types.ObjectId,
        ref: "Booking"
    }],
    geometry: {
        type: {
            type: String,
            default: "Point"
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    }
});

listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } })
    }
});

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;