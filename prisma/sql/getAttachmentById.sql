-- @param {BigInt} $1:id
SELECT
  a.id,
  a.job_id AS "jobId",
  a.filename,
  a.original_name AS "originalName",
  a.mime_type AS "mimeType",
  a.size,
  a.created_at AS "createdAt",
  j.company_id AS "companyId"
FROM attachments a
JOIN jobs j ON j.id = a.job_id
WHERE a.id = $1
LIMIT 1;
