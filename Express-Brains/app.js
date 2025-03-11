"use strict";

const express = require("express");
const session = require("express-session");
const app = express();
const port = 3000;


app.use(session({
    secret: '!changeme!', 
    saveUninitialized: true, 
    resave: true 
}));


app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    if (!req.session.secretNumber) {
        req.session.secretNumber = Math.floor(Math.random() * 100) + 1;
        req.session.attempts = 0; 
    }

    res.render("index", { 
        message: "Quel nombre se cache derrière cette carte mystère ?", 
        win: false, 
        attempts: req.session.attempts, 
        secretNumber: req.session.secretNumber 
    });
});



app.post("/guess", (req, res) => {
    let guess = Number(req.body.number);
    req.session.attempts++; 

    if (isNaN(guess)) {
        return res.render("index", { 
            message: "Erreur ! Veuillez saisir un nombre valide !", 
            win: false, 
            attempts: req.session.attempts,
            secretNumber: req.session.secretNumber
        });
    }

    if (guess < 0 || guess > 100) {
        return res.render("index", { 
            message: "Erreur ! Veuillez saisir un nombre entre 0 et 100 !", 
            win: false, 
            attempts: req.session.attempts,
            secretNumber: req.session.secretNumber
        });
    }

    if (guess < req.session.secretNumber) {
        res.render("index", { 
            message: "Trop petit !", 
            win: false, 
            attempts: req.session.attempts,
            secretNumber: req.session.secretNumber
        });
    } else if (guess > req.session.secretNumber) {
        res.render("index", { 
            message: "Trop grand !", 
            win: false, 
            attempts: req.session.attempts,
            secretNumber: req.session.secretNumber
        });
    } else {
        res.render("index", { 
            message: `Bravo ! Tu as trouvé le bon nombre en ${req.session.attempts} essais `, 
            win: true,
            attempts: req.session.attempts,
            secretNumber: req.session.secretNumber
        });
    }
});


app.post("/reset", (req, res) => {
    req.session.secretNumber = Math.floor(Math.random() * 100) + 1;
    req.session.attempts = 0; 
    res.redirect("/");
});


app.listen(port, () => {
    console.log(`Mon serveur Express tourne sur le port ${port}`);
});

