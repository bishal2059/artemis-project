const mongoose = require("mongoose");

const MONGO_URL = process.env.MONGO_URL;

mongoose.connection.once("open", () => {
  console.log("Mongo DB connection ready");
});

mongoose.connection.on("error", (err) => {
  console.error(err);
});

mongoose.set("strictQuery", true);

const mongoConnect = async function () {
  await mongoose.connect(MONGO_URL);
};

const mongoDisconnect = async function () {
  await mongoose.disconnect();
};

module.exports = {
  mongoConnect,
  mongoDisconnect,
};
