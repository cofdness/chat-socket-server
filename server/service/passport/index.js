import passport from 'passport'
import { Schema } from 'bodymen'
import { BasicStrategy } from 'passport-http'
import { Strategy as BearerStrategy } from 'passport-http-bearer'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import { jwtSecret, masterKey } from '../../config'
import User, { schema } from '../../models/User'
import {GraphQLLocalStrategy} from "graphql-passport";
import FacebookStrategy from 'passport-facebook'
import {FACEBOOK_APP_ID, FACEBOOK_APP_SECRET,} from '../../config'
import {getFacebookAccessToken, getFacebookUserData} from "../social-auth";
import {client_uri, server_uri} from "../../helper/host";

export const password = () => (req, res, next) =>
  passport.authenticate('password', { session: false }, (err, user, info) => {
    if (err && err.param) {
      return res.status(400).json(err)
    } else if (err || !user) {
      return res.status(401).end()
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) return res.status(401).end()
      next()
    })
  })(req, res, next)

export const token = ({ required, roles = User.roles } = {}) => (req, res, next) =>
  passport.authenticate('token', { session: false }, (err, user, info) => {
    if (err || (required && !user) || (required && !~roles.indexOf(user.role))) {
      return res.status(401).end()
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) return res.status(401).end()
      next()
    })
  })(req, res, next)

export const graphql_auth = () => passport.authenticate('graphql')

export const master = () => passport.authenticate('master', {session: false})

export const facebook = () => passport.authenticate('facebook', {session: false, scope:['email']})

passport.use('password', new BasicStrategy((email, password, done) => {
  const userSchema = new Schema({ email: schema.tree.email, password: schema.tree.password })

  userSchema.validate({ email, password }, (err) => {
    if (err) done(err)
  })

  User.findOne({ email }).then((user) => {
    if (!user) {
      done(true)
      return null
    }
    return user.authenticate(password, user.password).then((user) => {
      done(null, user)
      return null
    }).catch(done)
  })
}))

passport.use('master', new BearerStrategy((token, done) => {
  if (token === masterKey) {
    done(null, {})
  } else {
    done(null, false)
  }
}))

passport.use('token', new JwtStrategy({
  secretOrKey: jwtSecret,
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromUrlQueryParameter('access_token'),
    ExtractJwt.fromBodyField('access_token'),
    ExtractJwt.fromAuthHeaderWithScheme('Bearer')
  ])
}, ({ id }, done) => {
  User.findById(id).then((user) => {
    done(null, user)
    return null
  }).catch(done)
}))

passport.use('graphql', new GraphQLLocalStrategy(( email, pw, done ) => {
    const userSchema = new Schema({ email: schema.tree.email, password: schema.tree.password})
    userSchema.validate({ email, pw}, err => {
      if (err) done(err)
    })
    User.findOne({ email }).then ((user) => {
      if (!user) {
        done(new Error('no matching user'))
        return null
      } else {
        return user.authenticate(pw, user.password).then((user) => {
          done(null, user)
          return null
        }).catch(done)
      }

    })
}))

passport.use(new FacebookStrategy({
  clientID: FACEBOOK_APP_ID,
  clientSecret: FACEBOOK_APP_SECRET,
  callbackURL: `${server_uri}/auth/facebook/callback`,
  profileFields: ['id', 'email', 'name', 'picture']
}, ()=>{}))
