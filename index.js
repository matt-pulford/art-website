import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import ejs from 'ejs';
import nodemailer from 'nodemailer';
import cookieParser from 'cookie-parser';
import fs from 'fs';

// Constants
const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


// Middleware to parse urlencoded data
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com", // Outlook SMTP server hostname
  secureConnection: false, // Set to false because TLS requires this to be false
  port: 587, // Port for secure SMTP
  tls: {
      ciphers: 'SSLv3'
  },
  auth: {
      user: '', // Your Outlook email address
      pass: '' // Your Outlook email password or app-specific password
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
      from: '"HKC Contact " <mattyp666@outlook.com>', // Use the Outlook email address as the sender
      to: 'mattpsender@gmail.com', // Recipient's email address
      subject: subject,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.error(error);
          res.render('error', { loggedIn: req.session.loggedIn, user: req.session.userEmail })
      } else {
          console.log('Email sent: ' + info.response);
          res.render('contact', { loggedIn: req.session.loggedIn, user: req.session.userEmail });

      }
  });
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});