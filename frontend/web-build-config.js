// This file ensures _redirects is copied to the build output
module.exports = {
  // Copy static files to build directory
  web: {
    build: {
      babel: {
        include: ['_redirects']
      }
    }
  }
};
