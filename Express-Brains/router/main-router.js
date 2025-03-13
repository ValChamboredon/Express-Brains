const express = require('express');
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const Team = require('../models/Team');
const User = require('../models/User');


const router = express.Router();

// Middleware pour vérifier si l'utilisateur est un administrateur
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Accès refusé');
    }
}

router.get("/", (req, res) => {
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

router.post("/guess", async (req, res) => {
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
        // Mettre à jour le champ attempts de l'utilisateur connecté
        if (req.session.user) {
            try {
                const user = await User.findById(req.session.user._id);
                user.attempts += req.session.attempts;
                await user.save();
                console.log(`Mise à jour réussie pour l'utilisateur ${req.session.user.email} avec ${req.session.attempts} coups joués.`);
            } catch (err) {
                console.error(`Erreur lors de la mise à jour des coups joués pour l'utilisateur ${req.session.user.email}: ${err.message}`);
            }
        }

        res.render("index", {
            message: `Bravo ! Tu as trouvé le bon nombre en ${req.session.attempts} essais !`,
            win: true,
            attempts: req.session.attempts,
            secretNumber: req.session.secretNumber
        });

        // Réinitialiser le champ attempts dans la session
        req.session.attempts = 0;
    }
});

router.post("/reset", (req, res) => {
    req.session.secretNumber = Math.floor(Math.random() * 100) + 1;
    req.session.attempts = 0;

    res.redirect("/");
});

router.get("/login", (req, res) => {
    res.render("login", { errors: [] });
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.render("login", { errors: [{ msg: "L'email ou le mot de passe est incorrect." }] });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render("login", { errors: [{ msg: "L'email ou le mot de passe est incorrect." }] });
        }
        req.session.user = user;
        res.redirect("/");
    } catch (err) {
        res.render("login", { errors: [{ msg: "Une erreur est survenue lors de la connexion." }] });
    }
});

router.get("/inscription", (req, res) => {
    res.render("inscription", { errors: [] });
});

router.post(
    "/inscription",
    [
        body("email")
            .trim()
            .isEmail().withMessage("L'email n'est pas valide."),

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
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("inscription", { 
                errors: errors.array(),
                email: req.body.email, 
                username: req.body.username 
            });
        }

        const { email, username, password } = req.body;

        try {
            // Vérification unicité email
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.render("inscription", { 
                    errors: [{ msg: "Cet email est déjà utilisé." }],
                    email, 
                    username 
                });
            }

            // Vérification unicité username
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                return res.render("inscription", { 
                    errors: [{ msg: "Ce pseudo est déjà utilisé." }],
                    email, 
                    username 
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                email,
                username,
                password: hashedPassword 
            });

            await newUser.save();

            res.redirect("/login");
        } catch (err) {
            res.render("inscription", { 
                errors: [{ msg: "Une erreur est survenue lors de la création de votre compte." }],
                email, 
                username 
            });
        }
    }
);

router.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect("/");
        }
        res.clearCookie("connect.sid");
        res.redirect("/login");
    });
});

// Admin
router.get('/admin', isAdmin, (req, res) => {
    res.redirect('/admin/users');
});

router.get('/admin/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find();
        res.render('users', { users });
    } catch (err) {
        res.status(500).send('Erreur serveur');
    }
});

// Classement
router.get('/classement', async (req, res) => {
    try {
        const users = await User.find().sort({ attempts: 1 }); // Trier par nombre de coups joués
        res.render('classement', { users });
    } catch (err) {
        res.status(500).send('Erreur serveur');
    }
});


// Liste des équipes
router.get('/teams', async (req, res) => {
    try {
        const teams = await Team.find().populate('members');
        res.render('teams', { teams });
    } catch (err) {
        res.status(500).send('Erreur serveur');
    }
});

// Créer une équipe
router.post('/teams', async (req, res) => {
    try {
        const { name } = req.body;
        const team = new Team({ name });
        await team.save();
        res.redirect('/teams');
    } catch (err) {
        res.status(500).send('Erreur serveur');
    }
});

// Rejoindre une équipe
router.post('/teams/join', async (req, res) => {
    try {
        const { teamId } = req.body;
        const userId = req.session.user._id;

        // Mettre à jour l'équipe
        await Team.findByIdAndUpdate(teamId, {
            $addToSet: { members: userId }
        });

        // Mettre à jour l'utilisateur
        await User.findByIdAndUpdate(userId, { team: teamId });

        res.redirect('/teams');
    } catch (err) {
        res.status(500).send('Erreur serveur');
    }
});

// Quitter une équipe
router.post('/teams/leave', async (req, res) => {
    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId);

        if (user.team) {
            // Retirer l'utilisateur de l'équipe
            await Team.findByIdAndUpdate(user.team, {
                $pull: { members: userId }
            });

            // Retirer l'équipe de l'utilisateur
            user.team = undefined;
            await user.save();
        }

        res.redirect('/teams');
    } catch (err) {
        res.status(500).send('Erreur serveur');
    }
});

module.exports = router;