A social product that is built on Quorum.

All data format refer to the [ActivityPub](https://docs.rumsystem.net/docs/data-format-and-examples/).

Live version: [https://feed.base.one](https://feed.base.one/)

## Start frontend service

```
yarn install
yarn dev
```

## Start backend service

Open another terminal window and execute:

```
cd server
cp config.example.js config.js
yarn install
yarn dev
```

## Access service

http://localhost:3000

## How to get Group?

1. Open [Quorum open node](https://node.rumsystem.net/)
2. Login with Github
3. Create a group
4. Open the group
5. Copy the seed
6. Import the seed in [http://localhost:3000/groups](http://localhost:3000/groups) to use

## Want to deploy your own feed?

Come and take a look at this repository, you can deploy it easily, https://github.com/okdaodine/rum-feed-setup