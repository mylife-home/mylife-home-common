'use strict';

const GitHubApi  = require('github');
const async      = require('async');

const user       = 'vincent-tr';
const repoPrefix = 'mylife-home-core-plugins-';

const github = new GitHubApi({ version: '3.0.0' });

module.exports = done => {
  github.repos.getFromUser({ user }, (err, res) => {
    if(err) { return done(err); }

    const localList = [];
    const tasks = [];

    const addCommitLoader = item => {
      return done => {
        return github.repos.getCommits({user, repo: repoPrefix + item.name}, (err, res) => {
          if(err) { return done(err); }
          if(!res.length) { return done(); } // repo without commit ?!
          const commit = res[0]; // lastest first
          item.commit = commit.sha;
          item.date = commit.commit.committer.date;
          return done();
        });
      };
    };

    for(const repo of res) {
      if(!repo.name.startsWith(repoPrefix)) { continue; }

      const item = {
        name        : repo.name.substr(repoPrefix.length),
        description : repo.description
      };

      localList.push(item);
      tasks.push(addCommitLoader(item));
    }

    if(!tasks.length) {
      return done(null, []);
    }

    return async.parallel(tasks, err => {
      if(err) { return done(err); }
      return done(null, localList);
    });
  });
};