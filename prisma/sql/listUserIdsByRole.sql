-- @param {String} $1:role
SELECT id
FROM users
WHERE role::text = $1;