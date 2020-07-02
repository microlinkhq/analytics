<div align="center">
  <img src="https://cdn.microlink.io/logo/banner.png" alt="microlink oss">
</div>

[![Deploy with Vercel](https://zeit.co/button)](https://vercel.com/new/project?template=https://github.com/microlinkhq/oss)

> Microservice to retrieve your CloudFlare Analytics.

It converts your CloudFlare Analytics information

![](https://i.imgur.com/iH0vyim.png)

to be retrieve in a programmatic way, so you can consume them as JSON payload for anywhere.

# Environment Variables

### ZONE_ID

*Required*</br>
Type: `string`

The zone identifier associated with your domain.

### X_AUTH_EMAIL

*Required*</br>
Type: `string`

The email associated with your CloudFlare account.

### X_AUTH_KEY

*Required*</br>
Type: `string`

The authorization token associated with your CloudFlare account.

### REQ_TIMEOUT

Type: `number`<br>
Default: 8000

It specifies how much time after consider a request as timeout, in milliseconds.

### HISTORY_MONTHS

Type: `number`<br>
Default: 3

It specifies how much time since the current timestamp should be retrieved from data.

### MAX_CACHE

Type: `number`<br>
Default: 43200 (12h)

It specifies how much time a response can be cached, in milliseconds.

## License

**oss** © [microlink.io](https://microlink.io), released under the [MIT](https://github.com/microlinkhq/oss/blob/master/LICENSE.md) License.<br>
Authored and maintained by microlink.io with help from [contributors](https://github.com/microlinkhq/oss/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlink.io](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
