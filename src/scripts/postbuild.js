const fs = require('fs')

fs.cpSync('./src/www/public', './server/public', { recursive: true })
fs.cpSync('./src/www/templates', './server/templates', { recursive: true })

fs.cpSync('./.env.example', './server/.env')
fs.cpSync('./config.json', './server/config.json')
fs.cpSync('./package.json', './server/package.json')
