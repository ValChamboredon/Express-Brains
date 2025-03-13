"use strict";

const express = require("express");
const session = require("express-session");
const mongoose = require('mongoose');
const router = require('./router/main-router');

const app = express();
const port = 3000;

app.use(session({
    secret: '!changeme!',
    saveUninitialized: true,
    resave: true
}));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

// Connexion avec Mongoose
mongoose.connect('mongodb://127.0.0.1:27017/express_brains', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
});

// Middleware pour ajouter l'utilisateur à res.locals
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// Utiliser le routeur
app.use('/', router);

app.listen(port, () => {
    console.log(`Serveur Express en écoute sur http://localhost:${port}`);
});
