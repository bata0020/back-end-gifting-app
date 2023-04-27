export default function (req, res, next) {
  const header = req.header('x-api-key')

  if (!header) {
    return res.status(401).send({
      errors: [
        {
          status: '401',
          title: 'Authentication failed',
          description: 'Missing your API key',
        },
      ],
    })
  }
  next()
}
