'use strict';

exports.promiseToCallback = (promise, done) => {
  promise.then(
    data => done(null, data),
    err => done(err));
};