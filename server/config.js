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

  userRelation: {
    visible: true,
    seed: 'rum://seed?v=1&e=0&n=0&b=7lrZnYQQS7eb7tv4P7L0KQ&c=7tkCl_mvtQucUiz_1lLNnuVvnlZVkrUbrtcWm42lsBQ&g=GG2YvKjhTGOCwTu3X1_61g&k=AzFxruJHGoC1F44kuYfNymfAL49wrzA1zGhIS6sDJaNa&s=6P9_PLLHJzC7v20LLXTgE18Vf8He5keXV1D5vVm1wfM5GqH84Q6HuMgjUXcsOM709njGpOV1owDuiKd7nk-WpQA&t=FynUTzedhlA&a=relations.dev&y=group_relations&u=http%3A%2F%2F103.61.39.166%3A6090%3Fjwt%3DeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGxvd0dyb3VwcyI6WyIxODZkOThiYy1hOGUxLTRjNjMtODJjMS0zYmI3NWY1ZmZhZDYiXSwiZXhwIjoxODI2Nzc4NTc1LCJuYW1lIjoiYWxsb3ctMTg2ZDk4YmMtYThlMS00YzYzLTgyYzEtM2JiNzVmNWZmYWQ2Iiwicm9sZSI6Im5vZGUifQ.PoKNZAuO-LlrIR9_HjPdh-Fp_UcduaHt5wSXJ32IsdY'
  },
}
