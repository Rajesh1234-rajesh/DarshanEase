const express = require('express');
const Booking = require('../models/Booking');
const protect = require('../config/authMiddleware');

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new darshan booking
router.post('/', protect, async (req, res) => {
  try {
    const { templeName, poojaType, slotDate, slotTime, numberOfPersons } = req.body;

    if (!templeName || !poojaType || !slotDate || !slotTime) {
      return res.status(400).json({ message: 'Please provide all required booking details' });
    }

    const booking = await Booking.create({
      user: req.user.id,
      templeName,
      poojaType,
      slotDate,
      slotTime,
      numberOfPersons,
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/bookings
// @desc    Get all bookings for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
