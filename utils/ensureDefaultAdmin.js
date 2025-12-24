const { User } = require("../models/schema");
const isIITBhilaiEmail = require("./isIITBhilaiEmail");
const { ROLES } = require("./roles");

const resolveAdminRole = (requestedRole) => {
  if (requestedRole && Object.values(ROLES).includes(requestedRole)) {
    return requestedRole;
  }
  return ROLES.PRESIDENT;
};

const shouldResetPassword = (user) => {
  if (!user) {
    return false;
  }
  if (process.env.DEFAULT_ADMIN_RESET_PASSWORD === "true") {
    return true;
  }
  return user.strategy !== "local" || !user.hash;
};

const setPasswordAsync = (user, password) =>
  new Promise((resolve, reject) => {
    user.setPassword(password, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

const ensureDefaultAdmin = async () => {
  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;
  const name = process.env.DEFAULT_ADMIN_NAME || "Gymkhana Admin";
  const role = resolveAdminRole(process.env.DEFAULT_ADMIN_ROLE);

  if (!email || !password) {
    console.warn("Default admin credentials not provided. Skipping admin bootstrap.");
    return;
  }

  if (!isIITBhilaiEmail(email)) {
    console.error(
      `Default admin email must belong to the iitbhilai.ac.in domain. Provided: ${email}`,
    );
    return;
  }

  const existingUser = await User.findOne({ username: email });

  if (!existingUser) {
    const adminUser = new User({
      username: email,
      role,
      strategy: "local",
      onboardingComplete: true,
      personal_info: {
        name,
        email,
      },
    });

    await User.register(adminUser, password);
    console.log(`Default admin user created with username ${email}.`);
    return;
  }

  let hasChanges = false;

  if (existingUser.role !== role) {
    existingUser.role = role;
    hasChanges = true;
  }

  if (existingUser.personal_info?.name !== name) {
    existingUser.personal_info = {
      ...(existingUser.personal_info || {}),
      name,
      email,
    };
    hasChanges = true;
  }

  if (!existingUser.onboardingComplete) {
    existingUser.onboardingComplete = true;
    hasChanges = true;
  }

  if (shouldResetPassword(existingUser)) {
    await setPasswordAsync(existingUser, password);
    existingUser.strategy = "local";
    hasChanges = true;
    console.log(`Default admin password reset for ${email}.`);
  }

  if (hasChanges) {
    existingUser.updated_at = new Date();
    await existingUser.save();
    console.log(`Default admin user updated (${email}).`);
  } else {
    console.log(`Default admin user already present (${email}).`);
  }
};

module.exports = ensureDefaultAdmin;
