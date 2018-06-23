const mongoose = require("./db.js")
const { Schema } = mongoose

//创建Picture的schema结构
const PictureSchema = new Schema({
    title: { type: String },
    path: { type: String },
    date: { type: Date, default:Date.now },
    tag: { type: String, default: "" },
    abstract: { type: String, default: "" },
})

//静态方法
//1.根据图片_id修改图片描述
PictureSchema.statics.AbstractUpdate=function(pictureId,update,cb){
    return this.update({_id:pictureId},{"$set":{abstract:update}},cb)
}
//2.根据tag和abstract实现模糊查询
PictureSchema.statics.FindByTagNAbstract=function(like,cb){
    return this.find({ $or: [{ title: { $regex: like } }, { tag: { $regex: like } }, { abstract: { $regex: like } }] })
        .sort({ date: -1 }).exec(cb)
}
//3.遍历所有图片
PictureSchema.statics.Pictures = function (cb) {
    return this.find(cb)
}
// 4.删除某个图片
PictureSchema.statics.removePicture = function (_id, cb) {
	return this.remove({ _id }, cb)
}

// 5.获取最新的前n个图片
PictureSchema.statics.getLatestPictures = function (num, cb) {
    return this.find({})
        .sort({ date: -1 })
        .limit(num).exec(cb)
}

module.exports=mongoose.model('Picture',PictureSchema);

