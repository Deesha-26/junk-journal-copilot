const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
app.use(cookieParser());

/*
Anonymous Identity Bootstrap Endpoint
------------------------------------
If user has no cookie:
 - create anonymous token
 - store in secure HttpOnly cookie

If cookie exists:
 - reuse it

This ensures each person/device gets isolated data.
*/
app.get('/api/bootstrap', (req, res) => {
  let token = req.cookies.jj_token;

  if (!token) {
    token = crypto.randomBytes(32).toString('hex');

    res.cookie('jj_token', token, {
      httpOnly: true,
      secure: false,     // set true in production (HTTPS)
      sameSite: 'Lax'
    });
  }

  res.json({ status: 'ok' });
});

app.listen(3001, () => {
  console.log('API running on port 3001');
});
