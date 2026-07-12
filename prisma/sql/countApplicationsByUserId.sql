-- @param {BigInt} $1:userId
-- @param {String} $2:status
SELECT COUNT(*)::int AS total
FROM applications a
WHERE a.user_id = $1
  AND ($2::varchar IS NULL OR a.status::text = $2);
