-- @param {BigInt} $1:id
-- @param {String} $2:title
-- @param {String} $3:description
-- @param {String} $4:location
-- @param {Int} $5:salaryMin
-- @param {Int} $6:salaryMax
UPDATE jobs
SET
  title = COALESCE($2, title),
  description = COALESCE($3, description),
  location = COALESCE($4, location),
  salary_min = COALESCE($5, salary_min),
  salary_max = COALESCE($6, salary_max),
  updated_at = NOW()
WHERE id = $1
RETURNING
  id,
  company_id AS "companyId",
  title,
  description,
  location,
  salary_min AS "salaryMin",
  salary_max AS "salaryMax",
  created_at AS "createdAt",
  updated_at AS "updatedAt";
