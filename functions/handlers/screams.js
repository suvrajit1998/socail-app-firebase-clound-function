const { db } = require('../util/admin')

exports.getAllScreams = (req, res) => {
  db.collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
      let screams = []
      data.forEach((doc) => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount,
          userImage: doc.data().userImage,
        })
      })
      return res.json(screams)
    })
    .catch((ex) => console.error(ex))
}

exports.postOneScreams = (req, res) => {
  if (req.body.body.trim() === '') {
    return res.status(400).json({ body: 'body must not be empty' })
  }
  const newScream = {
    body: req.body.body,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  }

  db.collection('screams')
    .add(newScream)
    .then((doc) => {
      const resScream = newScream
      resScream.screamId = doc.id
      res.json(resScream)
    })
    .catch((ex) => {
      res.status(500).json({ error: 'something went wrong' })
      console.error(ex)
    })
}

exports.getScream = (req, res) => {
  let screamData = {}
  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Scream not found' })
      }
      screamData = doc.data()
      screamData.screamId = doc.id
      return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('screamId', '==', req.params.screamId)
        .get()
    })
    .then((data) => {
      screamData.comments = []
      data.forEach((doc) => {
        screamData.comments.push(doc.data())
      })
      return res.json(screamData)
    })
    .catch((ex) => {
      console.error(ex)
      res.status(500).json({ error: ex.code })
    })
}

//Comment on a Scream
exports.commentOnScream = (req, res) => {
  if (req.body.body.trim() === '')
    return res.status(400).json({ comment: 'Must not be empty!' })

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    screamId: req.params.screamId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
  }

  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Scream not found' })
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 })
    })
    .then(() => {
      return db.collection('comments').add(newComment)
    })
    .then(() => {
      res.json(newComment)
    })
    .catch((ex) => {
      console.error(ex)
      return res.status(500).json({ error: 'Something went wrong!' })
    })
}

//like on a Scream
exports.likeScream = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('screamId', '==', req.params.screamId)
    .limit(1)

  const screamDocument = db.doc(`/screams/${req.params.screamId}`)

  let screamData

  screamDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        screamData = doc.data()
        screamData.screamId = doc.id
        return likeDocument.get()
      } else {
        return res.status(404).json({ error: 'Scream not found!' })
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection('likes')
          .add({
            screamId: req.params.screamId,
            userHandle: req.user.handle,
          })
          .then(() => {
            screamData.likeCount++
            return screamDocument.update({ likeCount: screamData.likeCount })
          })
          .then(() => {
            return res.json(screamData)
          })
      } else {
        return res.status(400).json({ error: 'scream already liked' })
      }
    })
    .catch((ex) => {
      console.error(ex)
      return res.status(500).json({ error: ex.code })
    })
}

//unlike on a Scream
exports.unlikeScream = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('screamId', '==', req.params.screamId)
    .limit(1)

  const screamDocument = db.doc(`/screams/${req.params.screamId}`)

  let screamData

  screamDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        screamData = doc.data()
        screamData.screamId = doc.id
        return likeDocument.get()
      } else {
        return res.status(404).json({ error: 'Scream not found!' })
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: 'scream already liked' })
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            screamData.likeCount--
            return screamDocument.update({ likeCount: screamData.likeCount })
          })
          .then(() => {
            return res.json(screamData)
          })
      }
    })
    .catch((ex) => {
      console.error(ex)
      return res.status(500).json({ error: ex.code })
    })
}

//Delete a Scream

exports.deleteScream = (req, res) => {
  const document = db.doc(`/screams/${req.params.screamId}`)

  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Scream not found' })
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: 'Unauthorize' })
      } else {
        return document.delete()
      }
    })
    .then(() => {
      return res.json({ message: 'Scream deleted successfully!' })
    })
    .catch((ex) => {
      console.error(ex)
      return res.status(500).json({ error: ex.code })
    })
}
