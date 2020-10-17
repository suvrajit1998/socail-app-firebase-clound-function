const { admin, db } = require('./admin')

module.exports = (req, res, next) => {
  let idToken
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    idToken = req.headers.authorization.split('Bearer ')[1]
  } else {
    console.log('No Token Found')
    return res.status(403).json({ error: 'Unautorized' })
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken
      return db
        .collection('users')
        .where('userId', '==', req.user.uid)
        .limit(1)
        .get()
    })
    .then((data) => {
      req.user.handle = data.docs[0].data().handle
      req.user.imageUrl = data.docs[0].data().imageUrl
      return next()
    })
    .catch((ex) => {
      console.log('Error While verifing token', ex)
      return res.status(403).json(ex)
    })
}
