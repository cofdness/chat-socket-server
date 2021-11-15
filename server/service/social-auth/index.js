import axios from 'axios'
import {
  FACEBOOK_APP_ID, FACEBOOK_APP_SECRET,
  GOOGLE_APP_ID, GOOGLE_APP_SECRET,
  GITHUB_APP_ID, GITHUB_APP_SECRET } from '../../config'
import {client_uri, server_uri} from "../../helper/host";
import * as queryString from "querystring";
import User from "../../models/User";

/*
    Facebook
 */
export const getFacebookCode = (req, res, next) => {
  const stringifiesParams = queryString.stringify({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: `${server_uri}/auth/facebook/callback`,
    scope: ['email'].join(','),
    response_type: 'code',
    display: 'popup'
  })
  res.redirect(`https://www.facebook.com/dialog/oauth?${stringifiesParams}`)
}

const getFacebookAccessToken = async (code) => {
  const { data } = await axios({
    url: 'https://graph.facebook.com/oauth/access_token',
    method: 'get',
    params: {
      client_id: FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      redirect_uri: `${server_uri}/auth/facebook/callback`,
      code
    }
  })
  return data
}

const getFacebookUserData = async (accessToken) => {
  const { data } = await axios({
    url: 'https://graph.facebook.com/me',
    method: 'get',
    params: {
      fields: ['id', 'name', 'email', 'picture'].join(','),
      access_token: accessToken
    }
  })
  return data
}

export const facebookRedirect = () => async ({query}, res, next) => {
  if (query.code) {
    const { access_token } = await getFacebookAccessToken(query.code)
    const FbUser = await getFacebookUserData(access_token)
    FbUser.service = 'facebook'
    FbUser.picture = FbUser.picture.data.url
    const user = await User.createFromService(FbUser)
    const accessToken = await user.getJWTToken()
    res.redirect(`${client_uri}/login/?access_token=${accessToken}`)
  } else {
    next(new Error('something wrong when get google token'))
  }
}

/*
    Google
 */
export const getGoogleCode = (req, res, next) => {
  const stringifiesParams = queryString.stringify({
    client_id: GOOGLE_APP_ID,
    redirect_uri: `${server_uri}/auth/google/callback`,
    scope: 'https://www.googleapis.com/auth/userinfo.email',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  })
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${stringifiesParams}`)
}

const getGoogleAccessToken = async (code) => {
  const { data } = await axios({
    url: `https://oauth2.googleapis.com/token`,
    method: 'post',
    params: {
      client_id: GOOGLE_APP_ID,
      client_secret: GOOGLE_APP_SECRET,
      redirect_uri: `${server_uri}/auth/google/callback`,
      code,
      grant_type: 'authorization_code'
    }
  })
  return data
}

const getGoogleUserData = async (accessToken) => {
  const { data } = await axios ({
    url: 'https://www.googleapis.com/oauth2/v2/userinfo',
    method: 'get',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  return data
}

export const googleRedirect = () => async ({query}, res, next) => {
  if (query.code) {
    const { access_token } = await getGoogleAccessToken(query.code)
    const GgUser = await getGoogleUserData(access_token)
    GgUser.service = 'google'
    const user = await User.createFromService(GgUser)
    const accessToken = await user.getJWTToken()
    res.redirect(`${client_uri}/login/?access_token=${accessToken}`)
  } else {
    next(new Error('something wrong when get github token'))
  }
}

/*
  Github
 */
export const getGithubCode = (req, res, next) => {
  const stringifiesParams = queryString.stringify({
    client_id: GITHUB_APP_ID,
    redirect_uri: `${server_uri}/auth/github/callback`,
    scope: ['read:user', 'user:email'].join(' '),
    allow_signup: true,
  })
  res.redirect(`https://github.com/login/oauth/authorize?${stringifiesParams}`)
}

const getGithubAccessToken = async (code) => {
  const { data } = await axios({
    url: `https://github.com/login/oauth/access_token`,
    method: 'post',
    params: {
      client_id: GITHUB_APP_ID,
      client_secret: GITHUB_APP_SECRET,
      redirect_uri: `${server_uri}/auth/github/callback`,
      code
    },
    headers: {
      Accept: 'application/json'
    }
  })
  return data
}

const getGithubUserData = async (accessToken) => {
  const { data } = await axios ({
    url: 'https://api.github.com/user',
    method: 'get',
    headers: {
      Authorization: `token ${accessToken}`
    }
  })
  return data
}

export const githubRedirect = () => async ({query}, res, next) => {
  if (query.code) {
    const { access_token } = await getGithubAccessToken(query.code)
    const GithubUser = await getGithubUserData(access_token)
    GithubUser.service = 'github'
    GithubUser.picture = GithubUser.avatar_url
    GithubUser.name = GithubUser.login
    const user = await User.createFromService(GithubUser)
    const accessToken = await user.getJWTToken()
    res.redirect(`${client_uri}/login/?access_token=${accessToken}`)
  } else {
    next(new Error('something wrong when get facebook token'))
  }
}
