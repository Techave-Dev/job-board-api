-- @param {BigInt} $1:userId
-- @param {String} $2:type
-- @param {String} $3:title
-- @param {String} $4:message
-- @param {String} $5:data
INSERT INTO notifications (user_id, type, title, message, data, created_at)
VALUES (
  $1,
  CAST($2 AS "NotificationType"),
  $3,
  $4,
  CAST($5 AS jsonb),
  CURRENT_TIMESTAMP
)
RETURNING
  id,
  user_id AS "userId",
  type,
  title,
  message,
  data,
  read,
  created_at AS "createdAt";