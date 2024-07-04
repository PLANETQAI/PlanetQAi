const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

module.exports = (phase) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      env: {
        mongodb_username: "ghufran",
        mongodb_password: "Allahis1",
        mongodb_clustername: "cluster0",
        mongodb_database: "planetradioclient",

        NEXTAUTH_SECRET: "LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=",
        NEXTAUTH_URL: "http://localhost:3000",

        LOCALAPP_URL: "http://localhost:3000",
        DEPLOYEDAPP_URL: "https://www.",
      },
    };
  }

  return {
    env: {
        mongodb_username: "ghufran",
        mongodb_password: "Allahis1",
        mongodb_clustername: "cluster0",
        mongodb_database: "deployedplanet",

      NEXTAUTH_SECRET: "LlKq6ZtYbr+hTC073mAmAh9/h2HwMfsFo4hrfCx5mLg=",
      NEXTAUTH_URL: "http://localhost:3000",

      LOCALAPP_URL: "http://localhost:3000",
      DEPLOYEDAPP_URL: "https://www.",
    },
  };
};
