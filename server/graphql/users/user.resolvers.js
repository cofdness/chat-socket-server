import pubsub from "../../utils/pubsub";
import userSchema, {roles, schema} from "../../models/User";
import {Schema} from "bodymen";
import { authCheck, authType } from "../../middlewares/auth-check";
import jwt from 'jsonwebtoken'
import { jwtSecret } from '../../config'

const event = {
  newUserEvent: 'new_user_event'
}
const userType = {
  admin: 'admin',
  support: 'support',
  customer: 'customer'
}

const userResolvers = {
  Query: {
    user: async (parent, args, context, info) => {
      authCheck([{type: authType.AUTH}], context)
      if (args.id) {
        try{
          const user = await userSchema.findById(args.id)
          return user.view(true)
        } catch (err) {
          throw err
        }
      } else {
        return context.user.view(true)
      }

    },
    users: (parent, args, context, info) => {
      authCheck([{type: authType.AUTH}], context)
      return userSchema.find()
    }

  },
  Mutation: {
    login: async (parent, { input }, context, info) => {
      const tempUser = new Schema({ email: schema.tree.email, password: schema.tree.password})
      const {email, password} = input

      tempUser.validate({ email, password}, err => {
        if (err) throw err
      })
      const user = await userSchema.findOne({email})
      try {
        let authUser = await user.authenticate(password)
        if (authUser) {
          const token = await user.getJWTToken()
          const view = user.view(true)
          view.accessToken = {token: token}
          return view
        } else {
          throw new Error('wrong password')
        }

      } catch (err) {
        throw err
      }

    },
    createUser: async (root, { input }, context, info) => {
      if (input.role === userType.admin ) {
        // we need master key to create role admin
        authCheck([{type: authType.MASTER_KEY}], context)
      }
      try {
        const user = await userSchema.create(input)
        const token = jwt.sign(user.id, jwtSecret)
        await pubsub.publish(event.newUserEvent, {newUser: {token, user}})
        const view = user.view(true)
        view.accessToken = {token: token}
        return view

      } catch (err) {
        throw new Error('something wrong when create user')
      }
    },
    updateUserPassword: async (root, { input }, context, info) => {
      authCheck([{type: authType.AUTH}], context)
      try {
        const updateUser = await userSchema.findOne({email: input.email})
        if (updateUser.id !== context.user.id) {
          throw new Error('You can\'t change other user\'s data')
        }
        const finishUpdateUser = await Object.assign(updateUser, input).save()
        return  finishUpdateUser.view(true)

      } catch (err) {
        throw new Error('Wrong input provided')
      }
    },
    deleteUser: async (root, { input }, context, info) => {
      console.log(input)
    }

  }
}
export default userResolvers
