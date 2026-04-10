const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const { decodeId } = require("../utils/obfuscate.js");

// Decode obfuscated ID for this router
router.param('id', (req, res, next, id) => {
    try { req.params.id = decodeId(id); } catch(e) {}
    next();
});

// IMPORTANT: Static/named routes must come BEFORE dynamic /:id routes
router.route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn, upload.array("listing[images]", 10), validateListing, wrapAsync(listingController.createListing));

// Named static routes — registered before /:id to prevent string→ObjectId cast errors
router.get("/new", isLoggedIn, listingController.renderNewForm);
router.get("/explore", wrapAsync(listingController.mapExplore));

// Dynamic /:id routes
router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(isLoggedIn, isOwner, upload.array("listing[images]", 10), validateListing, wrapAsync(listingController.updateListing))
    .delete(isOwner, wrapAsync(listingController.destroyListing));

// Edit route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;