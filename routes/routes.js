const express = require('express');
const bodyParser = require('body-parser');
const Contact = require('../controllers/contactController');

const router = express.Router();

router.use(bodyParser.json());

router.post('/identify', (req, res) => {
  const contact = new Contact();
  contact.identifyContact(req, res);
});

module.exports = router;
