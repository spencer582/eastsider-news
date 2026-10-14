import { getChatGPTUser, chatGPTSignInPath } from "@/app/chatgpt-auth";
import { getMember } from "@/lib/permissions";
import { editorialStories } from "@/lib/content";
import Newsroom from "./workspace";
import "./newsroom.css";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
export const dynamic="force-dynamic";
export const metadata={title:"Author workspace",robots:{index:false,follow:false}};
export default async function NewsroomPage(){const user=await getChatGPTUser();const member=await getMember();if(!member)return <main id="main" className="wrap content-page"><div className="workspace-gate"><LockKeyhole size={35} strokeWidth={1.2}/><span className="eyebrow">THE EASTSIDER NEWSROOM</span><h1>A place for your next story.</h1><p>{user?"This account does not have newsroom access. Ask the editor to add the email address you use to sign in.":"Sign in with your approved account to write, review and publish with Eastsider News."}</p>{!user&&<a className="button" href={chatGPTSignInPath("/newsroom")} target="_top">Sign in to the newsroom <ArrowUpRight size={17}/></a>}<a className="text-link" href="/contribute">Want to contribute a story? <ArrowUpRight size={16}/></a></div></main>;return <main id="main"><Newsroom member={member} initialStories={await editorialStories(member)}/></main>;}
