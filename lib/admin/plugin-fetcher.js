'use strict';

const GitHubApi  = require('github');
const async      = require('async');

const org        = 'mylife-home';
const repoPrefix = 'mylife-home-core-plugins-';

const github     = new GitHubApi({ version: '3.0.0' });

exports.all = done => {
  github.repos.getForOrg({ org }, (err, res) => {
    if(err) { return done(err); }

    const localList = [];
    const tasks = [];

    const addCommitLoader = item => {
      return done => {
        return github.repos.getCommits({ owner: org, repo: repoPrefix + item.name }, (err, res) => {
          if(err) { return done(err); }
          if(!res.data.length) { return done(); } // repo without commit ?!
          const commit = res.data[0]; // lastest first
          item.commit = commit.sha;
          item.date = commit.commit.committer.date;
          return done();
        });
      };
    };

    for(const repo of res.data) {
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

// if no commit, get the last commit
exports.one = (name, commit, done) => {
  const repo  = repoPrefix + name;
  const tasks = {
    repo : cb => github.repos.get({ owner: org, repo }, cb)
  };
  if(commit) {
    tasks.commit = cb => github.repos.getCommit({ owner: org, repo, sha: commit }, cb);
  } else {
    tasks.commits = cb => github.repos.getCommits({ owner: org, repo }, cb);
  }

  return async.parallel(tasks, (err, res) => {
    if(err) { return done(err); }
    const repo   = res.repo.data;
    const commit = res.commit ? res.commit.data : res.commits.data[0]; // lastest first
    return done(null, {
      name        : repo.name.substr(repoPrefix.length),
      description : repo.description,
      commit      : commit.sha,
      date        : commit.commit.committer.date
    });
  });
}