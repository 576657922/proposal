# 部署到 Cloud Run

静态站(Vite 构建)→ 多阶段 Docker 镜像(node 构建 + nginx 托管)→ Cloud Run。

- 项目:`proposal-507409`
- 服务名:`proposal`
- 区域:`asia-northeast1`(东京)
- 线上地址:https://proposal-903490316046.asia-northeast1.run.app
- 端口:容器监听 `$PORT`(Cloud Run 注入,默认 8080),由 `nginx/default.conf.template` 通过 envsubst 渲染

## 自动部署

push 到 `main` 会触发 Cloud Build(触发器 `proposal-main-deploy`),
按 `cloudbuild.yaml` 构建镜像、推到 Artifact Registry、部署新修订版本。

查看构建记录:

```bash
gcloud builds list --region=asia-northeast1 --limit=5
gcloud builds log <BUILD_ID> --region=asia-northeast1
```

## 手动部署

需要绕过 CI 时:

```bash
gcloud run deploy proposal \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 --memory 512Mi \
  --min-instances 0 --max-instances 3
```

## 回滚

```bash
gcloud run revisions list --service=proposal --region=asia-northeast1
gcloud run services update-traffic proposal \
  --region=asia-northeast1 \
  --to-revisions=<REVISION>=100
```

## 绑定自定义域名

买到域名后:

```bash
gcloud beta run domain-mappings create \
  --service proposal \
  --domain <your.domain> \
  --region asia-northeast1
```

按输出提示在 DNS 服务商处添加记录。映射和证书本身免费。

## 首次环境准备(换机器时)

```bash
brew install --cask google-cloud-sdk
gcloud auth login
gcloud config set project proposal-507409
```
