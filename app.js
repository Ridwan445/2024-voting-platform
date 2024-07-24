const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');

const allowedFlatNumbers = [
  'A1A', 'A1B', 'A2A', 'A2B', 'A3A', 'A3B', 'B1B', 
  'B2A', 'B2B', 'B3A', 'B3B', 'B4A', 'B4B', 'C1A', 
  'C1B', 'C2A', 'C2B', 'C3A', 'C3B', 'C4A', 'C4B', 
  'D1A', 'D1B', 'D2A', 'D2B', 'D3A', 'D3B', 'D4A', 
  'D4B', 'E1A', 'E1B', 'E2A', 'E2B', 'E3A', 'E3B', 
  'E4A', 'E4B', 'F1A', 'F1B', 'F2A', 'F2B', 'F3A', 
  'F3B', 'F4A', 'F4B', 'G1A', 'G1B', 'G2A', 'G2B', 
  'G3A', 'G3B', 'H1A', 'H1B', 'H2A', 'H2B', 'H3A', 
  'H3B', 'I1A', 'I1B', 'I2A', 'I2B', 'I3A', 'I3B', 
  'J1A', 'J1B', 'J2A', 'J2B', 'J3A', 'J3B', 'K1A', 
  'K1B', 'K2A', 'K2B', 'K3A', 'K3B', 'L1A', 'L1B', 
  'L2A', 'L2B', 'L3A', 'L3B', 'M1A', 'M1B', 'M2A', 
  'M2B', 'M3A', 'M3B', 'M4A', 'M4B', 'M5A', 'M5B', 
  'N1A', 'N1B', 'N2A', 'N2B', 'N3A', 'N3B', 'N4A', 
  'N4B', 'N5A', 'N5B', 'O1', 'O2', 'O3', 'O4', 'O5', 
  'O6', 'O7', 'O8', 'O9', 'O10', 'O11', 'O12', 'O13', 
  'O14', 'O15', 'O16', 'P1', 'P2', 'P3', 'P4', 'P5', 
  'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13', 
  'P14', 'P15', 'P16', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 
  'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', 'Q12', 'Q13', 
  'Q14', 'Q15', 'Q16', 'R1A', 'R1B', 'R2A', 'R2B', 
  'R3A', 'R3B', 'R4A', 'R4B', 'R5A', 'R5B'
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

const loadCandidates = () => {
  const candidatesPath = path.join(__dirname, 'candidates.json');
  if (fs.existsSync(candidatesPath)) {
    const rawData = fs.readFileSync(candidatesPath, 'utf-8');
    candidates = JSON.parse(rawData);
  }
};

const saveCandidates = () => {
  const candidatesPath = path.join(__dirname, 'candidates.json');
  fs.writeFileSync(candidatesPath, JSON.stringify(candidates, null, 2), 'utf-8');
};

const loadData = () => {
  const dataPath = path.join(__dirname, 'voteData.json');
  if (fs.existsSync(dataPath)) {
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    voteCount = JSON.parse(rawData);
  }
};

const saveData = () => {
  const dataPath = path.join(__dirname, 'voteData.json');
  fs.writeFileSync(dataPath, JSON.stringify(voteCount, null, 2), 'utf-8');
};

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

app.post('/vote', (req, res) => {
  const flatNumber = req.session.flatNumber;

  if (!flatNumber) {
    return res.redirect('/');
  }

  if (!votes[flatNumber]) votes[flatNumber] = 0;

  if (votes[flatNumber] < 2) {
    votes[flatNumber]++;

    candidates.forEach((candidate, index) => {
      const vote = req.body[`vote${index}`];
      const candidateName = req.body[`candidateName${index}`];

      if (candidateName && (vote === 'yes' || vote === 'no')) {
        if (!voteCount[candidateName]) {
          voteCount[candidateName] = { yes: 0, no: 0 };
        }
        voteCount[candidateName][vote]++;
      }
    });

    console.log('Updated Vote Count:', voteCount);
    saveData();
    res.redirect('/thankyou');
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
  res.render('thankyou');
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
  loadCandidates();
  loadData();
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
  saveCandidates();
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
    saveCandidates();
    saveData();
  }
  res.render('admin', { candidates, voteCount });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  loadCandidates();
  loadData();
  console.log(`Server started on port ${PORT}`);
});
