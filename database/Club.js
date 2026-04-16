const mongoose = require("mongoose");

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Club name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Club name must be at least 2 characters"],
      maxlength: [100, "Club name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      enum: {
        values: [
          "academic",
          "cultural",
          "sports",
          "social",
          "technology",
          "arts",
          "volunteering",
          "other",
        ],
        message: "{VALUE} is not a valid club category",
      },
      required: [true, "Club category is required"],
    },
    president: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Club must have a president"],
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

clubSchema.index({ name: 1 });
clubSchema.index({ category: 1 });
clubSchema.index({ members: 1 });

clubSchema.virtual("memberCount").get(function () {
  return this.members.length;
});

clubSchema.set("toJSON", { virtuals: true });
clubSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Club", clubSchema);
