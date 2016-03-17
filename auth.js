'use strict';
module.exports = function(app) {
  var auth = {};
  auth.passport = require('passport');
  var session = require('express-session');

  app.use(session({
    secret: 'concur-labs',
    resave: true,
    saveUninitialized: true
  }));
  app.use(auth.passport.initialize());
  app.use(auth.passport.session());

  var ConcurStrategy = require('passport-concur').Strategy;

  auth.passport.use(new ConcurStrategy({
      clientID: process.env.CONCUR_CLIENT_ID,
      clientSecret: process.env.CONCUR_CLIENT_SECRET,
      callbackURL: process.env.HOST_URL + '/auth/callback'
    },
    function(accessToken, refreshToken, instanceURL, expirationDate, done) {
      return done(null, {
        accessToken: accessToken
      });
    }
  ));

  auth.passport.serializeUser(function(user, done) {
    done(null, user.accessToken);
  });

  auth.passport.deserializeUser(function(accessToken, done) {
    done(null, {
      accessToken: accessToken
    });
  });

  auth.ensureAuthenticated = function(req, res, next) {
    console.log('Authenticated? ' + req.isAuthenticated());
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/auth/login');
  };

  return auth;
};
