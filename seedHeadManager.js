require("dotenv").config();

const bcrypt = require("bcrypt");
const db = require("./config/db");

async function seedHeadManager() {
  const email = "headmanager@natsgo.com";
  const password = "NatsgoAdmin123";
  const name = "Head Manager";

  const [roles] = await db.query(
    "SELECT role_id FROM roles WHERE role_key = 'head_manager' LIMIT 1"
  );

  if (!roles.length) {
    console.log("Missing Head Manager role. Please create/insert roles first.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.query(
    `
    INSERT INTO users (
      name,
      email,
      password,
      role,
      status,
      auth_provider,
      role_id,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, 'admin', 'active', 'local', ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      password = VALUES(password),
      role = 'admin',
      status = 'active',
      auth_provider = 'local',
      role_id = VALUES(role_id),
      updated_at = NOW()
    `,
    [name, email, passwordHash, roles[0].role_id]
  );

  console.log("Admin account ready:");
  console.log("Email:", email);
  console.log("Password:", password);

  process.exit(0);
}

seedHeadManager().catch((err) => {
  console.error(err);
  process.exit(1);
});