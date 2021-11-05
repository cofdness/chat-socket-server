import {access} from "@babel/core/lib/config/validation/option-assertions";
import messages from "../helper/messages";
import { masterKey } from '../config'

export const authType = Object.freeze({'ACL': 0, 'AUTH': 1, 'ID': 2, 'MASTER_KEY': 3})
const isAllowed = (user, roles = []) => {
  if (!user || roles.length === 0) {
    return false
  }
  const rolesAccess = roles.map(role => user.roles.indexOf(role))
  return rolesAccess.every(access => access)
}

/**
 * @param data: array of checked type
 * @param context: graphql context
 */
export const authCheck = (data = [], context) => {
  if (context.error) throw context.error
  data.forEach(item => {
    switch (item.type) {
      case authType.ACL:
        if (!isAllowed(context.user, item.roles)) {
          throw new Error(messages.MESSAGE_YOU_DONT_HAVE_REQUIRED_PERMISSIONS)
        }
        break

      case authType.AUTH:
        if (!context.isAuthenticated) {
          throw new Error(messages.MESSAGE_UNAUTHORIZED)
        }
        break
      case authType.ID:
        if(!context.user) {
          throw new Error(messages.MESSAGE_INVALID_USER)
        }
        break
      case authType.MASTER_KEY:
        if (context.masterKey !== masterKey) {
          throw new Error(messages.MESSAGE_YOU_DONT_HAVE_REQUIRED_PERMISSIONS)
        }
        break
      default:
        break
    }
  })
}
