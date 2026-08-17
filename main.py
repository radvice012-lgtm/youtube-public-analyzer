
import os,re
from urllib.parse import urlparse,parse_qs
import httpx
from fastapi import FastAPI,HTTPException,Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

INSTANCE=os.getenv("INVIDIOUS_INSTANCE","https://inv.nadeko.net").rstrip("/")
app=FastAPI(title="YouTube Public Analyzer")
app.mount("/static",StaticFiles(directory="static"),name="static")
templates=Jinja2Templates(directory="templates")

async def api(path,params=None):
    async with httpx.AsyncClient(timeout=30,follow_redirects=True) as c:
        r=await c.get(f"{INSTANCE}/api/v1/{path}",params=params or {})
    if r.status_code!=200: raise HTTPException(502,f"Backend returned HTTP {r.status_code}. Change INVIDIOUS_INSTANCE.")
    return r.json()

def parse_url(v):
    if not re.match(r"^https?://",v): v="https://"+v
    u=urlparse(v); host=u.netloc.lower().replace("www.",""); path=u.path.strip("/")
    if host=="youtu.be": return "video",path.split("/")[0]
    q=parse_qs(u.query); parts=path.split("/")
    if path=="watch" and q.get("v"): return "video",q["v"][0]
    if parts[0] in {"shorts","live","embed"} and len(parts)>1: return "video",parts[1]
    if parts[0].startswith("@"): return "handle",parts[0][1:]
    if parts[0]=="channel" and len(parts)>1: return "channel",parts[1]
    raise HTTPException(400,"Use a YouTube video URL or channel URL.")

@app.get("/",response_class=HTMLResponse)
async def home(request:Request):
    return templates.TemplateResponse("dashboard.html",{"request":request,"instance":INSTANCE})

@app.post("/api/analyze")
async def analyze(payload:dict):
    raw=(payload.get("url") or "").strip()
    if not raw: raise HTTPException(400,"Paste a YouTube URL.")
    kind,ident=parse_url(raw)
    if kind=="video":
        data=await api(f"videos/{ident}")
        return {"mode":"video","video":data,"limitations":[
            "No Google Cloud API key is required.",
            "Private watch time, audience retention and YouTube Analytics are not public."
        ]}
    if kind=="handle":
        resolved=await api("resolveurl",{"q":f"https://www.youtube.com/@{ident}"})
        ident=resolved.get("ucid")
        if not ident: raise HTTPException(404,"Channel handle could not be resolved.")
    data=await api(f"channels/{ident}/videos",{"sort_by":"newest"})
    return {"mode":"channel","videos":data.get("videos",[]),"continuation":data.get("continuation"),
            "channel_id":ident,"limitations":[
                "No Google Cloud API key is required.",
                "Public Invidious instances can be rate-limited or unavailable.",
                "Private watch time, audience retention and YouTube Analytics are not public."
            ]}
