require("./loadEnv");

const rawServerUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}/`;

module.exports = {
	Server_URL: rawServerUrl.endsWith("/") ? rawServerUrl : `${rawServerUrl}/`,
};
