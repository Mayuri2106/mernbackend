const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middlewares/auth');

const { signup, login, user, createFolder, getFolders, deleteFolder, logout, update, createForm, 
  getForm, deleteForm,updateForm, updateMode, 
  updateTheme, createPopup, getPopups, 
  deletePopup,  updatePopupContent, getChat, createChat, saveResponse, getFormResponse,updateChatInteraction} = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.get('/user',user);
router.post('/folder' ,auth, createFolder);
router.get('/folder', auth,getFolders);
router.delete('/folder/:id',auth, deleteFolder);
router.put('/Form/:formId',auth,updateForm);
router.post('/logout', logout);
router.put('/update',  [
  auth,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('oldPassword', 'Old password is required').exists(),
    check('newPassword', 'New password is required').exists()
  ]
  ], update);
router.post('/Form',auth,  createForm);
router.get('/Form', auth,getForm);
router.delete('/Form/:id',auth, deleteForm);

router.post('/Form/:formId/Popup', auth,createPopup);

router.get('/Form/:formId/Popups',auth, getPopups);
router.delete('/Form/:formId/Popup/:popupId', auth, deletePopup);

router.patch('/Form/:formId/Popup/:popupId', auth,updatePopupContent);



router.post('/chat', createChat);
router.get('/chat/:id', getChat);
router.post('/chat/:id/response', saveResponse);

router.get('/formresponse/:id', getFormResponse);

router.put('/chat/:id/interact', updateChatInteraction);




module.exports = router;


