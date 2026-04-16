const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => validator.isEmail(v),
        message: "{VALUE} is not a valid email",
      },
      match: [
        /@student\.monash\.edu$|@monash\.edu$/,
        "Must be a Monash email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [1, "First name cannot be empty"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [1, "Last name cannot be empty"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    studentId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      validate: {
        validator: (v) => /^\d{8}$/.test(v),
        message: "Student ID must be exactly 8 digits",
      },
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "member"],
        message: "{VALUE} is not a valid role",
      },
      default: "member",
    },
    clubs: [
      {
        club: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Club",
        },
        clubRole: {
          type: String,
          enum: ["president", "vice-president", "secretary", "treasurer", "committee", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ "clubs.club": 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isClubAdmin = function (clubId) {
  const membership = this.clubs.find(
    (c) => c.club.toString() === clubId.toString()
  );
  if (!membership) return false;
  return ["president", "vice-president", "secretary", "treasurer", "committee"].includes(
    membership.clubRole
  );
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
