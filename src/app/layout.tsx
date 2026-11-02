import type { Metadata } from "next"
import { Hanken_Grotesk, Onest, Geist_Mono } from "next/font/google"
import { availableTracks, getBanks, getBooks, headings } from "@/lib/content"
import { Shell } from "@/components/shell"
import "./globals.css"

const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"] })
const onest = Onest({ variable: "--font-onest", subsets: ["latin"] })
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Claude Cert Study",
  description: "An independent study guide and practice quizzes for Claude certification exams",
}

// Applied before paint so there is no flash of the wrong theme or text size.
// Mirrors applyPrefs() in lib/store.ts.
const prefsScript = `(function(){try{
var r=JSON.parse(localStorage.getItem('ccdv:reader')||'{}')||{};
var old=localStorage.getItem('ccdv:theme');
var t=r.theme||(old==='dark'?'dark':old==='light'?'light':(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
var h=document.documentElement;
h.dataset.theme=t;
if(t==='dark'||t==='dusk')h.classList.add('dark');
h.dataset.emphasis=r.emphasis===false?'off':'on';
var sizes=[14,15,16,17,18,19,20,22,24,26];
if(typeof r.size==='number'&&sizes[r.size])h.style.setProperty('--reader-size',sizes[r.size]+'px');
var L={compact:1.55,normal:1.75,relaxed:2};if(L[r.leading])h.style.setProperty('--reader-leading',L[r.leading]);
var W={narrow:'60ch',normal:'70ch',wide:'82ch'};if(W[r.width])h.style.setProperty('--reader-width',W[r.width]);
if(r.font==='hanken')h.style.setProperty('--reader-font','var(--font-heading)');
}catch(e){}})()`

export default function RootLayout({ children }: LayoutProps<"/">) {
  const tracks = availableTracks().map((t) => ({
    id: t.id,
    books: getBooks(t.id).map((b) => ({ id: b.id, title: b.title, docs: b.docs.map((d) => ({ slug: d.slug, title: d.title, sections: headings(d.body, 3) })) })),
    banks: getBanks(t.id).map((b) => ({ id: b.id, title: b.title, subtitle: b.subtitle })),
  }))
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${hanken.variable} ${onest.variable} ${mono.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefsScript }} />
      </head>
      <body>
        <Shell tracks={tracks}>{children}</Shell>
      </body>
    </html>
  )
}
