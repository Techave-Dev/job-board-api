-- @param {BigInt} $1:userId
-- @param {String} $2:status
-- @param {Int} $3:limit
-- @param {Int} $4:offset
SELECT
  a.id,
  a.job_id AS "jobId",
  a.status,
  a.resume_url AS "resumeUrl",
  a.created_at AS "createdAt",
  a.updated_at AS "updatedAt",
  j.title AS "jobTitle",
  c.id AS "companyId",
  c.name AS "companyName"
FROM applications a
JOIN jobs j ON j.id = a.job_id
JOIN companies c ON c.id = j.company_id
WHERE a.user_id = $1
  AND ($2::varchar IS NULL OR a.status::text = $2)
ORDER BY a.created_at DESC
LIMIT $3 OFFSET $4;
