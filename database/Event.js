const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, "Filename is required"],
    trim: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
    validate: {
      validator: (v) =>
        /^(image\/(jpeg|png|gif|webp)|application\/(pdf|msword|vnd\.openxmlformats))/.test(
          v
        ),
      message: "Unsupported file type. Allowed: images, PDFs, Word documents",
    },
  },
  size: {
    type: Number,
    required: true,
    max: [10 * 1024 * 1024, "File size cannot exceed 10MB"],
  },
  url: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const reminderSchema = new mongoose.Schema({
  message: {
    type: String,
    trim: true,
    maxlength: [500, "Reminder message cannot exceed 500 characters"],
  },
  remindAt: {
    type: Date,
    required: [true, "Reminder date is required"],
  },
  sent: {
    type: Boolean,
    default: false,
  },
});

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: [true, "Event must belong to a club"],
    },
    status: {
      type: String,
      enum: {
        values: ["todo", "in-progress", "done", "cancelled"],
        message: "{VALUE} is not a valid status",
      },
      default: "todo",
    },
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high", "urgent"],
        message: "{VALUE} is not a valid priority",
      },
      default: "medium",
    },
    category: {
      type: String,
      enum: {
        values: [
          "meeting",
          "workshop",
          "social",
          "competition",
          "fundraiser",
          "volunteering",
          "general",
        ],
        message: "{VALUE} is not a valid event category",
      },
      default: "general",
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [30, "Tag cannot exceed 30 characters"],
      },
    ],
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (v) {
          return !v || v >= this.startDate;
        },
        message: "End date must be on or after start date",
      },
    },
    deadline: {
      type: Date,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Event must have a creator"],
    },
    assignedTo: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        assignedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    attendees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rsvp: {
          type: String,
          enum: ["going", "maybe", "not-going"],
          default: "going",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    maxAttendees: {
      type: Number,
      min: [1, "Max attendees must be at least 1"],
    },
    attachments: [attachmentSchema],
    reminders: [reminderSchema],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ club: 1, status: 1 });
eventSchema.index({ club: 1, startDate: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ "assignedTo.user": 1 });
eventSchema.index({ "attendees.user": 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ priority: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ deadline: 1 });
eventSchema.index({ title: "text", description: "text" });

eventSchema.virtual("attendeeCount").get(function () {
  return this.attendees.filter((a) => a.rsvp === "going").length;
});

eventSchema.virtual("isFull").get(function () {
  if (!this.maxAttendees) return false;
  return this.attendeeCount >= this.maxAttendees;
});

eventSchema.virtual("isOverdue").get(function () {
  if (!this.deadline) return false;
  return this.deadline < new Date() && this.status !== "done";
});

eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Event", eventSchema);
