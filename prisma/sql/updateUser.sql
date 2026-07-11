-- @param {BigInt} $1:id
-- @param {String} $2:name
-- @param {String} $3:email
UPDATE users 
SET
  name = COALESCE($2, name),
  email = COALESCE($3, email),
  updated_at = NOW()
WHERE id = $1
RETURNING 
  id,
  email,
  name,
  role,
  created_at AS "createdAt",
  updated_at AS "updatedAt";