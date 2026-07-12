-- @param {String} $1:search
-- @param {String} $2:location
-- @param {Int} $3:salaryMin
-- @param {Int} $4:salaryMax
-- @param {Int} $5:limit
-- @param {Int} $6:offset
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
WHERE
  ($1::varchar IS NULL OR j.title ILIKE '%' || $1 || '%')
  AND ($2::varchar IS NULL OR j.location ILIKE '%' || $2 || '%')
  AND ($3::int IS NULL OR j.salary_max >= $3)
  AND ($4::int IS NULL OR j.salary_min <= $4)
ORDER BY j.created_at DESC
LIMIT $5 OFFSET $6;
