const express = require('express');

const accounts = JSON.parse(process.env.ACCOUNTS);
console.log(`${accounts.length} accounts registered`)

var app = express();
app.listen(process.env.PORT, function() {});