-- @param {BigInt} $1:jobId
-- @param {String} $2:filename
-- @param {String} $3:originalName
-- @param {String} $4:mimeType
-- @param {Int} $5:size
INSERT INTO attachments (job_id, filename, original_name, mime_type, size)
VALUES ($1, $2, $3, $4, $5)
RETURNING
  id,
  job_id AS "jobId",
  filename,
  original_name AS "originalName",
  mime_type AS "mimeType",
  size,
  created_at AS "createdAt";
