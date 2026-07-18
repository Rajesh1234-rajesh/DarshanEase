const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    templeName: {
      type: String,
      required: true,
    },
    poojaType: {
      type: String,
      required: true,
    },
    slotDate: {
      type: Date,
      required: true,
    },
    slotTime: {
      type: String,
      required: true,
    },
    numberOfPersons: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
