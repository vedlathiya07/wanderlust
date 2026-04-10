const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");

const userController = require("../controllers/user.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router.route("/signup")
    .get(userController.renderSignup)
    .post(wrapAsync(userController.signup));

router.route("/login")
    .get(userController.renderLogin)
    .post(saveRedirectUrl, passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), userController.login);

router.get("/logout", userController.logout);

router.get("/forgot-password", userController.renderForgotPass);
router.post("/forgot-password", wrapAsync(userController.forgotPass));

router.get("/profile", isLoggedIn, wrapAsync(userController.renderProfile));
router.get("/profile/edit", isLoggedIn, userController.renderEditProfile);
router.post("/profile", isLoggedIn, upload.single("user[image]"), wrapAsync(userController.updateProfile));

router.get("/my-bookings", isLoggedIn, wrapAsync(userController.renderMyBookings));

router.post("/wishlist/:listingId", isLoggedIn, wrapAsync(userController.toggleWishlist));

module.exports = router;