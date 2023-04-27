import logger from '../startup/logger.js'
import ResourceNotFoundError from '../exceptions/ResourceNotFoundException.js'
import apiKey from '../middleware/apiKey.js'
import sanitizeBody from '../middleware/sanitizeBody.js'
import authenticate from '../middleware/auth.js'
import authAccess from '../middleware/authAccess.js'
import Person from '../models/Person.js'
import express from 'express'
import mongoose from 'mongoose'

const log = logger.child({ module: 'giftsRoute' })
const router = express.Router()

router.post(
  '/:id/gifts',
  authenticate,
  sanitizeBody,
  apiKey,
  authAccess,
  async (req, res, next) => {
    const newGift = req.sanitizedBody
    try {
      const person = await Person.findById(req.params.id)
      if (!person)
        throw new ResourceNotFoundError(
          `We could not find a person with id: ${req.params.id}`
        )
      person.gifts.push(newGift)
      await person.save()
      res.status(201).json(formatResponseData(person.gifts.slice(-1), 'gifts'))
    } catch (err) {
      next(err)
    }
  }
)

router.patch(
  '/:id/gifts/:giftId',
  authenticate,
  sanitizeBody,
  apiKey,
  authAccess,
  async (req, res, next) => {
    try {
      const person = await Person.findById(req.params.id)
      if (!person)
        throw new ResourceNotFoundError(
          `We could not find a person with id: ${req.params.id}`
        )
      const gift = person.gifts.id(req.params.giftId)
      if (!gift)
        throw new ResourceNotFoundError(
          `We could not find a gift with id: ${req.params.giftId}`
        )
      gift.name = req.sanitizedBody?.name ?? gift.name
      gift.price = req.sanitizedBody?.price ?? gift.price
      gift.imageUrl = req.sanitizedBody?.imageUrl ?? gift.imageUrl
      gift.store = req.sanitizedBody?.store ?? gift.store
      await person.save()
      res.json(formatResponseData(gift, 'gifts'))
    } catch (err) {
      next(err)
    }
  }
)

router.delete(
  '/:id/gifts/:giftId',
  authenticate,
  apiKey,
  authAccess,
  async (req, res, next) => {
    try {
      const person = await Person.findById(req.params.id)
      if (!person)
        throw new ResourceNotFoundError(
          `We could not find a person with id: ${req.params.id}`
        )
      const gift = person.gifts.id(req.params.giftId)
      if (!gift)
        throw new ResourceNotFoundError(
          `We could not find a gift with id: ${req.params.giftId}`
        )
      gift.remove()
      await person.save()
      res.send(formatResponseData(gift, 'gifts'))
    } catch (err) {
      next(err)
    }
  }
)

/**
 * Format the response data object according to JSON:API v1.0
 * @param {string} type The resource collection name, e.g. 'gifts'
 * @param {Object} resource An instance object from that collection
 * @returns
 */

function formatResponseData(payload, type = 'gifts') {
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

export default router
