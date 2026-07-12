-- @param {BigInt} $1:userId
-- @param {Boolean} $2:unread
SELECT COUNT(*)::int AS "total"
FROM notifications
WHERE user_id = $1
  AND ($2::boolean IS NULL OR read = (NOT $2::boolean));