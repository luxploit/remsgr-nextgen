const chalk = require('chalk');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../../config.json');
const { v4: uuidv4 } = require('uuid');
const MD5PasswordHasher = require('../../utils/hash/MD5');

const User = require('../../models/User');

exports.pprdr = async (req, res) => {
    res.set({
        'Passporturls': `DALogin=${config.server.host}tweener/auth`,
        'Server': 'Charli XBOX'
    });
    res.status(200).send('OK');
}

exports.twnAuth = async (req, res) => {
    const header = req.get('Authorization');
    if (header) {
        const signInMatch = header.match(/sign-in=([^,]+)/);
        const pwdMatch = header.match(/pwd=([^,]+)/);

        if (signInMatch && pwdMatch) {
            const passport = signInMatch[1];
            const password = pwdMatch[1];

            const email = passport.split('@');
            const urlEmail = email[0].split('%40');

            if (email[1] !== 'remsgr.net' && email[1] !== 'hotmail.com' && urlEmail[1] !== 'remsgr%2Eorg') {
                console.log(`${chalk.yellow.bold('[USR MD5 INITIAL]')} ${passport} has an invalid email domain.`);
                res.set({
                    'Content-Type': 'text/plain',
                    'WWW-Authenticate': 'Passport1.4 da-status=failed'
                });
                res.status(401).send('Unauthorized');
                return;
            }

            const urlUser = await User.findOne({ username: urlEmail[0] });
            let user = await User.findOne({ username: email[0] });

            if (!urlUser) {
                console.log(`${chalk.yellow.bold('[USR MD5 INITIAL]')} ${passport} does not exist in the database (URL).`);
                res.set({
                    'Content-Type': 'text/plain',
                    'WWW-Authenticate': 'Passport1.4 da-status=failed'
                });
                res.status(401).send('Unauthorized');
                return;
            }

            if (urlUser) {
                user = urlUser;
            }

            if (!user) {
                console.log(`${chalk.yellow.bold('[USR MD5 INITIAL]')} ${passport} does not exist in the database.`);
                res.set({
                    'Content-Type': 'text/plain',
                    'WWW-Authenticate': 'Passport1.4 da-status=failed'
                });
                res.status(401).send('Unauthorized');
                return;
            }

            const valid = await bcrypt.compare(password, user.password);

            if (!valid) {
                console.log(`${chalk.yellow.bold('[USR MD5 SUBSEQUENT]')} ${passport} has entered an incorrect password.`);
                res.set({
                    'Content-Type': 'text/plain',
                    'WWW-Authenticate': 'Passport1.4 da-status=failed'
                });
                res.status(401).send('Unauthorized');
                return;
            }

            const token = jwt.sign({ id: user._id, uuid: user.uuid }, process.env.JWT_SECRET, { expiresIn: '1d' });

            res.set({
                'Content-Type': 'text/plain',
                'Authentication-Info': `Passport 1.4 da-status=success,from-PP='t=${token}'`,
            });

            res.status(200).send('OK');
        } else {
            res.set({
                'Content-Type': 'text/plain',
                'WWW-Authenticate': 'Passport1.4 da-status=failed'
            });
            res.send('sign-in and pwd not found in the header');
        }
    } else {
        res.set({
            'Content-Type': 'text/plain',
            'WWW-Authenticate': 'Passport1.4 da-status=failed'
        });
        res.send('Authentication header not found');
    }
}

exports.createAccount = async (req, res) => {
    try {
        const { displayname, username, email, password, legacypassword } = req.body;

        if (!username || !email || !password) {
            res.status(400).send('Bad Request');
            return;
        }

        const displaynameEncoded = encodeURIComponent(displayname);
        const friendly_name = displaynameEncoded || username + "@remsgr.net";

        const user = await User.findOne({ $or: [{ username }, { email }] });

        if (user) {
            res.status(409).send('Conflict');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const salt = Math.random().toString(36).substring(2, 17);
        const hashedLegacyPassword = MD5PasswordHasher.encode(legacypassword, salt);

        const newUser = new User({
            uuid: uuidv4(),
            friendly_name,
            username,
            email,
            password: hashedPassword,
            legacy_pass: hashedLegacyPassword || null
        });

        await newUser.save();

        res.status(201).send('Created');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

exports.createAccountPage = async (req, res) => {
    res.send(`
        <html>
            <head>
                <title>remsgr - Create Account</title>
            </head>
            <body>
                <h1>Create Account</h1>
                <form action="/create" method="POST">
                    <label for="displayname">Display Name:</label><br>
                    <input type="text" id="displayname" name="displayname"><br>
                    <label for="username">Username:</label><br>
                    <input type="text" id="username" name="username"><br>
                    <label for="email">Email:</label><br>
                    <input type="text" id="email" name="email"><br>
                    <label for="password">Password:</label><br>
                    <input type="password" id="password" name="password"><br>
                    <label for="legacypassword">Legacy Password:</label><br>
                    <input type="password" id="legacypassword" name="legacypassword"><br>
                    <input type="submit" value="Submit">
                </form>
            </body>
        </html>
    `);
}