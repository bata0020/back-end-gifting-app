import mongoose from 'mongoose'
import User from './User.js'

const giftSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 4, maxlength: 64 },
  price: { type: Number, min: 100, default: 1000 },
  imageUrl: { type: String, minlength: 1024 },
  store: {
    name: { type: String, maxlength: 254 },
    productURL: { type: String, maxlength: 1024 },
  },
})

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 254 },
    birthDate: { type: Date, required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      default: 'Current user',
    },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    gifts: [giftSchema],
    imageURL: { type: String, maxlength: 1024 },
  },
  {
    timestamps: true,
  }
)

const Model = mongoose.model('Person', schema)

export default Model
