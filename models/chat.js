const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  popups: {
    type: Array,
    required: true,
  },
  responses: [
    {   
      popupType: String,
      serialNo: Number,
      response: mongoose.Schema.Types.Mixed,
      submittedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  views: {
    type: Number,
    default: 0,
  },
  incompleteInteractions: {
    type: Number,
    default: 0,
  },
  completionRate: {
    type: Number,
    default: 0,
  },
  lastVisited: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Chat', chatSchema);
