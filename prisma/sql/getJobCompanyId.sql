-- @param {BigInt} $1:id
SELECT company_id AS "companyId"
FROM jobs
WHERE id = $1
LIMIT 1;
