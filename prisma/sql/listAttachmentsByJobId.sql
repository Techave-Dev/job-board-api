-- @param {BigInt} $1:jobId
SELECT
  id,
  job_id AS "jobId",
  filename,
  original_name AS "originalName",
  mime_type AS "mimeType",
  size
FROM attachments
WHERE job_id = $1
ORDER BY created_at DESC;