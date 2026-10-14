export function Brand({compact=false}:{compact?:boolean}) {
  return <a className={"brand"+(compact?" brand-compact":"")} href="/" aria-label="Eastsider News home">
    <svg className="brand-sun" viewBox="0 0 48 48" aria-hidden="true"><path d="M33 10a16 16 0 1 0 0 28" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M22 0v7M8 6l5 6M0 21h7M3 37l7-4M19 48l2-7M37 2l-4 7" stroke="currentColor" strokeWidth="3"/></svg>
    <span>Eastsider<span className="brand-news">News</span></span>
  </a>;
}
