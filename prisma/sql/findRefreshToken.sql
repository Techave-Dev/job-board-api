-- @param {String} $1:tokenHash
SELECT
  id,
  token_hash AS "tokenHash",
  user_id AS "userId",
  expires_at AS "expiresAt",
  revoked,
  created_at AS "createdAt" 
FROM refresh_tokens 
WHERE token_hash = $1 AND revoked = false
LIMIT 1;