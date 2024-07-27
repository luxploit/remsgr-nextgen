const chalk = require('chalk');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../../config.json');
const { v4: uuidv4 } = require('uuid');

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

            if (email[1] !== 'xirk.org' && email[1] !== 'hotmail.com') {
                console.log(`${chalk.yellow.bold('[USR MD5 INITIAL]')} ${passport} has an invalid email domain.`);
                socket.write(`911 ${transactionID}\r\n`);
                socket.destroy();
                return;
            }

            const user = await User.findOne({ username: email[0] });

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
                'Authentication-Info': `Passport 1.4 da-status=success,from-PP='${token}'`,
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
        const { displayname, username, email, password } = req.body;

        if (!username || !email || !password) {
            res.status(400).send('Bad Request');
            return;
        }

        const friendly_name = displayname || username + "@xirk.org";

        const user = await User.findOne({ email }).exec();

        if (user) {
            res.status(409).send('Conflict');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            uuid: uuidv4(),
            friendly_name,
            username,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(201).send('Created');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
