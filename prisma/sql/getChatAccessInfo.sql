-- @param {BigInt} $1:applicationId
SELECT
  a.id AS "applicationId",
  a.user_id AS "applicantUserId",
  c.user_id AS "companyUserId"
FROM applications a
JOIN jobs j ON a.job_id = j.id
JOIN companies c ON j.company_id = c.id
WHERE a.id = $1;
