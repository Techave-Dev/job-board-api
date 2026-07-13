-- @param {BigInt} $1:applicationId
SELECT COUNT(*)::int AS total
FROM chat_messages
WHERE application_id = $1;
