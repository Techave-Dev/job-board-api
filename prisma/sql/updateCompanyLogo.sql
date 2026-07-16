-- @param {BigInt} $1:id
-- @param {String} $2:logoUrl
UPDATE companies
SET logo_url = $2, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING
  id,
  user_id AS "userId",
  name,
  description,
  logo_url AS "logoUrl",
  website,
  created_at AS "createdAt",
  updated_at AS "updatedAt";