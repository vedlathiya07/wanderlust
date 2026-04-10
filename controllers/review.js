const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const { encodeId } = require("../utils/obfuscate.js");

module.exports.createReview = async (req, res) => {
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    await newReview.save();
    
    await Listing.findByIdAndUpdate(req.params.id, {
        $push: { reviews: newReview._id }
    });

    const listing = await Listing.findById(req.params.id).populate("reviews");
    if (listing.reviews.length > 0) {
        let sum = 0;
        for (let rev of listing.reviews) sum += rev.rating;
        listing.avgRating = (sum / listing.reviews.length).toFixed(1);
    } else {
        listing.avgRating = 0;
    }
    await listing.save();

    const flashMsg = "Thank you for sharing your experience! Your review has been added.";
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ 
            success: true, 
            message: flashMsg, 
            review: {
                ...newReview._doc,
                author: { username: req.user.username }
            },
            avgRating: listing.avgRating
        });
    }

    req.flash("success", flashMsg);
    res.redirect(`/listings/${encodeId(req.params.id)}`);
};

module.exports.destroyReview = async (req, res) => {
    const { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);

    const listing = await Listing.findById(id).populate("reviews");
    if (listing.reviews.length > 0) {
        let sum = 0;
        for (let rev of listing.reviews) sum += rev.rating;
        listing.avgRating = (sum / listing.reviews.length).toFixed(1);
    } else {
        listing.avgRating = 0;
    }
    await listing.save();

    const flashMsg = "Your review has been successfully removed.";
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ 
            success: true, 
            message: flashMsg, 
            avgRating: listing.avgRating 
        });
    }

    req.flash("success", flashMsg);
    res.redirect(`/listings/${encodeId(id)}`);
};