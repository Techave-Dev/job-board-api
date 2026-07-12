-- @param {BigInt} $1:userId
SELECT
  id,
  user_id AS "userId",
  name,
  description,
  logo_url AS "logoUrl",
  website,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
FROM companies
WHERE user_id = $1
LIMIT 1;