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
        GO_API:"2b85924fa2e14640f5bde332f6ac43df64aa535810a3a9923772b21d8a413015",

        LOCALAPP_URL: "http://localhost:3000",
        DEPLOYEDAPP_URL: "https://www.planetqai.com",
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
      DEPLOYEDAPP_URL: "https://www.planetqai.com",
    },
  };
};
