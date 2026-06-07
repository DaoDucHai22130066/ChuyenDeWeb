const { initializeDatabase } = require("../utils/mysql");

const connectDB = async () => {
  try {
    await initializeDatabase();
<<<<<<< HEAD
    console.log("MySQL đã kết nối và đảm bảo cấu trúc cơ sở dữ liệu");
=======
    console.log("MySQL connected and schema ensured");
>>>>>>> hai
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;