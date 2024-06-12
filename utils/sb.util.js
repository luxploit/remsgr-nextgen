const { Socket } = require("net");

const switchboard_chats = [];

const checkIfChatExists = (chatID) => {
    return switchboard_chats.find(c => c.chatID === chatID);
}

const checkPending = (chatID, passport) => {
    const chat = switchboard_chats.find(c => c.chatID === chatID);
    if (!chat) return false;
    return chat.pending.includes(passport);
}

const acceptCall = (chatID, passport, socket) => {
    const chat = switchboard_chats.find(c => c.chatID === chatID);
    if (!chat) return;
    chat.pending = chat.pending.filter(p => p !== passport);
    chat.participants.push({ email: passport, socket });
}

const getAllParticipants = (chatID, passport) => {
    const chat = switchboard_chats.find(c => c.chatID === chatID);
    if (!chat) return;
    return chat.participants.filter(p => p.email !== passport);
}

const getAllParticipantsSockets = (chatID, passport) => {
    const chat = switchboard_chats.find(c => c.chatID === chatID);
    if (!chat) return;
    return chat.participants.filter(p => p.email !== passport).map(p => p.socket);
}

module.exports = { switchboard_chats, checkPending, acceptCall, checkIfChatExists, getAllParticipants, getAllParticipantsSockets };