const sockets = [];
const switchboard_sockets = [];

const getSocketByPassport = (passport) => {
    return sockets.find(s => s.passport === passport);
}

const getMultipleSocketsByPassport = (passport) => {
    return sockets.filter(s => s.passport === passport);
}

const getSocketByToken = (token) => {
    return sockets.find(s => s.token === token);
}

const getSocketBySwitchboardToken = (sb_token) => {
    return sockets.find(s => s.sb_token === sb_token);
}

const getSwitchboardSocketByPassport = (passport) => {
    return switchboard_sockets.find(s => s.passport === passport);
}

module.exports = { sockets, switchboard_sockets, getSocketByPassport, getMultipleSocketsByPassport, getSocketByToken, getSocketBySwitchboardToken, getSwitchboardSocketByPassport };