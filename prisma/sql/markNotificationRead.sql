-- @param {BigInt} $1:id
UPDATE notifications
SET read = true
WHERE id = $1
RETURNING
  id,
  user_id AS "userId",
  type,
  title,
  message,
  data,
  read,
  created_at AS "createdAt";