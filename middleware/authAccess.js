import Person from '../models/Person.js'
import ResourceNotFoundError from '../exceptions/ResourceNotFoundException.js'
import mongoose from 'mongoose'

export default async function authAccess(req, res, next) {
  try {
    await validateId(req.params.id)
    const person = await Person.findById(req.params.id)
    if (
      person.owner.toString() !== req.user._id &&
      person.sharedWith.toString() !== req.user._id
    ) {
      return res.status(403).json({
        errors: [
          {
            status: '403',
            title: 'Forbidden',
            detail: 'You do not have permission to perform this action.',
          },
        ],
      })
    }
    next()
  } catch (err) {
    next(err)
  }
}

const validateId = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    if (await Person.countDocuments({ _id: id })) return true
  }
  throw new ResourceNotFoundError(`We could not find a person with id: ${id}`)
}
