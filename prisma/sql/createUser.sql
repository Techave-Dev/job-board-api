-- @param {String} $1:email
-- @param {String} $2:password
-- @param {String} $3:name
-- @param {String} $4:role
INSERT INTO users (email, password, name, role, updated_at) 
VALUES ($1, $2, $3, CAST($4 AS "Role"), CURRENT_TIMESTAMP) 
RETURNING 
  id, 
  email,
  name,
  role,
  created_at AS "createdAt",
  updated_at AS "updatedAt";