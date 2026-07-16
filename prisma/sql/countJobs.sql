-- @param {String} $1:search
-- @param {String} $2:location
-- @param {Int} $3:salaryMin
-- @param {Int} $4:salaryMax
SELECT COUNT(*)::int AS total
FROM jobs j
WHERE
  ($1::varchar IS NULL OR j.title ILIKE '%' || $1 || '%')
  AND ($2::varchar IS NULL OR j.location ILIKE '%' || $2 || '%')
  AND ($3::int IS NULL OR j.salary_max >= $3)
  AND ($4::int IS NULL OR j.salary_min <= $4);
