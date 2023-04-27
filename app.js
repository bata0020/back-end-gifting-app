'use strict'

import morgan from 'morgan'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import sanitizeMongo from 'express-mongo-sanitize'
import peopleRouter from './routes/people.js'
import giftRouter from './routes/gifts.js'
import authRouter from './routes/auth/index.js'
import handleError from './middleware/errorHandler.js'
import logErrors from './middleware/logErrors.js'

import connectDatabase from './startup/connectDatabase.js'
connectDatabase()

const app = express()

app.use(cors())
app.use(helmet())
app.use(compression())
app.use(morgan('tiny'))
app.use(express.json())
app.use(sanitizeMongo())

app.use('/auth', authRouter)
app.use('/api/people', peopleRouter)
app.use('/api/people', giftRouter)

app.use(logErrors)
app.use(handleError)

export default app
