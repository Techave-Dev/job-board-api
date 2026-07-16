-- @param {String} $1:tokenHash
UPDATE refresh_tokens 
SET revoked = true 
WHERE token_hash = $1 and revoked = false;