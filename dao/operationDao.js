const mongoose =require("./db.js")
const { Schema } = mongoose
const issueDao=require("./issueDao")
const favorDao=require("./favorDao")
const voteDao=require("./voteDao")
const commentDao=require("./commentDao")

//创建Operation的schema结构
const OperationSchema=new Schema({
    user_id   :{type:Schema.ObjectId , ref: 'User' },
    picture   :{type:Schema.ObjectId , ref: 'Picture'},
    date      :{type:Date,default:Date.now},
    issue     : issueDao.issueSchema,
    favor     : favorDao.favorSchema,
    vote      : voteDao.voteSchema,
    comment   : commentDao.commentSchema,
})

//静态方法
//默认静态方法（如find findOne remove等）不作改变
//1.发布了新的图片
OperationSchema.statics.PictureIssue=function (user_id,pictureId,cb) {
    return this.create({user_id:user_id, picture:pictureId, issue:{}},cb)
}
//2.收藏了新的图片
OperationSchema.statics.PictureFavor=function (user_id,pictureId,folderId,cb) {
    return this.create({user_id:user_id,picture:pictureId,favor:{folder:folderId}},cb)
}
//3.点赞新的图片
OperationSchema.statics.PictureVote=function (user_id,pictureId,cb){
    return this.create({user_id:user_id,picture:pictureId,vote:{}},cb)
}
//4.评论新的图片
OperationSchema.statics.PictureComment=function (user_id,pictureId,content,cb) {
    return this.create({user_id:user_id,picture:pictureId,comment:{content:content}},cb)
}
//5.数目统计（可判断图片是否收藏或点赞==》大于1时）
//operations=>issue/favor/vote/comment
//user_id={}是查找所有users
//operations={}是查找所有动作
OperationSchema.statics.OperationsCount=function (user_id,pictureId,operations,cb) {
    return this.count({$and:[user_id,{picture:pictureId},operations]},cb)
}
//6.遍历某图所有点赞人物(时间倒序)
OperationSchema.statics.UsersOfVote=function(pictureId,cb){
    return this.find({$and:[{picture:pictureId},{vote:{$exists:true}}]},{user_id:1}).sort({date:-1})
    .populate('user_id').exec(cb)
}
//7.遍历某人某收藏夹的所有图片
OperationSchema.statics.PicturesOfFavor=function (user_id,folderId,cb) {
    return this.find({$and:[{user_id: user_id},{'favor.folder':folderId},{favor:{$exists:true}},]},{picture:1})
        .populate('picture').exec(cb)
}
//8.遍历某图所有评论
OperationSchema.statics.CommentsOfPicture=function (pictureId,cb) {
    return this.find({$and:[{picture:pictureId},{comment:{$exists:true}}]},{user_id:1,comment:1,date:1})
    .populate('user_id').sort({date:-1}).exec(cb)
}
//9.删除某收藏夹对应的图片所有收藏操作
OperationSchema.statics.FavorsAllDeleteByFolder=function (folderId,cb) {
    return this.remove({'favor.folder':folderId},cb)
}
//10.删除某张图片对应的所有操作
OperationSchema.statics.OperationsAllDeleteByPicture=function (pictureId,cb) {
    return this.remove({picture:pictureId},cb)
}

// 11. 获取某人发布的所有图片
OperationSchema.statics.getPersonalPictureList = function (user_id, cb) {
	return this.find({
		user_id,
		favor: { $exists: false },
		vote: { $exists: false },
		comment: { $exists: false },
	}, cb)
}

// 12. 获取某张图片的发布者
OperationSchema.statics.getUserOfPicture=function (pictureId,cb) {
    return this.findOne({$and:[{picture: pictureId},{issue:{$exists:true}},]},{user_id:1})
        .populate('user_id').exec(cb)
}

module.exports=mongoose.model('Operation',OperationSchema);