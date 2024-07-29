const User = require('../models/user');
const Form = require('../models/form');
const Folder = require('../models/folder');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {  validationResult } = require('express-validator');


exports.signup = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ msg: 'Passwords do not match' });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const payload = {
      user: {
        id: newUser._id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

     res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      },
      token,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user._id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};


exports.user = async (req, res) => {
  const token = req.header('x-auth-token');

  if (!token) {
    console.error('No token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    const user = await User.findById(decoded.user.id).select('-password');
    console.log('User:', user);

    if (!user) {
      console.error('User not found');
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      console.error('JWT Error:', err.message);
      return res.status(401).json({ msg: 'Token is not valid' });
    } else if (err.name === 'TokenExpiredError') {
      console.error('JWT Expired:', err.message);
      return res.status(401).json({ msg: 'Token has expired' });
    } else {
      console.error('Server error:', err.message);
      res.status(500).json({ msg: 'Server error' });
    }
  }
};










exports.createFolder = async (req, res) => {
  const { name } = req.body;

  if (!req.user || !req.user.id) {
    return res.status(401).json({ msg: 'User not authenticated' });
  }

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ msg: 'Folder name is required' });
  }

  if (name.length < 3 || name.length > 50) {
    return res.status(400).json({ msg: 'Folder name must be between 3 and 50 characters' });
  }

  try {
    const existingFolder = await Folder.findOne({ name, userId: req.user.id });
    if (existingFolder) {
      return res.status(400).json({ msg: 'Folder name already exists' });
    }

    const newFolder = new Folder({ name, userId: req.user.id });
    await newFolder.save();
    res.status(201).json(newFolder);
  } catch (error) {
    console.error('Error creating folder:', error.message);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};





exports.getFolders = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ msg: 'User not authenticated' });
  }

  try {
    const folders = await Folder.find({ userId: req.user.id });
    res.status(200).json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};


exports.deleteFolder = async (req, res) => {
  const { id } = req.params;

  if (!req.user || !req.user.id) {
    return res.status(401).json({ msg: 'User not authenticated' });
  }

  try {
    const folder = await Folder.findById(id);
    if (!folder) {
      return res.status(404).json({ msg: 'Folder not found' });
    }

    if (folder.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this folder' });
    }

    await Folder.findByIdAndDelete(id);
    res.status(200).json({ msg: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};



exports.logout=  (req, res) => {
  
  res.json({ msg: 'Logged out successfully' });
};






exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, oldPassword, newPassword } = req.body;

  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid old password' });
    }

    user.name = name;
    user.email = email;

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ msg: 'User details updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};





exports.createForm = async (req, res) => {
  const { name, folderId } = req.body;

  console.log('Authenticated user:', req.user); // Debug log

  if (!req.user || !req.user.id) {
    return res.status(401).json({ msg: 'User not authenticated' });
  }

  if (!name) {
    return res.status(400).json({ msg: 'Form name is required' });
  }

  try {
    // Check for duplicate form name in the same folder
    const existingForm = await Form.findOne({ 
      name: name, 
      folderId: folderId, 
      userId: req.user.id 
    });

    if (existingForm) {
      return res.status(400).json({ msg: 'A form with this name already exists in the selected folder' });
    }

    // Create the new form
    const newForm = new Form({ name, folderId, userId: req.user.id });
    await newForm.save();
    res.status(201).json(newForm);
  } catch (err) {
    console.error('Error creating form:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};




exports.getForm = async (req, res) => {
  const { folderId } = req.query; 
  

  if (!req.user || !req.user.id) {
    return res.status(401).json({ msg: 'User not authenticated' });
  }

  try {
    const query = { userId: req.user.id };

    if (folderId !== undefined && folderId !== 'null') {
      query.folderId = folderId;
    }

    const forms = await Form.find(query);
    res.status(200).json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};






exports.deleteForm = async (req, res) => {
  const formId = req.params.id;

  try {
    const result = await Form.findByIdAndDelete(formId);
    if (!result) {
      return res.status(404).json({ msg: 'Form not found' });
    }

    res.status(200).json({ msg: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};



exports.updateForm =  (req, res) => {
  res.json({ success: true }); 
};























exports.createPopup = async (req, res) => {
  const { formId } = req.params;
  const { id, type, content, serialNo } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ msg: 'Form not found' });
    }

    form.popups.push({ id, type, content, serialNo });
    await form.save();

    res.status(201).json({ msg: 'Popup created successfully', popup: { id, type, content, serialNo } });
  } catch (error) {
    console.error('Error creating popup:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};




exports.getPopups = async (req, res) => {
  const { formId } = req.params;

  try {
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ msg: 'Form not found' });
    }

    res.json({ popups: form.popups });
  } catch (error) {
    console.error('Error fetching popups:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};






exports.deletePopup = async (req, res) => {
  const { formId, popupId } = req.params;

  try {
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ msg: 'Form not found' });
    }

    form.popups = form.popups.filter(popup => popup.id !== parseInt(popupId));
    await form.save();

    res.status(200).json({ msg: 'Popup deleted successfully' });
  } catch (error) {
    console.error('Error deleting popup:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};



exports.updatePopupContent = async (req, res) => {
  const { formId, popupId } = req.params;
  const { content } = req.body;

  try {
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ msg: 'Form not found' });
    }

    const popup = form.popups.find(popup => popup.id === parseInt(popupId));
    if (popup) {
      popup.content = content;
      await form.save();
      res.status(200).json({ msg: 'Popup content updated successfully' });
    } else {
      res.status(404).json({ msg: 'Popup not found' });
    }
  } catch (error) {
    console.error('Error updating popup content:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};




const Chat = require('../models/chat');

exports.createChat = async (req, res) => {
  try {
    const { popups } = req.body;
    const chat = new Chat({ popups });
    await chat.save();
    res.status(201).json({ chatId: chat._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};



exports.getChat = async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await Chat.findById(id); 

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.status(200).json({
      chatId: chat._id,
      popups: chat.popups, 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};




exports.saveResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { index, response } = req.body;

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const popup = chat.popups[index];
    if (!popup) {
      return res.status(400).json({ message: 'Invalid popup index' });
    }

    const responseEntry = {
      popupType: popup.type,
      serialNo: popup.serialNo,
      response,
      
    };

    chat.responses[index] = responseEntry;
    await chat.save();

    res.status(200).json({ message: 'Response saved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};




const mongoose = require('mongoose');
exports.getFormResponse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const responses = chat.responses
      .filter(response => response && response.popupType !== null) 
      .map((response, index) => ({
        popupType: response.popupType,
        serialNo: index + 1,
        response: response.response || null,
        submittedAt: response.submittedAt,
      }));

    res.status(200).json({
      lastVisited: chat.lastVisited,
      views: chat.views,
      incompleteInteractions: chat.incompleteInteractions,
      completionRate: chat.completionRate,
      responses,
    });
  } catch (error) {
    console.error('Error fetching form response:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// controllers/authController.js
exports.updateChatInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { views, incompleteInteractions, completionRate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (views !== undefined) chat.views += views;
    if (incompleteInteractions !== undefined) chat.incompleteInteractions += incompleteInteractions;
    if (completionRate !== undefined) chat.completionRate = completionRate;

    // Calculate completionRate and incompleteInteractions based on responses and popups
    const totalPopups = chat.popups.length;
    const totalResponses = chat.responses.length;

    if (totalResponses >= totalPopups) {
      chat.completionRate = 100;
    } else {
      chat.incompleteInteractions = totalResponses;
    }

    await chat.save();

    res.status(200).json({ message: 'Chat interaction updated successfully', chat });
  } catch (error) {
    console.error('Error updating chat interaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
