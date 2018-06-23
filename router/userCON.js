const { Router } = require('express')
const userDao = require('../dao/userDao')
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage })

module.exports = function () {
	const router = Router()
	router.post('/createUser', (req, res) => {
		const { username, password, confirm } = req.body
		if (password !== confirm) {
			res.send('<script>alert("两次输入的密码不一样!")history.back()</script>')
		}
		userDao.createUser(username, password, (err, user) => {
			if (err) {
				res.send('<script>alert("用户已存在，注册失败！")history.back()</script>')
				return
			}

			res.redirect('/')

		})
	})

	router.post('/login', (req, res) => {
		const { username, password } = req.body
		userDao.findUserByUsername(username, (err, user) => {
			if (err || !user) {
				res.send('<script>alert("用户不存在！")history.back()</script>')
				return
			}
			if (user.password !== password) {
				res.send('<script>alert("密码错误，登录失败！")history.back()</script>')
				return
			}
			req.session.regenerate((err) => {
				if (err) res.send({ result: -1 })
				const { username, _id: user_id } = user
				Object.assign(req.session, { username, user_id })
				res.redirect('/')
			})
		})
	})

	router.get('/logout',(req,res)=>{
		req.session.destroy();
		res.redirect('/')
	})

	router.post('/avatar', upload.single('avatar'), (req, res) => {
		const { password, sex, phone } = (req.body)
		if (req.file) {
			const base64Url = req.file.buffer.toString('base64')
			var formattedUrl = 'data:' + req.file.mimetype + ';base64,' + base64Url
		}
		userDao.findUserById(req.session.user_id, (err, user) => {
			if (err || !user) return res.send({ result: -1 })
			if (req.file) {
				user.avatar = formattedUrl
			}
			if (password && password != "") {
				user.password = password
			}
			user.sex = sex
			user.phone = phone
			user.save(err => {
				if (err) return res.send({ result: -1 })
				res.redirect('/user/personalCenter');
			})
		})
	})

	router.get('/avatar', (req, res) => {
		userDao.findUserById(req.session.user_id, (err, user) => {
			if (err) return res.send({isLogin: !!req.session["user_id"] })
			res.send({
				username:user.username,
				avatar: user.avatar, 
				isLogin: !!req.session["user_id"]
			})
		})
	})

	router.get('/personalCenter', (req, res) => {
		if(!!req.session.user_id)
		userDao.findById(req.session.user_id,(err,user)=>{
			res.render("personalCenter", {user:user})	
		})
		else
		res.redirect("/")
	})

	return router
}