"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="main" className="wrap content-page"><div className="empty-state"><h1 style={{fontSize:42,marginBottom:18}}>We couldn’t open this page.</h1><p>Please try again in a moment.</p><button className="button" onClick={reset}>Try again</button></div></main>;}
