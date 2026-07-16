-- @param {BigInt} $1:companyId
-- @param {String} $2:title
-- @param {String} $3:description
-- @param {String} $4:location
-- @param {Int} $5:salaryMin
-- @param {Int} $6:salaryMax
INSERT INTO jobs (company_id, title, description, location, salary_min, salary_max)
VALUES ($1, $2, $3, $4, $5, $6)
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
