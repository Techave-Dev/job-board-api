-- @param {BigInt} $1:id
-- @param {String} $2:name
-- @param {String} $3:description
-- @param {String} $4:website
UPDATE companies
SET
  name = COALESCE($2, name),
  description = COALESCE($3, description),
  website = COALESCE($4, website),
  updated_at = NOW()
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