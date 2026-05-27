import express, { json } from "express";
import mongoose from "mongoose";
const { connect, connection, Schema, model } = mongoose;
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(json());

const MONGO_URI =
  "mongodb://botay301104_db_user:fYqr8w3ozhYpnSOz@ac-19ql9u9-shard-00-00.r1pbcde.mongodb.net:27017,ac-19ql9u9-shard-00-01.r1pbcde.mongodb.net:27017,ac-19ql9u9-shard-00-02.r1pbcde.mongodb.net:27017/?ssl=true&replicaSet=atlas-wmufq5-shard-0&authSource=admin&appName=lopweb";

connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User Schema & Model
const UserSchema = new Schema({
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

const User = model("User", UserSchema);

app.get("/api/users", async (req, res) => {
  try {
    let { page = 1, limit = 5, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 5;

    const query = {};
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { address: searchRegex },
      ];
    }

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);
    const skip = (page - 1) * limit;

    const users = await User.find(query).skip(skip).limit(limit);

    res.json({
      users,
      currentPage: page,
      totalPages,
      totalUsers,
    });
  } catch (err) {
    console.error("GET /api/users error:", err);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách người dùng: " + err.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    // Check if database is connected
    if (connection.readyState !== 1) {
      return res.status(503).json({ message: "Không kết nối được Cơ sở dữ liệu" });
    }

    const { email } = req.body;

    // Manual check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại trong hệ thống" });
    }

    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json({ message: "Thêm người dùng thành công", user: newUser });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email đã tồn tại trong hệ thống" });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: "Dữ liệu không hợp lệ: " + messages.join(", ") });
    }
    res.status(500).json({ message: "Lỗi server khi thêm người dùng: " + err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.params.id;

    // Manual check for duplicate email, excluding the current user
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại trong hệ thống" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json({ message: "Cập nhật thành công", user: updatedUser });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email đã tồn tại trong hệ thống" });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: "Dữ liệu không hợp lệ: " + messages.join(", ") });
    }
    res.status(500).json({ message: "Lỗi server khi cập nhật người dùng: " + err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng để xóa" });
    }

    res.status(200).json({ message: "Xóa người dùng thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi xóa người dùng: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
