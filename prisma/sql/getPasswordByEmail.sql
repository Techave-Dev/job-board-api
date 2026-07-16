-- @param {String} $1:email
SELECT id, password AS "passwordHash"
FROM users
WHERE email = $1;