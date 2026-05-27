import mongoose from "mongoose";

const MONGO_URI =
  "mongodb://botay301104_db_user:fYqr8w3ozhYpnSOz@ac-19ql9u9-shard-00-00.r1pbcde.mongodb.net:27017,ac-19ql9u9-shard-00-01.r1pbcde.mongodb.net:27017,ac-19ql9u9-shard-00-02.r1pbcde.mongodb.net:27017/?ssl=true&replicaSet=atlas-wmufq5-shard-0&authSource=admin&appName=lopweb";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên không được để trống"],
    minlength: [2, "Tên phải có ít nhất 2 ký tự"],
  },
  age: {
    type: Number,
    required: [true, "Tuổi không được để trống"],
    min: [0, "Tuổi phải > 0"],
  },
  email: {
    type: String,
    required: [true, "Email không được để trống"],
    match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
    unique: true,
  },
  address: {
    type: String,
  },
});

const User = mongoose.model("User", UserSchema);

const seedUsers = [
  {
    name: "Nguyễn Văn A",
    age: 25,
    email: "nva@example.com",
    address: "Hà Nội",
  },
  {
    name: "Trần Thị B",
    age: 30,
    email: "ttb@example.com",
    address: "TP.HCM",
  },
  { name: "Lê Văn C", age: 22, email: "lvc@example.com", address: "Đà Nẵng" },
];

async function initDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await User.deleteMany({});
    console.log("Cleared existing users");

    const users = await User.insertMany(seedUsers);
    console.log(`Seeded ${users.length} users`);

    const allUsers = await User.find();
    console.log("All users in DB:");
    allUsers.forEach((u) => {
      console.log(`  - ${u.name} | ${u.age} | ${u.email} | ${u.address}`);
    });
  } catch (err) {
    console.error("Init DB error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

initDB();
