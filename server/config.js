/* eslint-disable no-unused-vars */
import path from 'path'
import merge from 'lodash/merge'

/* istanbul ignore next */
const requireProcessEnv = (name) => {
  if (!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable')
  }
  return process.env[name]
}

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv-safe')
  dotenv.config({
    path: path.join(__dirname, '../.env'),
    example: path.join(__dirname, '../.env.example')
  })
}

const config = {
  all: {
    env: process.env.NODE_ENV || 'development',
    root: path.join(__dirname, '..'),
    port: process.env.PORT || 3000,
    ip: process.env.IP || 'localhost',
    protocol: process.env.PROTOCOL || 'http',
    client_ip: process.env.CLIENT_IP || 'localhost',
    client_port: process.env.CLIENT_PORT || '4200',
    client_protocol: process.env.CLIENT_PROTOCOL || 'http',
    apiRoot: process.env.API_ROOT || '',
    defaultEmail: 'vtkp2002dn@gmail.com',
    sendgridKey: requireProcessEnv('SENDGRID_KEY'),
    masterKey: requireProcessEnv('MASTER_KEY'),
    jwtSecret: requireProcessEnv('JWT_SECRET'),
    FACEBOOK_APP_ID: requireProcessEnv('FACEBOOK_APP_ID'),
    FACEBOOK_APP_SECRET: requireProcessEnv('FACEBOOK_APP_SECRET'),
    GOOGLE_APP_ID: requireProcessEnv('GOOGLE_APP_ID'),
    GOOGLE_APP_SECRET: requireProcessEnv('GOOGLE_APP_SECRET'),
    mongo: {
      options: {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useCreateIndex: true
      }
    }
  },
  test: { },
  development: {
    mongo: {
      uri: process.env.MONGODB_URI,
      options: {
        debug: true
      }
    }
  },
  production: {
    ip: process.env.IP || undefined,
    port: process.env.PORT || 8080,
    mongo: {
      uri: process.env.MONGODB_URI
    }
  }
}

module.exports = merge(config.all, config[config.all.env])
export default module.exports
