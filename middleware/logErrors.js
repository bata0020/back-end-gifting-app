import logger from '../startup/logger.js'
const log = logger.child({ module: 'logErrors' })

export default function (err, req, res, next) {
  log.error(err.message)
  next(err)
}
