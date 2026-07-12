-- @param {BigInt} $1:id
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
WHERE id = $1
LIMIT 1;