import { hydrateRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { makeDocument, type DocumentInput } from "./document";
const input = JSON.parse(document.getElementById("eastsider-preview")!.textContent!) as DocumentInput;
const initial = await makeDocument(input);
function Reader() {
  const [page, setPage] = useState(initial);
  useEffect(() => {
    let active = true;
    const query = Object.fromEntries(new URLSearchParams(location.search));
    if (Object.keys(query).length) makeDocument({...input,query}).then(next=>{ if (active) setPage(next); });
    return () => { active = false; };
  }, []);
  return page;
}
hydrateRoot(document, <Reader/>);
