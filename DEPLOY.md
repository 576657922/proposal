# 部署到 Cloud Run

静态站(Vite 构建)→ 多阶段 Docker 镜像(node 构建 + nginx 托管)→ Cloud Run。

- 服务名:`proposal`
- 区域:`asia-northeast1`(东京)
- 端口:容器监听 `$PORT`(Cloud Run 注入,默认 8080),由 `nginx/default.conf.template` 通过 envsubst 渲染

## 首次准备

```bash
brew install --cask google-cloud-sdk
gcloud auth login
gcloud config set project <YOUR_PROJECT_ID>
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## 部署

```bash
gcloud run deploy proposal \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 --memory 512Mi \
  --min-instances 0 --max-instances 3
```

源码上传后由 Cloud Build 构建镜像,本地不需要装 Docker。
部署完成会输出 `https://proposal-xxxxx.a.run.app`。

## 绑定自定义域名

```bash
gcloud beta run domain-mappings create \
  --service proposal \
  --domain <your.domain> \
  --region asia-northeast1
```

然后按输出提示在 DNS 服务商处添加记录。
