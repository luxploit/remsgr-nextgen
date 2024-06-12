class MimeParser {
    constructor(mimeMessage) {
        this.rawMessage = mimeMessage;
        this.headers = {};
        this.content = '';
        this.parse();
    }

    parse() {
        // Split headers and content based on the first occurrence of \r\n\r\n
        const splitIndex = this.rawMessage.indexOf('\r\n\r\n');
        
        if (splitIndex === -1) {
            // If no \r\n\r\n is found, treat the entire message as headers
            this.parseHeaders(this.rawMessage);
            this.content = '';
        } else {
            // Extract and parse headers
            const rawHeaders = this.rawMessage.substring(0, splitIndex);
            this.parseHeaders(rawHeaders);

            // Extract content, if any, trimming to remove leading/trailing whitespace
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