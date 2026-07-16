-- @param {BigInt} $1:userId
-- @param {String} $2:name
-- @param {String} $3:description
-- @param {String} $4:website
INSERT INTO companies (user_id, name, description, website)
VALUES ($1, $2, $3, $4)
RETURNING
  id,
  user_id AS "userId",
  name,
  description,
  logo_url AS "logoUrl",
  website,
  created_at AS "createdAt",
  updated_at AS "updatedAt";