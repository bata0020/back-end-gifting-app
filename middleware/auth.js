import jwt from 'jsonwebtoken'

const jwtSecretKey = '2rbi0fnj2va3pedl8ejnul1tkfxzq9'

function parseToken (headerValue) {
  if (headerValue) {
    const [ type, token ] = headerValue.split(' ')
    if (type === 'Bearer' && typeof token !== 'undefined') {
      return token
    }
  }
  return undefined
}

export default function(req, res, next) {
  const token = parseToken(req.header('Authorization'))
  if (!token) {
    return res.status(401).json({
      errors: [
        {
          status: '401',
          title: 'Authentication failed',
          description: 'Missing bearer token'
        }
      ]
    })
  }
  try {
    const payload = jwt.verify(token, jwtSecretKey)
    req.user = payload.user
    next()
  } catch (err) {
    res.status(400).json({
      errors: [
        {
          status: '400',
          title: 'Validation Error',
          description: 'Invalid bearer token'
        }
      ]
    })
  }
}