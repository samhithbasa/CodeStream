const bcrypt = require('bcryptjs');
const hash = "$2b$10$D24UJH/hcKceCk/q7fW.k.Fym/JgljwG30YjJ7UpL/uEs50o0odqa";

// Compare with a candidate password
bcrypt.compare("samhith@111", hash, (err, result) => {
  if (result) {
    console.log("Password matches!");
  } else {
    console.log("Incorrect password");
  }
});