-- @param {BigInt} $1:jobId
SELECT
  j.id AS "jobId",
  j.company_id AS "companyId",
  c.user_id AS "companyOwnerUserId"
FROM jobs j
JOIN companies c ON c.id = j.company_id
WHERE j.id = $1
LIMIT 1;