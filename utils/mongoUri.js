const DEFAULT_MONGODB_URI = "mongodb://127.0.0.1:27017/hacktoberstudent";

const buildMongoUri = () => {
  const envUri = typeof process.env.MONGODB_URI === "string" ? process.env.MONGODB_URI.trim() : "";

  if (envUri) {
    return envUri;
  }

  console.warn(
    "[MongoDB] MONGODB_URI not set. Falling back to local instance at mongodb://127.0.0.1:27017/hacktoberstudent",
  );
  return DEFAULT_MONGODB_URI;
};

module.exports = { buildMongoUri, DEFAULT_MONGODB_URI };
