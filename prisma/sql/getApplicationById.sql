-- @param {BigInt} $1:id
SELECT
  id,
  job_id AS "jobId",
  user_id AS "userId",
  status,
  resume_url AS "resumeUrl",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
FROM applications
WHERE id = $1
LIMIT 1;