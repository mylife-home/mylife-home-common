'use strict';

const os     = require('os');
const rpt    = require('read-package-tree');
const semver = require('semver');
const log4js = require('log4js');
const logger = log4js.getLogger('admin.SysInfo');

let rootDirectory;
let packages;

function getCpus() {
  const map = new Map();
  for(const cpu of os.cpus()) {
    const key = JSON.stringify([ cpu.model, cpu.speed ]);
    let value = map.get(key);
    value || map.set(key, (value = { model : cpu.model, speed: cpu.speed, count: 0 }));
    ++value.count;
  }
  return Array.from(map.values());
}

function processNode(packages, node) {
  if(packages.get(node.id)) { return; }

  const info = {
    name    : node.package.name,
    version : node.package.version
  };

  if(node.id === 0) {
    info.main = true;
  }

  packages.set(node.id, info);

  for(const dep of Object.keys(node.package.dependencies || {})) {
    const version = node.package.dependencies[dep];
    const child   = findDependency(node, dep, version);

    if(!child) {
      logger.error(`Package not found: ${dep}@${version}`)
      continue;
    }

    processNode(packages, child);
  }
}

function findDependency(node, name, version) {

  const match = n => {
    if(n.package.name !== name) { return false; }
    if(!semver.valid(version)) { return true; } // github:user/package for example
    return semver.satisfies(n.package.version, version);
  }

  // look in node's children, going through parent
  while(node) {
    if(match(node)) { return node; }

    for(const child of node.children) {
      if(match(child)) { return child; }
    }

    node = node.parent;
  }
}

function getPackages(done) {
  if(!rootDirectory) {
    return done(new Error('rootDirectory not set'));
  }

  if(packages) {
    return done(null, packages);
  }

  rpt(rootDirectory, () => true, (err, data) => { // TODO: path
    if(err) { return done(err); }

      const map = new Map();
      processNode(map, data);

      packages = Array.from(map.values());
      return done(null, packages);
  });
}

module.exports.getInfo = done => getPackages((err, packages) => {
  if(err) { return done(err); }

  return done(null, {
    'os.arch'              : os.arch(),
    'os.cpus'              : getCpus(),
    'os.freemem'           : os.freemem(),
    'os.loadavg'           : os.loadavg(),
    'os.platform'          : os.platform(),
    'os.release'           : os.release(),
    'os.totalmem'          : os.totalmem(),
    'os.type'              : os.type(),
    'os.uptime'            : os.uptime(),
    'process.version'      : process.version,
    'process.cpuUsage'     : process.cpuUsage(),
    'process.uptime'       : process.uptime(),
    'mylife.rootDirectory' : rootDirectory,
    'mylife.packages'      : packages
  });
});

module.exports.setup = config => { rootDirectory = config.rootDirectory; }
