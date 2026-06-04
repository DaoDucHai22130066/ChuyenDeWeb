const { initializeDatabase } = require("../utils/mysql");

const connectDB = async () => {
  try {
    await initializeDatabase();
    console.log("MySQL đã kết nối và đảm bảo cấu trúc cơ sở dữ liệu");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;