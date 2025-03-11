"use strict";

const express = require("express");
const session = require("express-session");
const { body, validationResult } = require("express-validator"); 

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
            message: `Bravo ! Tu as trouvé le bon nombre en ${req.session.attempts} essais !`, 
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


app.get("/login", (req, res) => {
    res.render("login");
});


app.get("/inscription", (req, res) => {
    res.render("inscription", { errors: [] }); 
});



app.post(
    "/inscription",
    [
        body("email")
            .trim()
            .isEmail().withMessage("L'email n'est pas valide.")
            .normalizeEmail(), 

        body("username")
            .trim()
            .isLength({ min: 3 }).withMessage("Le pseudo doit contenir au moins 3 caractères."),

        body("password")
            .isLength({ min: 6 }).withMessage("Le mot de passe doit contenir au moins 6 caractères."),

        body("confirmPassword")
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error("Les mots de passe ne correspondent pas !");
                }
                return true;
            })
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("inscription", { errors: errors.array() });
        }

        console.log(`Nouvel utilisateur : ${req.body.username}, 
            Email : ${req.body.email}, password : ${req.body.password}`);

        res.redirect("/login");
    }
);


app.listen(port, () => {
    console.log(` Serveur Express en écoute sur http://localhost:${port}`);
    
});



//création de page de connexion
//creation page inscription
//email pseudo mots confirmation
//séparer footer-header dans un autre fichier