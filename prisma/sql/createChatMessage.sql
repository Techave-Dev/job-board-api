-- @param {BigInt} $1:applicationId
-- @param {BigInt} $2:senderId
-- @param {String} $3:content
INSERT INTO chat_messages (application_id, sender_id, content, created_at)
VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
RETURNING
  id,
  application_id AS "applicationId",
  sender_id AS "senderId",
  content,
  created_at AS "createdAt";
