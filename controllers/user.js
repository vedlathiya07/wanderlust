const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const { encodeId } = require("../utils/obfuscate.js");

module.exports.renderSignup = (req, res) => {
    res.render("users/signup.ejs", { title: "Sign Up" });
};

module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            req.flash("error", "An account with this email address already exists. Please try logging in.");
            return res.redirect("/signup");
        }
        const newUser = new User({ username, email });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to Wanderlust! Your adventure starts here.");
            return res.redirect("/listings");
        });
    } catch (e) {
        req.flash("error", e.name === 'UserExistsError' ? "This username is already taken. Please choose another one." : e.message);
        return res.redirect("/signup");
    }
};

module.exports.renderLogin = (req, res) => {
    res.render("users/login.ejs", { title: "Log In" });
};

module.exports.login = async (req, res) => {
    res.redirect(res.locals.saveRedirectUrl || "/listings");
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) next(err);
        res.redirect("/listings");
    });
};

module.exports.renderProfile = async (req, res) => {
    const myListings = await Listing.find({ owner: req.user._id });
    const user = await User.findById(req.user._id).populate("wishlist");
    res.render("users/profile.ejs", { myListings, wishlist: user.wishlist || [], title: "My Profile" });
};

module.exports.renderEditProfile = (req, res) => {
    res.render("users/editProfile.ejs", { title: "Edit Profile" });
};

module.exports.toggleWishlist = async (req, res) => {
    let { listingId } = req.params;
    let user = await User.findById(req.user._id);
    let index = user.wishlist.indexOf(listingId);
    if (index === -1) {
        user.wishlist.push(listingId);
    } else {
        user.wishlist.splice(index, 1);
    }
    await user.save();
    res.json({ success: true, isWishlisted: index === -1 });
};

module.exports.updateProfile = async (req, res) => {
    const { username, email } = req.body;
    const user = await User.findById(req.user._id);
    user.username = username;
    user.email = email;
    if (req.file) user.image = { url: req.file.path, filename: req.file.filename };
    await user.save();
    req.flash("success", "Your profile has been updated successfully.");
    res.redirect("/profile");
};

module.exports.renderForgotPass = (req, res) => {
    res.render("users/forgotPassword.ejs", { title: "Reset Password" });
};

module.exports.forgotPass = async (req, res) => {
    res.redirect("/login");
};

module.exports.renderMyBookings = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ createdAt: -1 });
    res.render("users/bookings.ejs", { bookings, title: "My Bookings" });
};