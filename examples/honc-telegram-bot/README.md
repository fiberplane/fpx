## 🪿 Goose telegram bot

This is a HONC app that allows you operate a telegram bot.

### Setup

In telegram, go to the botfather and create a new bot. This will give you an api token.

Set this in the `.dev.vars` file as `TELEGRAM_API_TOKEN`.

Next, you need to set webhook for the bot.

You can do this in the Studio UI!

Add a custom route to the Honc app:

```
POST https://api.telegram.org/:botIdToken/setWebhook
```

Then fill in the url param for `:botIdToken` with the word "bot" concatenated with your api token.

```
botMYAPIKEY
```

Finally, make a post request with the body:

```json
{
  "url": "https://webhonc.mies.workers.dev/_YOUR_WEBHONC_ID/webhook"
}
```

You should be good to go!
