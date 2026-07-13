-- @param {BigInt} $1:applicationId
-- @param {Int} $2:limit
-- @param {Int} $3:offset
SELECT
  id,
  application_id AS "applicationId",
  sender_id AS "senderId",
  content,
  created_at AS "createdAt"
FROM chat_messages
WHERE application_id = $1
ORDER BY created_at ASC
LIMIT $2 OFFSET $3;
