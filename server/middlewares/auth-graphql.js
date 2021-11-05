import { ExtractJwt } from 'passport-jwt'
import jwt from 'jsonwebtoken'
import { jwtSecret, masterKey } from '../config'
import userSchema from '../models/User'

const authGraphql = async (req, res, next) => {
  req.isAuthenticated = false
  const authorizationHeader = req.headers.authorization
  if (!authorizationHeader) {
    // login request and unauthorized resource go here
    return next()
  }
  const token = ExtractJwt.fromAuthHeaderAsBearerToken('Bearer')(req)
  try {
    if (token === masterKey) {
      req.isAuthenticated = true
      req.masterKey = token
      return next()
    } else {
      const userID = await jwt.verify(token, jwtSecret)
      const user = await userSchema.findById(userID)
      if (user) {
        req.isAuthenticated = true
        req.user = user
        return next()
      } else {
        req.error = new Error('Authenticate error')
        req.error.code = 401
        return next()
      }
    }

  } catch (error) {
    req.error = new Error('Authenticate error')
    req.error.code = 401
    return next()
  }


}
export default authGraphql
