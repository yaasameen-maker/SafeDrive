
require('dotenv').config();
const express = require('express');

const app = express();
const port = process.env.PORT || 3001;

// Now you can access your secret variables like this:
const dbUrl = process.env.DATABASE_URL;
const vinApiKey = process.env.VIN_VALIDATION_API_KEY;
// ... and so on

app.get('/', (req, res) => {
  res.send('Hello from the SafeDrive backend!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
