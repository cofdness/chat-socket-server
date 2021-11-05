import { makeExecutableSchema} from "@graphql-tools/schema";
import merge from 'lodash.merge'
import { userTypes, userResolvers } from './users'

const schema = makeExecutableSchema({
  typeDefs: [
    userTypes
  ],
  resolvers: merge(
    userResolvers
  )
  }
)

export default schema
