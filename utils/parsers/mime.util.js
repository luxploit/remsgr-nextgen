class MimeParser {
    constructor(mimeMessage) {
        this.rawMessage = mimeMessage;
        this.headers = {};
        this.content = '';
        this.parse();
    }

    parse() {
        const splitIndex = this.rawMessage.indexOf('\r\n\r\n');
        
        if (splitIndex === -1) {
            this.parseHeaders(this.rawMessage);
            this.content = '';
        } else {
            const rawHeaders = this.rawMessage.substring(0, splitIndex);
            this.parseHeaders(rawHeaders);

            this.content = this.rawMessage.substring(splitIndex + 4).trim();
        }
    }

    parseHeaders(rawHeaders) {
        rawHeaders.split('\r\n').forEach(line => {
            const [name, ...value] = line.split(':');
            if (name && value) {
                this.headers[name.trim()] = value.join(':').trim();
            }
        });
    }

    getHeader(headerName) {
        return this.headers[headerName] || null;
    }

    getAllHeaders() {
        return this.headers;
    }

    getContent() {
        return this.content;
    }
}

module.exports = MimeParser;