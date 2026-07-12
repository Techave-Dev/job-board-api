-- @param {BigInt} $1:jobId
-- @param {BigInt} $2:userId
-- @param {String} $3:resumeUrl
INSERT INTO applications (job_id, user_id, resume_url)
VALUES ($1, $2, $3)
RETURNING
  id,
  job_id AS "jobId",
  user_id AS "userId",
  status,
  resume_url AS "resumeUrl",
  created_at AS "createdAt",
  updated_at AS "updatedAt";
