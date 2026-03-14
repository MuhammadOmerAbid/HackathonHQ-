"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "../../../utils/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import PostCard   from "../../../components/community/PostCard";
import ComposeBox from "../../../components/community/ComposeBox";

function Comment({ c, currentUser, onLike, onDelete, depth=0 }) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [replies,  setReplies]  = useState(c.replies||[]);
  const liked = c.liked_by?.includes(currentUser?.id);
  const isMe  = c.author?.id===currentUser?.id;

  const ago=(d)=>{if(!d)return"";const s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return"just now";if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`;};

  const postReply = async (payload) => {
    const r=await axios.post("/posts/",{...payload,parent:c.id});
    const full=await axios.get(`/posts/${r.data.id}/?expand=author`).catch(()=>r);
    setReplies(prev=>[...prev,full.data]); setReplying(false);
  };

  return (
    <div className={`cmt${depth>0?` cmt-d${Math.min(depth,3)}`:""}`}>
      <div className="cmt-card">
        <div className="cmt-left">
          <div className="cmt-avi" onClick={()=>router.push(`/users/${c.author?.id}`)}>{c.author?.username?.[0]?.toUpperCase()||"?"}</div>
          {(replies.length>0||replying) && <div className="cmt-line"/>}
        </div>
        <div className="cmt-body">
          <div className="cmt-hd">
            <span className="cmt-name" onClick={()=>router.push(`/users/${c.author?.id}`)}>{c.author?.username||"Unknown"}</span>
            {c.author?.is_staff && <span className="cmt-admin">Admin</span>}
            <span className="cmt-sep">·</span>
            <span className="cmt-ts">{ago(c.created_at)}</span>
            {isMe && <button className="cmt-del" onClick={()=>onDelete?.(c.id)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>}
          </div>
          <p className="cmt-txt">{c.content}</p>
          <div className="cmt-acts">
            <button className={`cmt-act cmt-like${liked?" on":""}`} onClick={()=>onLike?.(c.id)}>
              <svg viewBox="0 0 24 24" fill={liked?"currentColor":"none"} stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span>{c.likes_count||0}</span>
            </button>
            {currentUser && depth<2 && (
              <button className="cmt-act cmt-reply" onClick={()=>setReplying(r=>!r)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>Reply</span>
              </button>
            )}
          </div>
          {replying && currentUser && (
            <div className="cmt-compose"><ComposeBox user={currentUser} events={[]} onPost={postReply} onClose={()=>setReplying(false)} replyTo={c}/></div>
          )}
        </div>
      </div>
      {replies.length>0 && <div className="cmt-replies">{replies.map(r=><Comment key={r.id} c={r} currentUser={currentUser} onLike={onLike} onDelete={onDelete} depth={depth+1}/>)}</div>}
      <style jsx>{`
        .cmt{border-bottom:1px solid #1e1e24}.cmt:last-child{border-bottom:none}
        .cmt-d1{padding-left:36px;background:rgba(255,255,255,.006)}.cmt-d2{padding-left:60px}.cmt-d3{padding-left:80px}
        .cmt-card{display:flex;gap:10px;padding:12px 18px 9px}
        .cmt-left{display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:30px;gap:5px}
        .cmt-avi{width:30px;height:30px;border-radius:50%;background:rgba(110,231,183,.08);border:1px solid rgba(110,231,183,.15);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;color:#6EE7B7;cursor:pointer;flex-shrink:0;transition:all .12s}.cmt-avi:hover{background:rgba(110,231,183,.17)}
        .cmt-line{width:2px;flex:1;min-height:8px;background:#1e1e24;border-radius:1px}
        .cmt-body{flex:1;min-width:0}
        .cmt-hd{display:flex;align-items:center;gap:5px;margin-bottom:3px;flex-wrap:wrap}
        .cmt-name{font-size:13px;font-weight:700;color:#f0f0f3;cursor:pointer;transition:color .12s}.cmt-name:hover{color:#6EE7B7}
        .cmt-admin{padding:1px 5px;border-radius:100px;font-size:9px;font-weight:700;background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid rgba(251,191,36,.2)}
        .cmt-sep{color:#3a3a48;font-size:10px}.cmt-ts{font-size:11.5px;color:#5c5c6e}
        .cmt-del{margin-left:auto;background:transparent;border:none;color:#3a3a48;cursor:pointer;display:flex;align-items:center;transition:color .12s;padding:0}.cmt-del:hover{color:#f87171}
        .cmt-txt{font-size:13.5px;color:#a0a0b0;line-height:1.65;margin:0 0 7px;white-space:pre-wrap;word-break:break-word;font-family:'DM Sans',sans-serif}
        .cmt-acts{display:flex;gap:1px;margin-left:-6px}
        .cmt-act{display:inline-flex;align-items:center;gap:4px;padding:4px 7px;border:none;background:transparent;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;border-radius:6px;transition:all .12s;color:#5c5c6e}
        .cmt-act:hover{background:rgba(255,255,255,.04)}
        .cmt-like:hover,.cmt-like.on{color:#f87171}.cmt-reply:hover{color:#60a5fa}
        .cmt-compose{margin-top:8px;background:#17171b;border-radius:10px;overflow:hidden;border:1px solid #1e1e24}
        .cmt-replies{}
      `}</style>
    </div>
  );
}

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post,    setPost]    = useState(null);
  const [comments,setComments]= useState([]);
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [events,  setEvents]  = useState([]);

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pR,uR,cR,eR] = await Promise.all([
        axios.get(`/posts/${id}/?expand=author,event,winners`),
        axios.get("/users/me/").catch(()=>null),
        axios.get(`/posts/${id}/comments/?expand=author&ordering=created_at`).catch(()=>({data:[]})),
        axios.get("/events/").catch(()=>({data:[]})),
      ]);
      setPost(pR.data); setUser(uR?.data||null);
      setComments(cR.data.results||cR.data||[]);
      setEvents(eR.data.results||eR.data||[]);
    }catch(e){console.error(e);}
    finally{setLoading(false);}
  };

  const handleReply = async (payload) => {
    const r=await axios.post("/posts/",{...payload,parent:parseInt(id)});
    const full=await axios.get(`/posts/${r.data.id}/?expand=author`).catch(()=>r);
    setComments(c=>[...c,full.data]);
    setPost(p=>({...p,comments_count:(p.comments_count||0)+1}));
  };

  const handleLike = async (pid) => {
    if (!user) return;
    const isPost = pid===post?.id;
    try {
      await axios.post(`/posts/${pid}/like/`);
      const toggle=(obj)=>{const on=obj.liked_by?.includes(user.id);return{...obj,likes_count:on?(obj.likes_count||1)-1:(obj.likes_count||0)+1,liked_by:on?(obj.liked_by||[]).filter(i=>i!==user.id):[...(obj.liked_by||[]),user.id]};};
      if(isPost) setPost(p=>toggle(p)); else setComments(cs=>cs.map(c=>c.id===pid?toggle(c):c));
    }catch(e){console.error(e);}
  };

  const handleDelComment = async (cid) => {
    if(!confirm("Delete reply?"))return;
    try{await axios.delete(`/posts/${cid}/`);setComments(cs=>cs.filter(c=>c.id!==cid));}catch(e){console.error(e);}
  };

  const handleDelPost = async (pid) => {
    if(!confirm("Delete this post?"))return;
    try{await axios.delete(`/posts/${pid}/`);router.push("/community");}catch(e){console.error(e);}
  };

  if (loading) return <LoadingSpinner message="Loading post…"/>;
  if (!post) return (
    <div className="pd-404">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <h2>Post not found</h2>
      <button className="evd-back-btn" onClick={()=>router.push("/community")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Community
      </button>
      <style jsx>{`.pd-404{text-align:center;padding:80px 20px;color:#5c5c6e;font-family:'DM Sans',sans-serif;display:flex;flex-direction:column;align-items:center;gap:12px}.pd-404 svg{color:#3a3a48}.pd-404 h2{font-family:'Syne',sans-serif;font-size:22px;color:#f0f0f3;margin:0}`}</style>
    </div>
  );

  return (
    <div className="pd">
      <button className="evd-back-btn" onClick={()=>router.push("/community")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Community
      </button>
      <div className="pd-post"><PostCard post={post} currentUser={user} onLike={handleLike} onDelete={handleDelPost} compact={false}/></div>
      {user && <div className="pd-compose"><ComposeBox user={user} events={events} onPost={handleReply} replyTo={post}/></div>}
      <div className="pd-comments">
        <div className="pd-ch"><span className="pd-ch-label">Replies</span><span className="pd-ch-count">{comments.length}</span></div>
        {comments.length===0
          ? <div className="pd-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>No replies yet — start the conversation!</div>
          : comments.map(c=><Comment key={c.id} c={c} currentUser={user} onLike={handleLike} onDelete={handleDelComment}/>)
        }
      </div>
      <style jsx>{`
        .pd{max-width:660px;margin:0 auto;padding:28px 20px 64px;font-family:'DM Sans',sans-serif;min-height:calc(100vh - 70px)}
        .pd-post{margin-bottom:10px}
        .pd-compose{background:#111114;border:1px solid #1e1e24;border-radius:14px;overflow:hidden;margin-bottom:10px}
        .pd-comments{background:#111114;border:1px solid #1e1e24;border-radius:14px;overflow:hidden}
        .pd-ch{display:flex;align-items:center;gap:8px;padding:14px 18px;border-bottom:1px solid #1e1e24}
        .pd-ch-label{font-family:'Syne',sans-serif;font-size:14.5px;font-weight:700;color:#f0f0f3}
        .pd-ch-count{font-size:12.5px;color:#5c5c6e}
        .pd-empty{display:flex;flex-direction:column;align-items:center;gap:7px;padding:34px 20px;color:#5c5c6e;font-size:13px;text-align:center}.pd-empty svg{color:#3a3a48}
        @media(max-width:600px){.pd{padding:16px 0 64px}.pd-post,.pd-compose,.pd-comments{border-radius:0;border-left:none;border-right:none}}
      `}</style>
    </div>
  );
}