-- @param {BigInt} $1:userId
-- @param {Boolean} $2:unread
-- @param {Int} $3:limit
-- @param {Int} $4:offset
SELECT
  id,
  user_id AS "userId",
  type,
  title,
  message,
  data,
  read,
  created_at AS "createdAt"
FROM notifications
WHERE user_id = $1
  AND ($2::boolean IS NULL OR read = (NOT $2::boolean))
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;