module.exports = {
  database: {
    host: "127.0.0.1",
    port: '5432',
    database: "rumfeed",
    user: "postgres",
    password: "123456",
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

  group: 'rum://seed?v=1&e=0&n=0&b=rV0BHainSOyPn4ALarNslQ&c=rA5oYZk9NyEbfSimSWS9-EqXshEJE3rsPEM8JuiBd50&g=O9tIb7edRA6yRP8wLFdhtQ&k=A-iBaohTwHyfZE7B1HPXB5ebL7CvzE6IjHO03O5--CnO&s=mTg9XikPRfv9ZdUZFXk7wnaq7y-8e7PICY6zSxBILIYwKRguFvhkZ3-Ul-_jeW90Azo4cxwgJlmydVr6dus3wAE&t=Fzp2dd1QSRQ&a=my_test_group&y=group_timeline&u=http%3A%2F%2F127.0.0.1%3A8002%3Fjwt%3DeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGxvd0dyb3VwcyI6WyIzYmRiNDg2Zi1iNzlkLTQ0MGUtYjI0NC1mZjMwMmM1NzYxYjUiXSwiZXhwIjoxODMxNDYwNDYwLCJuYW1lIjoiYWxsb3ctM2JkYjQ4NmYtYjc5ZC00NDBlLWIyNDQtZmYzMDJjNTc2MWI1Iiwicm9sZSI6Im5vZGUifQ.hSn0L4sCrZUhcs6cgdPo3w4R1GxjcRFv1HK9Mrozt1Q',

  repo: 'https://github.com/okdaodine/rum-feed'
}
