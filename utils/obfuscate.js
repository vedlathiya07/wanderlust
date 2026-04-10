const encodeId = (id) => {
    if (!id) return "";
    const idStr = typeof id === 'object' ? id.toString() : String(id);
    return Buffer.from(idStr, 'utf8').toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const decodeId = (encoded) => {
    if (!encoded) return "";
    // If it's already a 24-char hex string, it's likely a raw ID (e.g. from internal redirects)
    if (encoded.length === 24 && /^[0-9a-fA-F]+$/.test(encoded)) {
        return encoded;
    }
    // Add padding back
    let str = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4 !== 0) {
        str += '=';
    }
    try {
        const decoded = Buffer.from(str, 'base64').toString('utf8');
        return decoded;
    } catch (e) {
        return encoded; // Fallback
    }
};

module.exports = { encodeId, decodeId };
