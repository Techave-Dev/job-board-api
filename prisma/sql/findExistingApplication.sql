-- @param {BigInt} $1:jobId
-- @param {BigInt} $2:userId
SELECT id
FROM applications
WHERE job_id = $1 AND user_id = $2
LIMIT 1;
