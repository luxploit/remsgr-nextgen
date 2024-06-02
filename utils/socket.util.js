const sockets = [];

const getSocketByPassport = (passport) => {
    return sockets.find(s => s.passport === passport);
}

const getMultipleSocketsByPassport = (passport) => {
    return sockets.filter(s => s.passport === passport);
}

const getSocketByToken = (token) => {
    return sockets.find(s => s.token === token);
}

module.exports = { sockets, getSocketByPassport, getMultipleSocketsByPassport, getSocketByToken };