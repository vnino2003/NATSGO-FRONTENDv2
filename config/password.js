const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const db = require("./db");

async function getRoleId(roleKey) {
  const [rows] = await db.query(
    "SELECT role_id FROM roles WHERE role_key = ? AND is_active = 1 LIMIT 1",
    [roleKey]
  );

  return rows[0]?.role_id || null;
}

async function getUserWithRoleById(id) {
  const [rows] = await db.query(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      u.password,
      u.role,
      u.status,
      u.auth_provider,
      u.provider_id,
      u.avatar_url,
      u.last_login_at,
      u.created_at,
      u.updated_at,
      u.role_id,
      r.role_name,
      r.role_key,
      r.user_type,
      r.can_manage_admins,
      r.can_view_dashboard,
      r.can_manage_buses,
      r.can_manage_devices,
      r.can_manage_routes,
      r.can_manage_fares,
      r.can_manage_announcements
    FROM users u
    LEFT JOIN roles r ON r.role_id = u.role_id
    WHERE u.id = ?
    LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
}

async function findOrCreateCommuterOAuthUser(profile, provider) {
  const email = profile.emails?.[0]?.value || null;

  if (!email) {
    throw new Error(`${provider} account has no email.`);
  }

  const providerId = profile.id;
  const name = profile.displayName || email.split("@")[0];
  const avatarUrl = profile.photos?.[0]?.value || null;

  const [existing] = await db.query(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  if (existing.length) {
    const user = existing[0];

    if (user.role !== "commuters") {
      throw new Error("This email is already used by an admin account.");
    }

    if (user.status !== "active") {
      throw new Error("This commuter account is inactive.");
    }

    await db.query(
      `
      UPDATE users
      SET
        auth_provider = ?,
        provider_id = ?,
        avatar_url = ?,
        last_login_at = NOW(),
        updated_at = NOW()
      WHERE id = ?
      `,
      [provider, providerId, avatarUrl, user.id]
    );

    return await getUserWithRoleById(user.id);
  }

  const commuterRoleId = await getRoleId("commuter");

  if (!commuterRoleId) {
    throw new Error("Commuter role is missing.");
  }

  const [result] = await db.query(
    `
    INSERT INTO users (
      name,
      email,
      password,
      role,
      role_id,
      status,
      auth_provider,
      provider_id,
      avatar_url,
      last_login_at,
      created_at,
      updated_at
    )
    VALUES (?, ?, NULL, 'commuters', ?, 'active', ?, ?, ?, NOW(), NOW(), NOW())
    `,
    [name, email, commuterRoleId, provider, providerId, avatarUrl]
  );

  return await getUserWithRoleById(result.insertId);
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateCommuterOAuthUser(profile, "google");
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ["id", "displayName", "emails", "photos"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateCommuterOAuthUser(profile, "facebook");
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

module.exports = passport;