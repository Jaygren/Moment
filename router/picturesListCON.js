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
					res.send({ result: newPicture })
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

	// 获取图片详情
	router.get('/getPicDetail', (req, res) => {
		const { id } = req.query
		pictureDao.findOne({ _id: id }, (err, picture) => {
			if (err) {
				console.log(err)
				return res.send({ result: -1 })
			}

			res.send({ result: picture })

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

	// 获取最新的图片
	router.get('/getLatestPics', (req, res) => {

		// TODO:预留做分页
		const { page } = req.query

		// 最新的图片数量
		const numOfpics = 10

		operationDao.getLatestPictures(numOfpics, async (err, operations) => {
			if (err) {
				console.log(err)
				return res.send({ result: -1 })
			}

			operations = await Promise.all(operations.map(operation => {
				return operation
					.populate({
						path: 'picture'
					})
					.execPopulate()
			}))

			const pictures = operations.map(operation => {
				return operation.picture
			})

			res.send({ result: pictures })

		})


	})

	router.get('/:acton', (req, res) => {
		let folder_id = req.query.folder_id;
		switch (req.params.acton) {
			case "Trending-Pic":
				let isLogin = !!req.session["user_id"];
				res.render("picturesList", { isLogin: isLogin });
				break;
			case "GetTrending-Pic":
				pictureDao.Pictures((err, data) => {
					(function iterator(i) {
						if (i === data.length) {
							res.json(data);
							return;
						}
						operationDao.OperationsCount({ user_id: req.session['user_id'] }, data[i]._id,
							{ vote: { $exists: true } }, (err, result1) => {
								operationDao.OperationsCount({ user_id: req.session['user_id'] }, data[i]._id,
									{ favor: { $exists: true } }, (err, result2) => {
										operationDao.UsersOfVote(data[i]._id, (err, dataCount) => {
											//平凑json字符串
											data[i]._doc.voteCount = dataCount.length;
											data[i]._doc.isVote = result1;
											data[i]._doc.isFavor = result2;
											iterator(i + 1);
										});
									});
							});
					})(0);
				});
				break;
			case "PicInFolder":
				res.render("picturesListInFolder", {
					folder_id: folder_id,
				});
				break;
			case "GetPicInFolder":
				operationDao.PicturesOfFavor(req.session["user_id"], folder_id, (err, result) => {
					//console.log(result);
					res.json(result);
				});
				break;
			case "FavorFolders":
				res.render("favorsList");
				break;
			case "GetFavorFolders":
				userDao.findUFoldersById(req.session["user_id"], (err, result) => {
					// console.log(result.folders);
					res.json(result.folders);
				});
				break;
			case "searchPicture":
				pictureDao.FindByTagNAbstract(req.query.keyword, (err, data) => {
					if (!data || data.length === 0) {
						res.json(false);
						return;
					}
					(function iterator(i) {
						if (i === data.length) {
							res.json(data);
							return;
						}
						operationDao.OperationsCount({ user_id: req.session['user_id'] }, data[i]._id,
							{ vote: { $exists: true } }, (err, result1) => {
								operationDao.OperationsCount({ user_id: req.session['user_id'] }, data[i]._id,
									{ favor: { $exists: true } }, (err, result2) => {
										operationDao.UsersOfVote(data[i]._id, (err, dataCount) => {
											//拼凑json字符串
											data[i]._doc.voteCount = dataCount.length;
											data[i]._doc.isVote = result1;
											data[i]._doc.isFavor = result2;
											iterator(i + 1);
										});
									});
							});
					})(0);
				});
				break;
			default:
				break;
		}
	});

	return router;
};

