基于 [Rum](https://github.com/rumsystem/quorum) 实现的社交产品

所有的功能实现参考 Quorum 官方推荐的 [ActivityPub](https://docs.rumsystem.net/docs/data-format-and-examples/) 格式。

live 版本：https://feed.base.one

## 启动前端服务

```
yarn install
yarn dev
```

## 启动后端服务

另外起一个终端界面，执行：

```
cd server
yarn install
yarn dev
```

## 访问服务

http://localhost:3000

## 如何获取 Group ？

1. 打开 [Quorum open node](https://node.rumsystem.net/)
2. 使用 Github 登录
3. 创建一个 group
4. 打开 group
5. 复制 seed
6. http://localhost:3000/groups 中导入 seed 即可使用

## 反馈和交流

可以直接提 [Issues](https://github.com/okdaodine/rum-feed/issues)

## 想自己部署一个 feed ？

可以来看看这个仓库，一键就可以部署 feed，https://github.com/okdaodine/rum-feed-setup