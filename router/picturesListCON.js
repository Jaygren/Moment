const app = require('express');
const pictureDao = require("../dao/pictureDao");
const operationDao = require("../dao/operationDao.js");
const userDao = require("../dao/userDao.js");
const folderDao = require('../dao/folderDao')
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage })

module.exports = function () {
	let router = app.Router();

	// 上传图片
	router.post('/uploadPic', upload.single('picture'), (req, res) => {

		const { title, abstract } = req.body

		const base64Url = req.file.buffer.toString('base64')
		const formattedUrl = 'data:' + req.file.mimetype + ';base64,' + base64Url

		const Picture = pictureDao
		const newPicture = new Picture({
			title, abstract, path: formattedUrl
		})

		newPicture.save(err => {
			if (err) return res.send({ result: -1 })
			operationDao.PictureIssue(req.session.user_id, newPicture._id,
				(err) => {
					if (err) return res.send({ result: -1 })
					res.send({ result: 1 })
				}
			)
		})
	})

	// 删除图片
	router.delete('/removePic', (req, res) => {
		const { id } = req.query
		pictureDao.removePicture(id, (err) => {
			if (err) {
				console.log(err)
				return res.send({ result: -1 })
			}

			operationDao.OperationsAllDeleteByPicture(id, (err) => {
				if (err) {
					console.log(err)
					return res.send({ result: -1 })
				}

				res.send({ result: 1 })

			})

		})

	})

	// 更新图片描述
	router.post('/updatePicAbstract', (req, res) => {
		const { abstract, id } = req.body
		
		pictureDao.AbstractUpdate(id, abstract, (err) => {
			if (err) {
				console.log(err)
				return res.send({ result: -1 })
			}

			res.send({ result: 1 })
		})
	})

	// 获取个人的图片列表
	router.get('/getPicList', (req, res) => {

		const { user_id: id } = req.session

		operationDao.getPersonalPictureList(id, (err, operations) => {
			if (err) {
				console.log(err)
				return res.send({ result: -1 })
			}

			const pictureList = operations.map(operation => {
				return operation.picture
			})

			res.send({ result: pictureList })
		})
	})
           
    router.get('/getPicInFolder',(req,res)=>{
        operationDao.PicturesOfFavor(req.session["user_id"],req.query.folderId,(err,result)=>{
            res.json(result)
        })
    })

    router.get('/favorFolders',(req,res)=>{
        res.render("favorsList");
    })

    router.get('/getFavorFolders',(req,res)=>{
        userDao.findUFoldersById(req.session["user_id"],(err,result)=>{
            res.json(result.folders)
        })
	})
	
	router.get('/trendingPic',(req,res)=>{
        res.render("trendingPic")
    })

    router.get('/getTrendingPic',(req,res)=>{
        pictureDao.Pictures((err,data)=>{
            (function iterator(i) {
                if(i===data.length){
					res.json(data.sort((x,y)=>{//根据点赞数倒序
						return y._doc.voteCount-x._doc.voteCount
					}))
                    return
                }
                operationDao.OperationsCount({user_id:req.session['user_id']},data[i]._id,
                    {vote:{$exists:true}}, (err,result1)=>{
                        operationDao.OperationsCount({user_id:req.session['user_id']},data[i]._id,
                            {favor:{$exists:true}}, (err,result2)=>{
                                operationDao.UsersOfVote(data[i]._id, (err, dataCount) =>{
                                    data[i]._doc.voteCount=dataCount.length
                                    data[i]._doc.isVote=result1
                                    data[i]._doc.isFavor=result2
                                iterator(i+1)
                                })
                            })
                        })
            })(0)
        })
    })
	
	//搜索
	router.get('/searchPicture',(req,res)=>{
        pictureDao.FindByTagNAbstract(req.query.keyword,(err, data) => {
            if(!data||data.length===0){
                res.json(false)
                return
            }
            (function iterator(i) {
                if (i === data.length) {
                    res.json(data)
                    return
                }
                operationDao.OperationsCount({ user_id: req.session['user_id'] }, data[i]._id,
                    { vote: { $exists: true } }, (err, result1) => {
                        operationDao.OperationsCount({ user_id: req.session['user_id'] }, data[i]._id,
                            { favor: { $exists: true } }, (err, result2) => {
                                operationDao.UsersOfVote(data[i]._id, (err, dataCount) => {
                                    data[i]._doc.voteCount = dataCount.length
                                    data[i]._doc.isVote = result1
                                    data[i]._doc.isFavor = result2
                                    iterator(i + 1)
                                })
                            })
                    })
            })(0)
        })
	})
	
    router.get('/picInFolder',(req,res)=>{
        res.render("picturesListInFolder",{
            folderId: req.query.folderId
        })
	})

    router.get('/freshNew',(req,res)=>{
        res.render("freshNew")
	})
	
	// 获取最新的图片
	router.get('/getFreshNew', (req, res) => {

		// TODO:预留做分页
		const { page } = req.query

		// 最新的图片数量
		const numOfpics = 20

		pictureDao.getLatestPictures(numOfpics,async (err, pictures) => {
			if (err) {
				console.log(err)
				return res.send({ result: -1 })
			}
		
			// operations = await Promise.all(operations.map(operation => {
			// 	return operation
			// 		.populate({
			// 			path: 'picture',select: ['_id', 'title','path']
			// 		})
			// 		.execPopulate()
			// }))

			pictures =  await Promise.all(pictures.map(async picture => {
				let isFavor=await operationDao.OperationsCount(
					{user_id:req.session['user_id']},
					picture._id,
					{favor:{$exists:true}})

				let isVote=await operationDao.OperationsCount(
					{user_id:req.session['user_id']},
					picture._id,
					{vote:{$exists:true}})
			
				let voteCount=await operationDao.OperationsCount(
					{},
					picture._id,
					{vote:{$exists:true}})

				picture._doc.isFavor=isFavor
				picture._doc.isFavor=isVote
				picture._doc.voteCount=voteCount		
				
				return picture
			}))

			res.json(pictures)
		})
	})

	router.get('/pictureManage',(req,res)=>{
        res.render("pictureManage");
    })

	/**
	 *  TODO:发现页面、今日排行页面预留
	 *  Router：/rank /getRank /discover /getDiscover
	 */

    router.get('/rank',(req,res)=>{
        res.render("rank")
    })

    router.get('/getRank',(req,res)=>{

	})
	
	router.get('/discover',(req,res)=>{
        res.render("discover")
    })

    router.get('/getDiscover',(req,res)=>{

	})
	
	return router;
};
