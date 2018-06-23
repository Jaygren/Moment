const operationDao = require("../dao/operationDao.js")
const userDao = require("../dao/userDao.js")
const pictureDao=require("../dao/pictureDao.js")
const app = require('express')

module.exports = function () {
    let router = app.Router()

    router.get('/find', (req, res) => {
        operationDao.CommentsOfPicture(req.query.pictureId, (err, result) => {
            res.json(result)
        })
    })

    router.get('/delete', (req, res) => {
        operationDao.remove({ _id: req.query.id }, (err, result) => {
            res.redirect("/commentsList?pictureId=" + req.query.pictureId)
        })
    })

    router.get('/count', (req, res) => {
        operationDao.OperationsCount({}, req.query.pictureId, { comment: { $exists: true } }, (err, result) => {
            res.send({ "result": result })
        })
    })

    router.get('/', (req, res) => {
                operationDao.OperationsCount({ user_id: req.session['user_id'] }, req.query.pictureId,
                    { vote: { $exists: true } }, (err, result) => {
                    operationDao.UsersOfVote(req.query.pictureId, (err, dataCount)=> {
                        pictureDao.findById(req.query.pictureId,(err,picture)=>{
                            operationDao.getUserOfPicture(req.query.pictureId,(err,user)=>{
                                isVote = result
                                voteCount=dataCount
                                res.render("commentsList",
                                    {
                                        pictureId: req.query.pictureId,
                                        username: req.session["username"],
                                        isVote: isVote,
                                        voteCount: voteCount,
                                        picture: picture,
                                        user:user
                                    })
                            })
                        });
                    })
                })
    })

    router.post('/', (req, res) => {
        let user_id = req.session['user_id']
        let pictureId = req.body.pictureId
        let content = req.body.content
        operationDao.PictureComment(user_id, pictureId, content, (err, result) => {
            if (err) {
                res.send({ "result": -1 })
                return
            }
            res.json({ "result": 1 })
        })
    })
    return router
}