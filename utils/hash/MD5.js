const crypto = require('crypto');

class MD5PasswordHasher {
    static algorithm = 'md5';
    static separator = '$';

    static encode(password, salt) {
        const md5 = crypto.createHash('md5');
        md5.update(salt + password);
        const hash = md5.digest('hex'); // Use 'hex' to match the provided hash
        return [this.algorithm, salt, hash].join(this.separator);
    }

    static verify(password, encoded) {
        const parts = encoded.split(this.separator);
        if (parts.length !== 3) {
            throw new Error('Invalid encoded format');
        }
        const [algorithm, salt, hash] = parts;

        if (algorithm !== this.algorithm) {
            throw new Error('Unsupported algorithm');
        }

        const encoded2 = this.encode(password, salt);

        return encoded === encoded2;
    }
}

module.exports = MD5PasswordHasher;