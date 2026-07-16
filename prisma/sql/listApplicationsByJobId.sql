-- @param {BigInt} $1:jobId
-- @param {String} $2:status
-- @param {Int} $3:limit
-- @param {Int} $4:offset
SELECT
  a.id,
  a.user_id AS "userId",
  a.status,
  a.resume_url AS "resumeUrl",
  a.created_at AS "createdAt",
  a.updated_at AS "updatedAt",
  u.name AS "userName",
  u.email AS "userEmail"
FROM applications a
JOIN users u ON u.id = a.user_id
WHERE a.job_id = $1
  AND ($2::varchar IS NULL OR a.status::text = $2)
ORDER BY a.created_at DESC
LIMIT $3 OFFSET $4;
