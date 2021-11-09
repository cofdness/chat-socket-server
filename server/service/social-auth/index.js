import axios from 'axios'
import {FACEBOOK_APP_ID, FACEBOOK_APP_SECRET} from '../../config'
import {client_uri, server_uri} from "../../helper/host";
import * as queryString from "querystring";
import User from "../../models/User";

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

export const facebook_redirect = () => async ({query}, res, next) => {
  if (query.code) {
    const { access_token } = await getFacebookAccessToken(query.code)
    const FbUser = await getFacebookUserData(access_token)
    FbUser.service = 'facebook'
    FbUser.picture = FbUser.picture.data.url
    const user = await User.createFromService(FbUser)
    const accessToken = await user.getJWTToken()
    res.redirect(`${client_uri}/login/?access_token=${accessToken}`)
  } else {
    next(new Error('something wrong when get facebook token'))
  }

}
