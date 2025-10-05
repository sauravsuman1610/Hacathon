const path = require('path');

module.exports = {
  // ... existing config ...
  resolve: {
    fallback: {
      "fs": false,
      "path": false,
      "os": false
    }
  }
};
