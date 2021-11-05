import mongoose from 'mongoose'
import {env, mongo} from "../config";

mongoose.Types.ObjectId.prototype.view = function () {
  return { id: this.toString() }
}

const CONNECTION_URL = mongo.uri

main().catch(err => console.log(err))

async function main() {
  if (env === 'development') {
    mongoose.set('debug', true)
  }

  await mongoose.connect(CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
}

mongoose.connection.on('connected', () => {
  console.log('Mongo has connected succesfully')
})
mongoose.connection.on('reconnected', () => {
  console.log('Mongo has reconnected')
})
mongoose.connection.on('error', error => {
  console.log('Mongo connection has an error', error)
  mongoose.disconnect()
})
mongoose.connection.on('disconnected', () => {
  console.log('Mongo connection is disconnected')
})
