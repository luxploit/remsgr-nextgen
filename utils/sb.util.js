const switchboard_chats = [];

const checkIfChatExists = (chatID) => {
    return switchboard_chats.find(c => c.chatID === chatID);
}

const checkPending = (chatID, passport) => {
    const chat = switchboard_chats.find(c => c.chatID === chatID);
    if (!chat) return false;
    return chat.pending.includes(passport);
}

const acceptCall = (chatID, passport) => {
    const chat = switchboard_chats.find(c => c.chatID === chatID);
    if (!chat) return;
    chat.pending = chat.pending.filter(p => p !== passport);
    chat.participants.push(passport);
}

const getAllParticipants = (chatID, passport) => {
    const chat = switchboard_chats.find(c => c.chatID === chatID);
    if (!chat) return [];
    return chat.participants.filter(p => p !== passport);
}

module.exports = { switchboard_chats, checkPending, acceptCall, checkIfChatExists, getAllParticipants };