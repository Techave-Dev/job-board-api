-- @param {BigInt} $1:id
SELECT
  j.id,
  c.id AS "companyId",
  c.name AS "companyName",
  c.logo_url AS "companyLogoUrl",
  j.title,
  j.description,
  j.location,
  j.salary_min AS "salaryMin",
  j.salary_max AS "salaryMax",
  j.created_at AS "createdAt",
  j.updated_at AS "updatedAt",
  (SELECT COUNT(*)::int FROM applications a WHERE a.job_id = j.id) AS "applicationCount"
FROM jobs j
JOIN companies c ON c.id = j.company_id
WHERE j.id = $1
LIMIT 1;
