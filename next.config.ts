import type { NextConfig } from "next";
const nextConfig:NextConfig={
  async headers(){return [{source:"/:path*",headers:[{key:"X-Content-Type-Options",value:"nosniff"},{key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},{key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"}]},{source:"/newsroom/:path*",headers:[{key:"Cache-Control",value:"private, no-store"},{key:"X-Robots-Tag",value:"noindex, nofollow"}]}];},
  async redirects(){return [
    {source:"/about-us",destination:"/about",permanent:true},
    {source:"/current-edition",destination:"/editions",permanent:true},
    {source:"/past-editions-of-eastsider-news",destination:"/editions",permanent:true},
    {source:"/advertise-with-us",destination:"/advertise",permanent:true},
    {source:"/guidelines",destination:"/contribute",permanent:true},
    {source:"/community-links",destination:"/community",permanent:true},
    {source:"/recent-news",destination:"/news",permanent:true},
    {source:"/local-government/boroondara/maranoa-botanic-gardens-achieves-100-years",destination:"/articles/maranoa-botanic-gardens-achieves-100-years",permanent:true},
    {source:"/uncategorized/bin-basket-trial-for-bottles-and-cans-in-boroondara",destination:"/articles/bin-basket-trial-for-bottles-and-cans-in-boroondara",permanent:true},
    {source:"/uncategorized/native-plants-and-revegetation",destination:"/articles/native-plants-and-revegetation",permanent:true},
    {source:"/culture-and-creativity/arts/geoff-dossetor-renowned-local-artist",destination:"/articles/geoff-dossetor-renowned-local-artist",permanent:true},
    {source:"/environment/learning-about-the-environment/resourcesmart-schools-sustainability-award-winners",destination:"/articles/resourcesmart-schools-sustainability-award-winners",permanent:true},
    {source:"/local-neighbourhoods/a-vision-for-cemeteries-in-perpetuity",destination:"/articles/a-vision-for-cemeteries-in-perpetuity",permanent:true},
    {source:"/environment/emus-and-kangaroos-roam-among-us",destination:"/articles/emus-and-kangaroos-roam-among-us",permanent:true},
  ];},
};
export default nextConfig;
