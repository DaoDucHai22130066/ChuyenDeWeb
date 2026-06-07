const { initializeDatabase } = require("../utils/mysql");

const connectDB = async () => {
  try {
    await initializeDatabase();
    console.log("MySQL connected and schema ensured");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;