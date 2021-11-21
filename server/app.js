import http from "http";
import https from "https"
import * as fs from "fs";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import {errorHandler as queryErrorHandler} from 'querymen'
import {errorHandler as bodyErrorHandler} from 'bodymen'
import {server_uri} from "./helper/host";

// mongo connection
import "./mongo";

// routes
// we switch to graphql, so we not use legacy route any more
// import indexRouter from "./routes/index.js";
// import userRouter from "./routes/user.js";
// import chatRoomRouter from "./routes/chatRoom.js";
// import deleteRouter from "./routes/delete.js";

// middlewares
import authGraphql from "./middlewares/auth-graphql";

// config
import { ip, port, env } from './config'

//express-graphql
import {graphqlHTTP} from "express-graphql";
import {useServer} from "graphql-ws/lib/use/ws";
import schema from './graphql'

//facebook
import {facebookRedirect, getGithubCode, getGoogleCode, githubRedirect, googleRedirect} from "./service/social-auth";
import { getFacebookCode } from "./service/social-auth";

const { execute, subscribe } = require('graphql')
const ws = require('ws')

const app = express();



/** Get port from environment and store in Express. */
app.set("port", port);

app.use(cors())
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(queryErrorHandler())
app.use(bodyErrorHandler())


//facebook auth
app.get('/auth/facebook', getFacebookCode)
app.get('/auth/facebook/callback', facebookRedirect())
app.get('/auth/google', getGoogleCode)
app.get('/auth/google/callback', googleRedirect())
app.get('/auth/github', getGithubCode)
app.get('/auth/github/callback', githubRedirect())

//graphql
app.use('/graphql', authGraphql , graphqlHTTP(req => ({
  schema: schema,
  graphiql: true,
  context: {
    isAuthenticated: req.isAuthenticated,
    user: req.user,
    error: req.error,
    masterKey: req.masterKey
  },
  customFormatErrorFn: (err) => {
    if (!err.originalError) {
      return err
    }
    /*
        You can add the following to any resolver
        const error = new Error('My message')
        error.data = [...]
        error.code = 001
    */
    const message = err.message || 'An error occured.'
    const code = err.originalError.code
    const data = err.originalError.data
    return {
      // ...err,
      message,
      code,
      data
    }
  }

})))

// app.use("/", indexRouter);
// app.use("/users", userRouter);
// app.use("/room", decode, chatRoomRouter);
// app.use("/delete", deleteRouter);

/** Create HTTP server. We need https for development */
function createHttpServer(app){
  if (env === 'development') {
    const sslkey = fs.readFileSync('./www/keys/ssl-key.pem')
    const sslcert = fs.readFileSync('./www/keys/ssl-cert.pem')
    const option = {
      key: sslkey,
      cert: sslcert
    }
    return https.createServer(option, app)
  } else {
    return http.createServer(app)
  }

}

const server = createHttpServer(app)
// const server = http.createServer(app)

/** Create socket connection */
// we switch to graphql subscriptions
// global.io = new Server(server, {
//   cors: {
//     origin: '*',
//     method: ['GET', 'POST']
//   }
// })
// global.io.on('connection', WebSockets.connection)


server.listen({ ip, port }, () => {
  const path = '/subscriptions'
  const wsServer = new ws.Server({
    server,
    path
  });

  useServer(
    {
      schema,
      execute,
      subscribe,
      onConnect: (ctx) => {
        console.log('Connect');
      },
      onSubscribe: (ctx, msg) => {
        console.log('Subscribe');
      },
      onNext: (ctx, msg, args, result) => {
        console.debug('Next');
      },
      onError: (ctx, msg, errors) => {
        console.error('Error');
      },
      onComplete: (ctx, msg) => {
        console.log('Complete');
      },
    },
    wsServer
  );
  console.log(`Listening on server: ${server_uri}`)
  console.log(`GraphQL endpoint: ${server_uri}/graphql`)
  console.log(`GraphQL subscription: ${server_uri}/subscriptions`)
})
