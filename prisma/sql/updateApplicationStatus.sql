-- @param {BigInt} $1:id
-- @param {String} $2:status
UPDATE applications
SET
  status = $2::"ApplicationStatus",
  updated_at = NOW()
WHERE id = $1
RETURNING
  id,
  job_id AS "jobId",
  user_id AS "userId",
  status,
  resume_url AS "resumeUrl",
  created_at AS "createdAt",
  updated_at AS "updatedAt";
