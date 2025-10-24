import jwt from "jsonwebtoken";

const defaultSecret = "dev-secret-change-me";

export const authenticate = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    const err = new Error("Authentication required");
    err.status = 401;
    throw err;
  }
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || defaultSecret);
    req.user = payload;
    next();
  } catch (error) {
    const err = new Error("Invalid or expired token");
    err.status = 401;
    throw err;
  }
};

export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const err = new Error("Insufficient permissions");
      err.status = 403;
      throw err;
    }
    next();
  };
