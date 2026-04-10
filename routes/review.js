const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { validateReview, isLoggedIn, isReviewAuthor } = require("../middleware.js");
const reviewController = require("../controllers/review.js");
const { decodeId } = require("../utils/obfuscate.js");

// Decode obfuscated IDs for this router
router.param('id', (req, res, next, id) => {
    try { req.params.id = decodeId(id); } catch(e) {}
    next();
});

router.param('reviewId', (req, res, next, reviewId) => {
    try { req.params.reviewId = decodeId(reviewId); } catch(e) {}
    next();
});


// Post review route
router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

// Delete review route
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviewController.destroyReview));

module.exports = router;