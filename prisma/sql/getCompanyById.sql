-- @param {BigInt} $1:id
SELECT
  c.id,
  c.user_id AS "userId",
  c.name,
  c.description,
  c.logo_url AS "logoUrl",
  c.website,
  c.created_at AS "createdAt",
  c.updated_at AS "updatedAt",
  (SELECT COUNT(*)::int FROM jobs j WHERE j.company_id = c.id) AS "jobCount"
FROM companies c
WHERE c.id = $1
LIMIT 1;