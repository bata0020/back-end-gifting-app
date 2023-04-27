import logger from '../startup/logger.js'
import ResourceNotFoundError from '../exceptions/ResourceNotFoundException.js'
import apiKey from '../middleware/apiKey.js'
import sanitizeBody from '../middleware/sanitizeBody.js'
import authenticate from '../middleware/auth.js'
import authAccess from '../middleware/authAccess.js'
import Person from '../models/Person.js'
import User from '../models/User.js'
import express from 'express'
import mongoose from 'mongoose'

const log = logger.child({ module: 'peopleRoutes' })
const router = express.Router()

router.get('/', authenticate, apiKey, async (req, res) => {
  const user = await User.findById(req.user._id)
  const people = await Person.find({
    $or: [{ owner: user }, { sharedWith: user }],
  }).select('-gifts')
  res.json(formatResponseData(people))
})

router.post('/', authenticate, sanitizeBody, async (req, res, next) => {
  const { createdAt, updatedAt, ...attributes } = req.sanitizedBody
  const newPerson = new Person(attributes)
  try {
    await newPerson.save()
    res.status(201).json(formatResponseData(newPerson))
  } catch (err) {
    next(err)
  }
})

router.get('/:id', authenticate, apiKey, authAccess, async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id)
      .populate('owner')
      .populate('sharedWith')
    if (!person)
      throw new ResourceNotFoundError(
        `We could not find a person with id: ${req.params.id}`
      )
    res.json(formatResponseData(person))
  } catch (err) {
    next(err)
  }
})

const update =
  (overwrite = false) =>
  async (req, res, next) => {
    try {
      const person = await Person.findByIdAndUpdate(
        req.params.id,
        req.sanitizedBody,
        {
          new: true,
          overwrite,
          runValidators: true,
        }
      )
      if (!person) throw new Error('Resource not found')
      res.json(formatResponseData(person))
    } catch (err) {
      next(err)
    }
  }

router.put('/:id', authenticate, apiKey, sanitizeBody, authAccess, update(true))
router.patch(
  '/:id',
  authenticate,
  apiKey,
  sanitizeBody,
  authAccess,
  update(false)
)

router.delete('/:id', authenticate, apiKey, async (req, res, next) => {
  try {
    await validateId(req.params.id)
    const person = await Person.findById(req.params.id)
    if (!person)
      throw new ResourceNotFoundError(
        `We could not find a person with id: ${req.params.id}`
      )
    if (person.owner.toString() !== req.user._id) {
      return res.status(403).json({
        errors: [
          {
            status: '403',
            title: 'Forbidden',
            detail: 'You do not have permission to delete.',
          },
        ],
      })
    }
    await Person.findByIdAndRemove(req.params.id)
    res.json(formatResponseData(person))
  } catch (err) {
    next(err)
  }
})

/**
 * Format the response data object according to JSON:API v1.0
 * @param {string} type The resource collection name, e.g. 'people'
 * @param {Object} resource An instance object from that collection
 * @returns
 */

function formatResponseData(payload, type = 'people') {
  if (payload instanceof Array) {
    return { data: payload.map((resource) => format(resource)) }
  } else {
    return { data: format(payload) }
  }

  function format(resource) {
    const { _id, ...attributes } = resource.toJSON
      ? resource.toJSON()
      : resource
    return { type, id: _id, attributes }
  }
}

const validateId = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    if (await Person.countDocuments({ _id: id })) return true
  }
  throw new ResourceNotFoundError(`We could not find a person with id: ${id}`)
}

export default router
