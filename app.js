const form=document.getElementById("form"), url=document.getElementById("url"), results=document.getElementById("results"), status=document.getElementById("status");
const fmt=n=>n==null?"—":new Intl.NumberFormat().format(n);
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function pills(xs){return (xs||[]).map(x=>`<span class="pill">${esc(x[0]??x)}</span>`).join("")||"—"}
form.addEventListener("submit",async e=>{
 e.preventDefault(); results.innerHTML=""; status.textContent="Analyzing…";
 try{
  const r=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:url.value})});
  const d=await r.json(); if(!r.ok) throw new Error(d.detail||"Request failed");
  status.textContent="";
  if(d.mode==="video") renderVideo(d); else renderChannel(d);
 }catch(err){status.innerHTML=`<div class="error">${esc(err.message)}</div>`}
});
function renderVideo(d){
 const v=d.video;
 results.innerHTML=`
 <div class="card channel"><img src="${v.thumbnail||""}"><div><h2>${esc(v.title)}</h2><div class="muted">Channel: ${esc(d.channel.title)}</div></div></div>
 <div class="grid">
  <div class="card"><div class="metric">${fmt(v.views)}</div><div class="muted">Views</div></div>
  <div class="card"><div class="metric">${fmt(v.likes)}</div><div class="muted">Likes</div></div>
  <div class="card"><div class="metric">${fmt(v.comments)}</div><div class="muted">Comments</div></div>
  <div class="card"><div class="metric">${esc(v.duration)}</div><div class="muted">Duration</div></div>
  <div class="card"><div class="metric">${esc(v.caption_available?"Yes":"No")}</div><div class="muted">Caption track available</div></div>
  <div class="card"><div class="metric">${esc(v.upload_time_utc||"—")}</div><div class="muted">Upload time (UTC)</div></div>
 </div>
 <div class="card video"><img src="${v.thumbnail||""}"><div><h3>Public metadata</h3><p>Published: ${esc(v.published_at)}</p><p>Views/day: ${fmt(v.views_per_day)}</p><p>Engagement rate: ${v.engagement_rate}%</p><p>Hashtags: ${pills(v.hashtags)}</p><p>Tags: ${pills(v.tags)}</p><p><a href="${esc(v.url)}" target="_blank">Open on YouTube</a></p></div></div>
 <div class="card"><h3>Important limitation</h3><p>${d.limitations.map(esc).join("<br>")}</p></div>`;
}
function renderChannel(d){
 const c=d.channel,s=d.summary;
 const rows=d.videos.map(v=>`<tr><td><img src="${v.thumbnail||""}" style="width:120px;border-radius:7px"></td><td><a href="${v.url}" target="_blank">${esc(v.title)}</a></td><td>${fmt(v.views)}</td><td>${esc(v.duration)}</td><td>${esc(v.published_at)}</td><td>${v.engagement_rate}%</td></tr>`).join("");
 results.innerHTML=`
 <div class="card channel"><img src="${c.thumbnail||""}"><div><h2>${esc(c.title)}</h2><div class="muted">${fmt(c.subscriber_count)} subscribers · ${fmt(c.video_count)} public videos</div></div></div>
 <div class="grid">
  <div class="card"><div class="metric">${fmt(d.analyzed_count)}</div><div class="muted">Videos analyzed</div></div>
  <div class="card"><div class="metric">${fmt(s.average_views)}</div><div class="muted">Average views</div></div>
  <div class="card"><div class="metric">${fmt(s.median_views)}</div><div class="muted">Median views</div></div>
  <div class="card"><div class="metric">${esc(s.average_duration)}</div><div class="muted">Average duration</div></div>
  <div class="card"><div class="metric">${esc(s.most_common_upload_day||"—")}</div><div class="muted">Most common upload day</div></div>
  <div class="card"><div class="metric">${esc(s.most_common_upload_time_utc||"—")}</div><div class="muted">Most common upload time (UTC)</div></div>
 </div>
 <div class="card"><h3>Top hashtags</h3>${pills(s.top_hashtags)}</div>
 <div class="card"><h3>Top tags</h3>${pills(s.top_tags)}</div>
 <div class="card"><h3>Videos</h3><div style="overflow:auto"><table><thead><tr><th>Thumbnail</th><th>Title</th><th>Views</th><th>Length</th><th>Published</th><th>Engagement</th></tr></thead><tbody>${rows}</tbody></table></div></div>
 <div class="card"><h3>Public-data limitations</h3><p>${d.limitations.map(esc).join("<br>")}</p></div>`;
}
