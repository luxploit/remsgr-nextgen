const chalk = require('chalk');
const connection = require('../../db/connect').promise();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../../config.json');

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

        console.log(passport, password)
        
        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [passport]);

        if (rows.length === 0) {
            console.log(`${chalk.yellow.bold('[USR MD5 INITIAL]')} ${passport} does not exist in the database.`);
            res.set({
                'Content-Type': 'text/plain',
                'WWW-Authenticate': 'Passport1.4 da-status=failed'
            });
            res.status(401).send('Unauthorized');
            return;
        }

        const user = rows[0];

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

        const token = jwt.sign({ id: user.id, uuid: user.uuid, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

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