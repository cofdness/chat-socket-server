import axios from 'axios'
import {FACEBOOK_APP_ID, FACEBOOK_APP_SECRET} from '../../config'
import {server_uri} from "../../helper/host";

export const getFacebookAccessToken = async (code) => {
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

export const getFacebookUserData = async (accessToken) => {
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
