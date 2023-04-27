import ResourceNotFoundError from '../../exceptions/ResourceNotFoundException.js'
import apiKey from '../../middleware/apiKey.js'
import sanitizeBody from '../../middleware/sanitizeBody.js'
import authenticate from '../../middleware/auth.js'
import User from '../../models/User.js'
import logger from '../../startup/logger.js'
import express from 'express'

const log = logger.child({ module: 'authRoutes' })
const router = express.Router()

router.post('/users', sanitizeBody, apiKey, async (req, res, next) => {
  new User(req.sanitizedBody)
    .save()
    .then((newUser) => res.status(201).json(formatResponseData(newUser)))
    .catch(next)
})

router.post('/tokens', sanitizeBody, apiKey, async (req, res) => {
  const { email, password } = req.sanitizedBody
  const user = await User.authenticate(email, password)

  if (!user) {
    return res.status(401).json({
      errors: [
        {
          status: '401',
          title: 'Incorrect username or password.',
        },
      ],
    })
  }
  res
    .status(201)
    .json(
      formatResponseData({ accessToken: user.generateAuthToken() }, 'tokens')
    )
})

router.get('/users/me', authenticate, apiKey, async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json(formatResponseData(user))
})

router.patch(
  '/users/me',
  sanitizeBody,
  authenticate,
  apiKey,
  async (req, res, next) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        req.sanitizedBody,
        {
          new: true,
          runValidators: true,
        }
      )
      if (!user)
        throw new ResourceNotFoundError(
          `We could not find a user with id: ${req.params.id}`
        )
      res.json(formatResponseData(user))
    } catch (err) {
      next(err)
    }
  }
)

/**
 * Format the response data object according to JSON:API v1.0
 * @param {string} type The resource collection name, e.g. 'users'
 * @param {Object} resource An instance object from that collection
 * @returns
 */

function formatResponseData(payload, type = 'users') {
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
