-- @param {BigInt} $1:id
-- @param {String} $2:name
-- @param {String} $3:email
-- @param {String} $4:role
UPDATE users 
SET
  name = COALESCE($2, name),
  email = COALESCE($3, email),
  role = COALESCE($4::"Role", role),
  updated_at = NOW()
WHERE id = $1
RETURNING 
  id,
  email,
  name,
  role,
  created_at AS "createdAt",
  updated_at AS "updatedAt";