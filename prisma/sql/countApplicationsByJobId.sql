-- @param {BigInt} $1:jobId
-- @param {String} $2:status
SELECT COUNT(*)::int AS total
FROM applications a
WHERE a.job_id = $1
  AND ($2::varchar IS NULL OR a.status::text = $2);
