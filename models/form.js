const mongoose = require('mongoose');

const PopupSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  type: { type: String, required: true },
  content: { type: String, default: '' }, // This will store the URL
  serialNo: { type: Number, required: true },
});



const FormSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
 
  popups: [PopupSchema],
});

module.exports = mongoose.model('Form', FormSchema);
