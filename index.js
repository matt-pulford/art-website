const express = require('express');
const { fileURLToPath } = require('url');
const path = require('path');
const ejs = require('ejs');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const dotenv = require('dotenv');
const helmet = require('helmet'); // Added Helmet

dotenv.config();

// Constants
const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse urlencoded data
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet()); // Use Helmet

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // Outlook SMTP server hostname
  secureConnection: false, // Set to false because TLS requires this to be false
  port: process.env.EMAIL_PORT, // Port for secure SMTP
  tls: {
      ciphers: 'SSLv3'
  },
  auth: {
      user: process.env.EMAIL_USER, // Your Outlook email address
      pass: process.env.EMAIL_PASSWORD // Your Outlook email password or app-specific password
  }
});


// Define routes
// Home Route

app.get('/', (req, res) => {
  res.render('index');
});

// Contact
app.get('/contact', (req, res) => {
  res.render('contact');
});

// Gallery
app.get('/gallery', (req, res) => {
  const imageFiles = fs.readdirSync('./public/images').filter(file => file.endsWith('.webp'));
  const itemsPerPage = 4;
  const currentPage = req.query.page || 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const imagesOnPage = imageFiles.slice(startIndex, endIndex);

  const gallerySections = ['gallery-a', 'gallery-b', 'gallery-c', 'gallery-d'];
  const imageUrls = imagesOnPage.map((image, index) => {
    return { section: gallerySections[index], url: `/images/${image}` };
  });

  const totalPages = Math.ceil(imageFiles.length / itemsPerPage);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  res.render('gallery', {
    imageUrls,
    hasPrevious,
    hasNext,
    currentPage,
  });
});

app.get('/image/:imageURL', (req, res) => {
  const imageURL = decodeURIComponent(req.params.imageURL);
  res.render('image', { image: { url: imageURL } });
});

// Contact Post Route
app.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;

  const mailOptions = {
      from: process.env.MAIL_FROM, // Use the Outlook email address as the sender
      to: process.env.MAIL_TO, // Recipient's email address
      subject: subject,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.error(error);
          res.render('error')
      } else {
          console.log('Email sent: ' + info.response);
          res.render('contact');

      }
  });
});

// Error
app.get('/error', (req, res) => {
  res.render('error');
});


// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
