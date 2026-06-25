from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.api.routes import router

FRONTEND_URL = "http://127.0.0.1:5175/"

app = FastAPI(title="AI Ads Signal Workbench")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5174",
        "http://localhost:5174",
        "http://127.0.0.1:5175",
        "http://localhost:5175",
        "http://127.0.0.1:5176",
        "http://localhost:5176",
        "http://127.0.0.1:5177",
        "http://localhost:5177",
        "http://127.0.0.1:5178",
        "http://localhost:5178",
    ],
    allow_origin_regex=r"^http://(127\.0\.0\.1|localhost):51\d{2}$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/", response_class=HTMLResponse)
def root() -> str:
    return f"""
    <!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8" />
        <title>Amazon 广告 AI 信号工作台</title>
        <style>
          body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #172a42; }}
          a {{ color: #1f6feb; font-weight: 700; }}
          .hint {{ color: #586b80; }}
        </style>
      </head>
      <body>
        <h1>Amazon 广告 AI 信号工作台后端已启动</h1>
        <p>当前地址是后端 API，不是前端工作台页面。</p>
        <p><a href="{FRONTEND_URL}">打开前端工作台：{FRONTEND_URL}</a></p>
        <p class="hint">健康检查：<a href="/health">/health</a>；接口文档：<a href="/docs">/docs</a></p>
      </body>
    </html>
    """


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-ads-signal-workbench"}
