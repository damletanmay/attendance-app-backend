const express = require("express");
const mongoose = require('mongoose');
const body = require('body-parser');
require('dotenv').config();
const app = express();
// for getting user values. (body-parser)
app.use(body.urlencoded({ extended: true }));


//Cookie and session.
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-find-or-create');

// setting up session
app.use(session({
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: true,
  //cookies are not set to secure because of localhost
}));


// passport
app.use(passport.initialize());
app.use(passport.session());


//mongoose settings
mongoose.set('useCreateIndex', true);
mongoose.connect('mongodb://localhost/attendanceDB', {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("We are Connected To DataBase");
});


// user Schema for storing users.
const userSchema = new mongoose.Schema({
  username: String,
  password:String,
  type:String,
});
// plugins
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);


// from module passport-local-mongoose
passport.use(User.createStrategy()); // creating Strategy

//serializeUser means to add a cookie & vice versa
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

var isLoggedIn = false;

// routes

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// student register
app.post('/sregister',(req,res)=>{
  if (req.body.password.length > 8 && req.body.password === req.body.cpassword){
    User.register({
      username: req.body.username,
      type:'student',
    }, req.body.password, function(err, user) {
      if (err) {
        console.log(err);
        res.redirect('/sregister');
      } else {
          passport.authenticate('local')(req, res, function() {
          isLoggedIn = true;
          res.redirect('/dashboard');
        });
      }
    });
  }
  else{
    res.redirect('/sregister');
  }
 
});

// student login
app.post('/slogin',(req,res)=>{
  const user = new User({
    email: req.body.username,
    password: req.body.password,
    type:'student'
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
      res.redirect('/tlogin');
    } else {
      //from video
      passport.authenticate('local')(req, res, function() {
        isLoggedIn = true;
        res.redirect('/dashboard');
      });
    };
  });
});

// teacher registration
app.post('/tregister',(req,res)=>{
  if (req.body.password.length > 8 && req.body.password === req.body.cpassword){
    User.register({
      username: req.body.username,
      type:'teacher',
    }, req.body.password, function(err, user) {
      if (err) {
        console.log(err);
        res.redirect('/tregister');
      } else {
          passport.authenticate('local')(req, res, function() {
            console.log('Student Logged In.');
            isLoggedIn = true;
            res.redirect('/dashboard');
        });
      }
    });
  }
  else{
    res.redirect('/tregister');
  }
 
});

// teacher login
app.post('/tlogin',(req,res)=>{
  const user = new User({
    email: req.body.username,
    password: req.body.password,
    type:'teacher'
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
      res.redirect('/tlogin');
    } else {
        passport.authenticate('local')(req, res, function() {
        console.log('Teacher Logged In.');
        isLoggedIn = true;
        res.redirect('/dashboard');
      });
    };
  });
});

app.get("/authenticationStatus",function(req,res){
  isLoggedIn = req.isAuthenticated;
  res.send({'authenticationStatus':isLoggedIn});
});

// all logout
app.post("/logout", function(req, res) {
  if(req.isAuthenticated()){
    console.log("Logged Out")
    req.logout();
    res.redirect('/');
  }
  res.send("User Not Logged In.");

})

const PORT = process.env.PORT || 4000;
app.listen(PORT, console.log(`Server started on port ${PORT}`));
