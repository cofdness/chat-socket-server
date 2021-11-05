import { client_ip, client_port, client_protocol, ip, port, protocol } from '../config'

export const server_uri = `${protocol}://${ip}:${port}`
export const client_uri = `${client_protocol}://${client_ip}:${client_port}`
