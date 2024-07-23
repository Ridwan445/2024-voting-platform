const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');

const allowedFlatNumbers = [
  'BLK A 1A', 'BLK A 1B', 'BLK A 2A', 'BLK A 2B', 'BLK A 3A', 'BLK A 3B', 'BLK B 1B', 
  'BLK B 2A', 'BLK B 2B', 'BLK B 3A', 'BLK B 3B', 'BLK B 4A', 'BLK B 4B', 'BLK C 1A', 
  'BLK C 1B', 'BLK C 2A', 'BLK C 2B', 'BLK C 3A', 'BLK C 3B', 'BLK C 4A', 'BLK C 4B', 
  'BLK D 1A', 'BLK D 1B', 'BLK D 2A', 'BLK D 2B', 'BLK D 3A', 'BLK D 3B', 'BLK D 4A', 
  'BLK D 4B', 'BLK E 1A', 'BLK E 1B', 'BLK E 2A', 'BLK E 2B', 'BLK E 3A', 'BLK E 3B', 
  'BLK E 4A', 'BLK E 4B', 'BLK F 1A', 'BLK F 1B', 'BLK F 2A', 'BLK F 2B', 'BLK F 3A', 
  'BLK F 3B', 'BLK F 4A', 'BLK F 4B', 'BLK G 1A', 'BLK G 1B', 'BLK G 2A', 'BLK G 2B', 
  'BLK G 3A', 'BLK G 3B', 'BLK H 1A', 'BLK H 1B', 'BLK H 2A', 'BLK H 2B', 'BLK H 3A', 
  'BLK H 3B', 'BLK I 1A', 'BLK I 1B', 'BLK I 2A', 'BLK I 2B', 'BLK I 3A', 'BLK I 3B', 
  'BLK J 1A', 'BLK J 1B', 'BLK J 2A', 'BLK J 2B', 'BLK J 3A', 'BLK J 3B', 'BLK K 1A', 
  'BLK K 1B', 'BLK K 2A', 'BLK K 2B', 'BLK K 3A', 'BLK K 3B', 'BLK L 1A', 'BLK L 1B', 
  'BLK L 2A', 'BLK L 2B', 'BLK L 3A', 'BLK L 3B', 'BLK M 1A', 'BLK M 1B', 'BLK M 2A', 
  'BLK M 2B', 'BLK M 3A', 'BLK M 3B', 'BLK M 4A', 'BLK M 4B', 'BLK M 5A', 'BLK M 5B', 
  'BLK N 1A', 'BLK N 1B', 'BLK N 2A', 'BLK N 2B', 'BLK N 3A', 'BLK N 3B', 'BLK N 4A', 
  'BLK N 4B', 'BLK N 5A', 'BLK N 5B', 'BLK O1', 'BLK O2', 'BLK O3', 'BLK O4', 'BLK O5', 
  'BLK O6', 'BLK O7', 'BLK O8', 'BLK O9', 'BLK O10', 'BLK O11', 'BLK O12', 'BLK O13', 
  'BLK O14', 'BLK O15', 'BLK O16', 'BLK P1', 'BLK P2', 'BLK P3', 'BLK P4', 'BLK P5', 
  'BLK P6', 'BLK P7', 'BLK P8', 'BLK P9', 'BLK P10', 'BLK P11', 'BLK P12', 'BLK P13', 
  'BLK P14', 'BLK P15', 'BLK P16', 'BLK Q1', 'BLK Q2', 'BLK Q3', 'BLK Q4', 'BLK Q5', 
  'BLK Q6', 'BLK Q7', 'BLK Q8', 'BLK Q9', 'BLK Q10', 'BLK Q11', 'BLK Q12', 'BLK Q13', 
  'BLK Q14', 'BLK Q15', 'BLK Q16', 'BLK R 1A', 'BLK R 1B', 'BLK R 2A', 'BLK R 2B', 
  'BLK R 3A', 'BLK R 3B', 'BLK R 4A', 'BLK R 4B', 'BLK R 5A', 'BLK R 5B'
];

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

let ADMIN_PASSWORD = 'admin';

let votes = {};
let voteCount = {};
let candidates = [];

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.render('index', { message: null, alertClass: null });
});

app.post('/candidates', (req, res) => {
  const flatNumber = req.body.flatNumber.trim().toUpperCase();
  if (allowedFlatNumbers.includes(flatNumber)) {
    req.session.flatNumber = flatNumber;
    res.redirect('/candidates');
  } else {
    res.render('index', { message: 'Invalid flat number.', alertClass: 'alert-danger' });
  }
});

app.get('/candidates', (req, res) => {
  const flatNumber = req.session.flatNumber;
  if (!flatNumber) {
    return res.redirect('/');
  }
  if (!votes[flatNumber] || votes[flatNumber] < 2) {
    res.render('candidates', { 
      flatNumber, 
      candidates,
      message: null, 
      alertClass: null 
    });
  } else {
    res.render('candidates', { 
      flatNumber, 
      candidates,
      message: 'You have reached the maximum number of votes.',
      alertClass: 'alert-danger'
    });
  }
});

// Submit individual vote
app.post('/vote', (req, res) => {
  const { candidateIndex, vote } = req.body;
  const flatNumber = req.session.flatNumber;
  const candidate = candidates[candidateIndex]?.name;

  if (!flatNumber) {
    return res.redirect('/');
  }

  if (!votes[flatNumber]) votes[flatNumber] = 0;

  if (votes[flatNumber] < 2) {
    votes[flatNumber]++;
    if (candidate) {
      if (!voteCount[candidate]) {
        voteCount[candidate] = { yes: 0, no: 0 };
      }
      if (vote === 'yes') {
        voteCount[candidate].yes++;
      } else if (vote === 'no') {
        voteCount[candidate].no++;
      }
    }
    res.redirect(`/thankyou`);
  } else {
    res.render('candidates', {
      candidates,
      flatNumber,
      message: 'You have reached the maximum number of votes.',
      alertClass: 'alert-warning'
    });
  }
});

app.get('/thankyou', (req, res) => {
  res.render('thankyou', {
    message: 'Your vote has been submitted.',
    alertClass: 'alert-success'
  });
});

app.get('/admin-login', (req, res) => {
  res.render('admin-login', { message: null, alertClass: null });
});

app.post('/admin-login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.render('admin-login', { 
      message: 'Incorrect password.',
      alertClass: 'alert-danger' 
    }); 
  }
});

const ensureAdmin = (req, res, next) => {
  if (req.session.isAdmin) {
    next();
  } else {
    res.redirect('/admin-login');
  }
};

app.get('/admin', ensureAdmin, (req, res) => {
  console.log('Vote Count:', voteCount); 
  res.render('admin', { candidates, voteCount });
});

app.get('/change-password', ensureAdmin, (req, res) => {
  res.render('change-password');
});

app.post('/change-password', ensureAdmin, (req, res) => {
  const newPassword = req.body.newPassword;
  ADMIN_PASSWORD = newPassword;
  res.redirect('/admin');
});

app.post('/admin/upload', ensureAdmin, upload.single('candidateImage'), (req, res) => {
  const candidateName = req.body.candidateName;
  const candidatePosition = req.body.candidatePosition;
  const candidateImage = req.file.filename;
  candidates.push({ name: candidateName, position: candidatePosition, image: candidateImage });
  voteCount[candidateName] = { yes: 0, no: 0 };
  res.redirect('/admin');
});

app.post('/admin/delete-candidate', ensureAdmin, (req, res) => {
  const index = req.body.index;
  if (index >= 0 && index < candidates.length) {
    const candidate = candidates.splice(index, 1)[0];
    const filePath = path.join(__dirname, 'public/uploads', candidate.image);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
      }
    });
    delete voteCount[candidate.name];
  }
  res.redirect('/admin');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
