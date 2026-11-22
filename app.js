const express = require('express');
const path = require('path');
const { formatServerTime } = require('./lib/server-time');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index', { serverTime: formatServerTime(new Date()) });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`appdemo em http://localhost:${port}`));
}

module.exports = app;
