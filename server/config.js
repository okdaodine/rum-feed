module.exports = {
  database: {
    host: "dev-postgres.prsdev.club",
    port: '58000',
    database: "feed",
    user: "postgres",
    password: "48ac0d2661bb5b8644fdcc",
    dialect: "postgres"
  },

  polling: {
    limit: 200,
    maxIndexingUnloadedGroup: 3,
  },

  origin: 'http://localhost:3000',

  serverOrigin: 'http://localhost:9000',

  repo: 'https://github.com/okdaodine/rum-feed'
}
