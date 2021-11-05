
import UserModel, { roles } from '../models/User.js';
import {sign} from "../service/jwt";

const userController = {
  onGetAllUsers: async ({querymen: {query, select, cursor}}, res, next) => {
    try {
      const users = await UserModel.find(query, select, cursor).populate('friends');
      res.status(200).json(users.map(user => user.view(true)))
      return null
    } catch (error) {
      next(error)
    }
  },
  onGetUserById: async ({params}, res, next) => {
    try {
      const user = await UserModel.findById(params.id).populate('friends');
      res.status(200).json(user.view(true))
      return null
    } catch (error) {
      next(error)
    }
  },
  onCreateUser: async ({ bodymen: { body } }, res, next) =>
  {
    try {
      const user = await UserModel.create(body)
      const token = await sign(user.id)
      res.status(201).json({token, user: user.view(true)})
      return null
    } catch (err) {
      if (err.name === 'MongoServerError' && err.code === 11000) {
            res.status(409).json({
              valid: false,
              param: 'email',
              message: 'email already registered'
            })
          } else {
            next(err)
          }
    }
  },
  onShowMe: async ({ user }, res) => {
    res.json(user)
  },
  onUpdateUser: async ({ bodymen: { body }, params, user }, res, next) => {
    UserModel.findByIdAndUpdate()
  },
  onDeleteUserById: async ({params}, res, next) => {
    try {
      const user = await UserModel.findById(params.id);
      await user.remove()
      res.status(204).json({message: `Deleted a count of ${user.deletedCount} user.`})
      return null
    } catch (error) {
      next(error)
    }
  },
}

export default userController
