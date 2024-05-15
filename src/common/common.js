const jwt = require("jsonwebtoken");
const env = require("../environments/environment");

exports.generateJwtToken = async (user) => {
  try {
    const payload = {
      user: {
        id: user?.profileId || user?.id,
        email: user.email,
      },
    };

    return jwt.sign(payload, env.JWT_SECRET_KEY, { expiresIn: "5d" });
  } catch (error) {
    return error;
  }
};
