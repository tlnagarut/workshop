#!/usr/bin/env python3
"""Build the Cutter sales page in English and Polish from one template.

Output: cutter/index.html and cutter/pl/index.html in the repo root.
Run from anywhere: python3 tools/cutter-page/build.py
"""
import json
from html import escape
from pathlib import Path
from urllib.parse import quote

# In the repo this script sits at tools/cutter-page/build.py; it writes to the repo's cutter/ folder.
ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / "cutter"

BUY = "https://tomasx.gumroad.com/l/cutter?wanted=true"
YT_ID = "1RCNCUdKIyM"
YT_WATCH = "https://youtu.be/1RCNCUdKIyM"
YT_EMBED = "https://www.youtube-nocookie.com/embed/1RCNCUdKIyM"
# Second video: Shapr3D STEP import (1:30)
S3_WATCH = "https://youtu.be/rVqf9k2geHI"
S3_EMBED = "https://www.youtube-nocookie.com/embed/rVqf9k2geHI"
WORKSHOP = "https://tlnagarut.co.il/"
BASE = "https://tlnagarut.co.il/cutter/"
OG_IMG = BASE + "img/cutter-video-poster.jpg"
EMAIL = "tlnagarut@outlook.com"

FAVICON = "data:image/svg+xml," + quote(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>"
    "<rect width='64' height='64' rx='14' fill='#6e4f32'/>"
    "<path d='M43 21.5a14 14 0 1 0 0 21' fill='none' stroke='#d9c9ba' "
    "stroke-width='8' stroke-linecap='round'/></svg>",
    safe=":/='# ",
)

EN = {
    "lang": "en", "locale": "en_US", "prefix": "", "url": BASE,
    "title": "Cutter: cutting plans from Blum's Cabinet Configurator",
    "meta_desc": "Cutter turns the parts list from Blum's Cabinet Configurator into a panel-saw cutting plan: a layout for every sheet, the boards to order and the material cost. $99 once, Windows and Mac.",
    "og_title": "Cutter: from Blum's Cabinet Configurator to a cutting plan in a minute",
    "skip": "Skip to content",
    "other_lang": ("Polski", "pl/", "pl"),
    "buy_short": "Buy Cutter – $99",
    "h1": "From Blum's Cabinet Configurator to a cutting plan in a minute.",
    "hero_p": "Drop in the PDF from Blum and get a panel-saw layout for every sheet, the boards to order and the material cost. Built by a cabinet maker for his own shop.",
    "watch_link": "Watch the 90-second video",
    "hero_small": "One-time price, no subscription. 14-day money-back guarantee.",
    "parts": ["Left cabinet side", "Right cabinet side", "Cabinet top panel"],
    "offcut": "offcut",
    "svg_title": "Cutting diagram for sheet 1 of the demo job",
    "svg_desc": "A 2440 by 1220 sheet cut into two strips of 490. Each strip gives a left cabinet side and a right cabinet side of 780 by 490 and a cabinet top panel of 716 by 490. An offcut of 2430 by 222 is left along the bottom.",
    "cut_order_h": "Cut order",
    "cuts": ["Rip at 490", "Rip at 490", "Crosscut at 780", "Crosscut at 780", "Crosscut at 716"],
    "cuts_rest": "The same on the second strip",
    "caption": "Sheet 1 of 2 from the demo job: Oak MFC 17 mm, 2440 × 1220. Largest offcut 2430 × 222.",
    "video_h": "See it in 90 seconds",
    "video_play": "Play the Cutter video (1 min 27 s)",
    "video_alt": "Still from the Cutter video",
    "video_iframe_title": "Cutter video",
    "video_meta": "1 min 27 s, English narration.",
    "video_yt": "Watch on YouTube",
    "s3_h": "From a Shapr3D model to a cutting list",
    "s3_p": "Design in Shapr3D? Export the model as a STEP file and drop it into Cutter. Every flat board up to 40 mm thick comes across with its size and thickness, and hardware is skipped. After a design change, export again and Cutter offers to replace the old parts.",
    "s3_play": "Watch the video (1:30)",
    "s3_alt": "Still from the Shapr3D video: a TV wall model on the left, an arrow, and a Cutter sheet layout on the right",
    "s3_iframe_title": "Cutter video: Shapr3D cut list",
    "s3_meta": "1:30. A real TV wall, from the Shapr3D model to the sheet layouts.",
    "how_h": "How it goes",
    "steps": [
        ("Download the PDF from Blum",
         "In the Cabinet Configurator, download the configuration details as a PDF with the cuttings switched on."),
        ("Drag it into Cutter",
         "Every part comes across with its size, thickness and cabinet name. Nothing to retype. Cutter checks the total against Blum's own area table."),
        ("Set boards, grain and edge banding",
         "Parts are grouped by thickness and take their board from your own materials list. Mark the edges that get banding, enter your tape thickness, and Cutter cuts those parts smaller by the tape."),
        ("Optimize and print",
         "You get a layout for every sheet with straight cuts from edge to edge, how many boards to order, what is left over and what the material costs. Saw kerf and trim are taken into account."),
    ],
    "import_alt": "Cutter after importing a Blum PDF: a green bar says the area cross-check passed, above the table of thicknesses and the Oak MFC 17 mm material group.",
    "paper_h": "Printed for the workshop",
    "paper_p": "Cutter prints a summary first, then one page per sheet with sizes, grain, edge banding and cut order.",
    "summary_alt": "Printed summary page: each material group with its sheets, waste and cost, and the job total.",
    "sheet_alt": "Printed sheet page: one Oak MFC sheet with six parts, their sizes and grain arrows, the offcuts and the cut order.",
    "noblum_h": "No Blum file? It works anyway.",
    "noblum": ["Paste a list from Excel.", "Type the parts in.", "Drop a STEP file from Shapr3D."],
    "good_h": "Good to know",
    "good": [
        "Millimetres or inches.",
        "Runs on your own Windows or Mac computer. No internet needed after installing, and your jobs stay on your computer.",
        "One-time price. No subscription.",
        "Updates for version 1 are free.",
        "14-day money-back guarantee.",
    ],
    "who_h": "Who made it",
    "who_p": "I'm a cabinet maker with about 25 years in the trade. I built Cutter for my own workshop, because the cabinet design programs that include cutting lists cost thousands, and Blum's configurator is free and fast. Cutter is the missing step between the two.",
    "who_sig": "Tomas Janulionis, TLnagarut",
    "who_link": "See the workshop",
    "price_h": "$99, once.",
    "get_h": "What you get",
    "get": ["The Windows installer and the Mac installer.", "A licence for one workshop.", "Help by email."],
    "early": "First 50 buyers: enter the code EARLY at checkout for $20 off.",
    "gumroad": "Payment and download are handled by Gumroad.",
    "req": "Windows 10 or 11, or a Mac with an Apple chip (M1 or newer).",
    "faq_h": "Questions",
    "faq": [
        ("Which computers does Cutter run on?",
         "Windows 10 or 11, or a Mac with an Apple chip (M1 or newer). A normal office computer is enough."),
        ("Why does my computer show a warning when I install it?",
         "Cutter is not signed with a paid developer certificate yet, so Windows and macOS show a warning the first time. On Windows, click “More info”, then “Run anyway”. On a Mac, go to System Settings, Privacy &amp; Security, and click “Open Anyway”. The steps are also on the download page."),
        ("Do I need Blum's Cabinet Configurator?",
         "No. You can paste a parts list from Excel, type the parts in, or drop a STEP file from Shapr3D."),
        ("Is my data sent anywhere?",
         "No. Cutter runs on your own computer and needs no internet after installing. Your jobs, customers and materials stay on that computer. Make your own backups."),
        ("Can I get my money back?",
         "Yes. If Cutter does not work for you, write to <a href=\"mailto:{email}\">{email}</a> within 14 days of buying and you get your money back."),
        ("How many computers can I install it on?",
         "One licence is for one business at one address. You may install Cutter on the computers of that workshop."),
        ("Is Cutter made by Blum?",
         "No. Cutter is an independent tool. It is not affiliated with or endorsed by Shapr3D or Blum. Blum is a trademark of Julius Blum GmbH."),
    ],
    "disclaimer": "Cutter is an independent tool. It is not affiliated with or endorsed by Shapr3D or Blum. Blum is a trademark of Julius Blum GmbH.",
    "contact": "Questions before you buy?",
    "made_by": "Cutter is made by <a href=\"{workshop}\">TLnagarut</a>.",
    "ld_desc": "Turns the parts list from Blum's Cabinet Configurator into a panel-saw cutting plan, with the boards to order and the material cost.",
    "ld_video_name": "Cutter: from Blum's Cabinet Configurator to a cutting plan",
    "ld_video_desc": "A 90-second demo: a Blum Cabinet Configurator PDF dropped into Cutter, optimized and printed as a cutting plan.",
}

PL = {
    "lang": "pl", "locale": "pl_PL", "prefix": "../", "url": BASE + "pl/",
    "title": "Cutter: plan rozkroju z Konfiguratora korpusów Blum",
    "meta_desc": "Cutter zamienia listę formatek z Konfiguratora korpusów Blum w rozkrój pod piłę formatową: układ każdej płyty, liczbę płyt do zamówienia i koszt materiału. 99 $ jednorazowo, Windows i Mac.",
    "og_title": "Cutter: z Konfiguratora korpusów Blum do planu rozkroju w minutę",
    "skip": "Przejdź do treści",
    "other_lang": ("English", "../", "en"),
    "buy_short": "Kup Cutter – 99 $",
    "h1": "Z Konfiguratora korpusów Blum do planu rozkroju w minutę.",
    "hero_p": "Przeciągasz PDF z Blum i dostajesz rozkrój pod piłę formatową dla każdej płyty, liczbę płyt do zamówienia i koszt materiału. Zrobiony przez stolarza meblowego dla własnego warsztatu.",
    "watch_link": "Zobacz 90-sekundowy film",
    "hero_small": "Jednorazowa opłata, bez abonamentu. 14 dni gwarancji zwrotu pieniędzy.",
    "parts": ["Bok lewy", "Bok prawy", "Wieniec górny"],
    "offcut": "odpad użytkowy",
    "svg_title": "Plan rozkroju pierwszej płyty z przykładowego zlecenia",
    "svg_desc": "Płyta 2440 na 1220 pocięta na dwa pasy po 490. Z każdego pasa wychodzi bok lewy i bok prawy 780 na 490 oraz wieniec górny 716 na 490. Na dole zostaje odpad użytkowy 2430 na 222.",
    "cut_order_h": "Kolejność cięć",
    "cuts": ["Wzdłużne na 490", "Wzdłużne na 490", "Poprzeczne na 780", "Poprzeczne na 780", "Poprzeczne na 716"],
    "cuts_rest": "To samo na drugim pasie",
    "caption": "Płyta 1 z 2 z przykładowego zlecenia: płyta laminowana dąb 17 mm, 2440 × 1220. Największy odpad użytkowy 2430 × 222.",
    "video_h": "Zobacz w 90 sekund",
    "video_play": "Odtwórz film o Cutterze (1 min 27 s)",
    "video_alt": "Kadr z filmu o Cutterze",
    "video_iframe_title": "Film o Cutterze",
    "video_meta": "1 min 27 s, narracja po angielsku.",
    "video_yt": "Obejrzyj na YouTube",
    "s3_h": "Z modelu w Shapr3D do listy formatek",
    "s3_p": "Projektujesz w Shapr3D? Wyeksportuj model jako plik STEP i przeciągnij go do Cuttera. Każdy płaski element o grubości do 40 mm trafia do programu z wymiarami i grubością, a okucia są pomijane. Po zmianie projektu wyeksportuj model jeszcze raz, a Cutter zaproponuje zastąpienie starych formatek nowymi.",
    "s3_play": "Obejrzyj film (1:30)",
    "s3_alt": "Kadr z filmu o Shapr3D: po lewej model ściany TV, strzałka, po prawej rozkrój płyty w Cutterze",
    "s3_iframe_title": "Film o Cutterze: lista formatek z Shapr3D",
    "s3_meta": "1:30. Prawdziwa ściana TV, od modelu w Shapr3D do rozkroju płyt. Film jest po angielsku.",
    "how_h": "Jak to działa",
    "steps": [
        ("Pobierz PDF z Blum",
         "W Konfiguratorze korpusów Blum pobierz szczegóły konfiguracji jako PDF z zaznaczoną opcją „Rozkroje”."),
        ("Przeciągnij go do Cuttera",
         "Każda formatka trafia do programu z wymiarami, grubością i nazwą korpusu. Niczego nie przepisujesz. Cutter porównuje sumę z tabelą powierzchni z Blum."),
        ("Ustaw płyty, usłojenie i obrzeża",
         "Formatki są pogrupowane według grubości, a każda grupa dostaje płytę z Twojej listy materiałów. Zaznaczasz oklejane krawędzie, wpisujesz grubość obrzeża, a Cutter pomniejsza te formatki o obrzeże."),
        ("Optymalizuj i drukuj",
         "Dostajesz rozkrój każdej płyty z prostymi cięciami od krawędzi do krawędzi, liczbę płyt do zamówienia, odpad użytkowy i koszt materiału. Rzaz piły i wyrównanie krawędzi są uwzględnione."),
    ],
    "import_alt": "Cutter po wczytaniu PDF z Blum: zielony pasek potwierdza zgodność powierzchni, pod nim tabela grubości i grupa materiału Oak MFC 17 mm. Program ma na razie angielskie ekrany.",
    "paper_h": "Wydruk do warsztatu",
    "paper_p": "Cutter drukuje najpierw podsumowanie, a potem osobną stronę dla każdej płyty: wymiary, usłojenie, obrzeża i kolejność cięć.",
    "summary_alt": "Wydrukowane podsumowanie: każda grupa materiału z liczbą płyt, odpadem i kosztem oraz suma dla zlecenia.",
    "sheet_alt": "Wydrukowana strona płyty: płyta laminowana dąb z sześcioma formatkami, ich wymiarami i strzałkami usłojenia, odpadami i kolejnością cięć.",
    "noblum_h": "Nie masz pliku z Blum? Też działa.",
    "noblum": ["Wklej listę z Excela.", "Wpisz formatki ręcznie.", "Wrzuć plik STEP z Shapr3D."],
    "good_h": "Warto wiedzieć",
    "good": [
        "Program jest na razie po angielsku. Polskie pliki PDF z Blum czyta bez problemu.",
        "Milimetry lub cale.",
        "Działa na Twoim komputerze z Windows lub na Macu. Po instalacji nie potrzebuje internetu, a zlecenia zostają na Twoim komputerze.",
        "Jednorazowa opłata. Bez abonamentu.",
        "Aktualizacje wersji 1 są bezpłatne.",
        "14 dni gwarancji zwrotu pieniędzy.",
    ],
    "who_h": "Kto to zrobił",
    "who_p": "Jestem stolarzem meblowym, w zawodzie od około 25 lat. Zrobiłem Cuttera dla własnego warsztatu, bo programy do projektowania mebli z rozkrojem kosztują tysiące, a konfigurator Blum jest darmowy i szybki. Cutter to brakujący krok między jednym a drugim.",
    "who_sig": "Tomas Janulionis, TLnagarut",
    "who_link": "Zobacz warsztat",
    "price_h": "99 $, jednorazowo.",
    "get_h": "Co dostajesz",
    "get": ["Instalator na Windows i instalator na Maca.", "Licencję dla jednego warsztatu.", "Pomoc mailowo (po angielsku)."],
    "early": "Pierwszych 50 kupujących: kod EARLY przy płatności daje 20 $ zniżki.",
    "gumroad": "Płatność i pobranie obsługuje Gumroad.",
    "req": "Windows 10 lub 11 albo Mac z procesorem Apple (M1 lub nowszym). Program jest na razie po angielsku.",
    "faq_h": "Pytania",
    "faq": [
        ("Na jakich komputerach działa Cutter?",
         "Windows 10 lub 11 albo Mac z procesorem Apple (M1 lub nowszym). Wystarczy zwykły komputer biurowy."),
        ("Dlaczego przy instalacji pojawia się ostrzeżenie?",
         "Cutter nie jest jeszcze podpisany płatnym certyfikatem dewelopera, więc Windows i macOS za pierwszym razem pokazują ostrzeżenie. W Windows kliknij „More info” (Więcej informacji), a potem „Run anyway” (Uruchom mimo to). Na Macu otwórz Ustawienia systemowe, Prywatność i ochrona, i kliknij „Otwórz mimo to”. Te kroki są też na stronie pobierania."),
        ("Czy muszę mieć Konfigurator korpusów Blum?",
         "Nie. Możesz wkleić listę formatek z Excela, wpisać formatki ręcznie albo wrzucić plik STEP z Shapr3D."),
        ("Czy moje dane są gdzieś wysyłane?",
         "Nie. Cutter działa na Twoim komputerze i po instalacji nie potrzebuje internetu. Zlecenia, klienci i materiały zostają na tym komputerze. Kopie zapasowe robisz sam."),
        ("Czy mogę odzyskać pieniądze?",
         "Tak. Jeśli Cutter Ci nie pasuje, napisz na <a href=\"mailto:{email}\">{email}</a> w ciągu 14 dni od zakupu, a oddam pieniądze. Pomoc mailowa jest po angielsku."),
        ("Na ilu komputerach mogę go zainstalować?",
         "Jedna licencja obejmuje jedną firmę pod jednym adresem. Możesz zainstalować Cuttera na komputerach tego warsztatu."),
        ("Czy Cutter jest produktem firmy Blum?",
         "Nie. Cutter jest niezależnym narzędziem. Nie jest powiązany z firmami Shapr3D i Blum ani przez nie autoryzowany. Blum jest znakiem towarowym Julius Blum GmbH."),
    ],
    "disclaimer": "Cutter jest niezależnym narzędziem. Nie jest powiązany z firmami Shapr3D i Blum ani przez nie autoryzowany. Blum jest znakiem towarowym Julius Blum GmbH.",
    "contact": "Pytania przed zakupem?",
    "made_by": "Cuttera tworzy <a href=\"{workshop}\">TLnagarut</a>.",
    "ld_desc": "Zamienia listę formatek z Konfiguratora korpusów Blum w plan rozkroju pod piłę formatową, z liczbą płyt do zamówienia i kosztem materiału.",
    "ld_video_name": "Cutter: z Konfiguratora korpusów Blum do planu rozkroju",
    "ld_video_desc": "90-sekundowe demo (po angielsku): PDF z Konfiguratora korpusów Blum wczytany do Cuttera, zoptymalizowany i wydrukowany jako plan rozkroju.",
}

CSS = """
@font-face{font-family:Heebo;font-style:normal;font-display:swap;font-weight:100 900;src:url(%(p)sfonts/heebo-latin-ext-wght-normal.woff2) format('woff2-variations'),url(%(p)sfonts/heebo-latin-ext-wght-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:Heebo;font-style:normal;font-display:swap;font-weight:100 900;src:url(%(p)sfonts/heebo-latin-wght-normal.woff2) format('woff2-variations'),url(%(p)sfonts/heebo-latin-wght-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
:root{--sand:#d9c9ba;--panel:#cebdab;--mid:#bba591;--mid2:#a28973;--walnut:#8c6e52;--dark:#6e4f32;--ink:#2a1f15;--paper:#e6dacd;--part:#cdd8e6;--off:#d5e8cf;--offline:#4f8a45;
--s-0:clamp(.9rem,.86rem + .15vw,.98rem);--s1:clamp(1.06rem,1rem + .25vw,1.18rem);--s2:clamp(1.3rem,1.15rem + .6vw,1.6rem);--s3:clamp(1.75rem,1.4rem + 1.5vw,2.6rem);--s4:clamp(2.3rem,1.6rem + 3.1vw,4.4rem);
--gut:max(16px,4vw);--sec:clamp(4.5rem,3rem + 6vw,9rem);color-scheme:light}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%%;scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;background:var(--sand);color:var(--ink);font-family:Heebo,system-ui,sans-serif;font-weight:400;font-size:var(--s1);line-height:1.65;font-variant-numeric:tabular-nums}
h1,h2,h3{font-weight:800;letter-spacing:-.025em;line-height:1.06;margin:0;text-wrap:balance}
h1{font-size:var(--s4)}h2{font-size:var(--s3)}h3{font-size:var(--s2);line-height:1.15}
p{margin:0}
a{color:inherit;text-decoration-thickness:1px;text-underline-offset:.2em}
a:hover{text-decoration-thickness:2px}
:focus-visible{outline:3px solid var(--ink);outline-offset:3px;border-radius:4px}
.wrap{max-width:76rem;margin:0 auto;padding:0 var(--gut)}
.skip{position:absolute;left:var(--gut);top:-4rem;background:var(--dark);color:var(--sand);padding:.6rem 1rem;border-radius:8px;z-index:2}
.skip:focus{top:.6rem}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:3.4rem;padding:.55rem 1.6rem;border-radius:999px;background:var(--dark);color:var(--sand);font-weight:700;text-decoration:none;line-height:1.2;white-space:nowrap}
.btn:hover{background:var(--ink)}
.btn:focus-visible{outline:3px solid var(--ink);outline-offset:3px;border-radius:999px}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding-top:1.1rem;padding-bottom:1.1rem}
.mark{font-weight:800;font-size:1.5rem;letter-spacing:-.03em;text-decoration:none}
.topbar nav{display:flex;align-items:center;gap:clamp(.8rem,2vw,1.6rem)}
.hero{display:grid;gap:clamp(2.5rem,5vw,4rem);padding-top:clamp(2rem,5vw,4.5rem);align-items:start}
.hero-text{max-width:64rem}
.order li{font-size:.92rem}
.hero-text p{margin-top:1.4rem;max-width:34em}
.cta{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;margin-top:2rem}
.cta a:not(.btn){font-weight:500}
.small{font-size:var(--s-0);margin-top:1.1rem}
@media (min-width:1100px){.hero{padding-top:3.5rem}.hero h1{max-width:20em}}
.dia{margin:0;container-type:inline-size}
.dia-in{display:grid;gap:1.25rem}
@container (min-width:600px){.dia-in{grid-template-columns:minmax(0,3fr) minmax(11rem,1fr);gap:1.25rem clamp(1.5rem,3cqi,3rem);align-items:start}.order{padding-top:.2rem}.order li{font-size:1.02rem;padding:.3rem 0}}
.dia svg{display:block;width:100%%;height:auto;border-radius:6px}
.dia figcaption{font-size:var(--s-0);margin-top:1rem;max-width:60ch}
@container (min-width:600px){.dia figcaption{max-width:75%%}}
.order h2{font-size:var(--s1);letter-spacing:0;line-height:1.3;margin-bottom:.6rem}
.order ol{list-style:none;margin:0;padding:0;font-size:var(--s-0);line-height:1.45}
.order li{display:flex;gap:.6rem;align-items:center;padding:.22rem 0}
.order li span{flex:none;display:inline-grid;place-items:center;min-width:1.55rem;height:1.55rem;padding:0 .35rem;border-radius:999px;background:var(--ink);color:var(--sand);font-weight:700;font-size:.8rem}
svg .sheet{fill:var(--paper);stroke:var(--ink);stroke-width:1.5px;vector-effect:non-scaling-stroke}
svg .part{fill:var(--part);stroke:var(--ink);stroke-width:1.25px;vector-effect:non-scaling-stroke}
svg .offc{fill:var(--off);stroke:var(--offline);stroke-width:1.25px;stroke-dasharray:5 4;vector-effect:non-scaling-stroke}
svg .grain{fill:none;stroke:var(--ink);stroke-width:1.25px;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}
svg text{fill:var(--ink);font-family:Heebo,system-ui,sans-serif;text-anchor:middle}
svg .nm{font-weight:700;font-size:64px}
svg .sz{font-size:62px}
svg .ol{font-size:54px;fill:#2f5a28;font-weight:500}
svg .cut{stroke:var(--dark);stroke-width:13;stroke-linecap:round;fill:none}
svg .badge circle{fill:var(--ink)}
svg .badge text{fill:var(--sand);font-weight:700;font-size:52px}
svg .badge{transform-box:fill-box;transform-origin:center}
@container (max-width:560px){svg .nm{display:none}svg .sz{font-size:100px;font-weight:500}svg .ol{font-size:92px}svg .grain{display:none}svg .badge{transform:scale(1.4)}svg .cut{stroke-width:18}}
@media (prefers-reduced-motion:no-preference){
svg .cut{stroke-dasharray:1;stroke-dashoffset:1;animation:draw .5s cubic-bezier(.4,0,.2,1) var(--d) both}
svg .badge{opacity:0;animation:pop .25s ease-out calc(var(--d) + .2s) both}
}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes pop{to{opacity:1}}
main>.wrap,main>.band{margin-bottom:var(--sec)}
.sec-h{max-width:40rem}
.lead{margin-top:1rem;max-width:60ch}
.video{margin-top:2.2rem}
.player{position:relative;aspect-ratio:16/9;border-radius:18px;overflow:hidden;background:var(--ink)}
.player button{all:unset;cursor:pointer;position:absolute;inset:0;display:block}
.player button:focus-visible{outline:4px solid var(--ink);outline-offset:4px;border-radius:18px}
.player img,.player iframe{display:block;width:100%%;height:100%%;border:0;object-fit:cover}
.play{position:absolute;left:50%%;top:50%%;width:clamp(4.5rem,9vw,7rem);height:clamp(4.5rem,9vw,7rem);transform:translate(-50%%,-50%%);border-radius:999px;background:var(--dark);display:grid;place-items:center;box-shadow:0 0 0 6px rgba(42,31,21,.25)}
.player button:hover .play{background:var(--ink)}
.play svg{width:38%%;height:38%%;margin-left:8%%;fill:var(--sand)}
.vmeta{display:flex;flex-wrap:wrap;gap:.4rem 1.5rem;margin-top:1rem;font-size:var(--s-0)}
.steps{list-style:none;margin:2.6rem 0 0;padding:0;display:grid;gap:clamp(2.2rem,4vw,3.2rem)}
.steps>li{display:grid;grid-template-columns:clamp(3rem,7vw,6rem) minmax(0,1fr);gap:0 clamp(.8rem,2vw,2rem);border-top:1px solid var(--mid2);padding-top:1.4rem}
.num{font-weight:800;font-size:clamp(2.6rem,1.8rem + 3.4vw,5rem);line-height:.85;letter-spacing:-.04em;color:var(--walnut)}
.steps p{margin-top:.7rem;max-width:60ch}
.shot{margin:1.8rem 0 0;max-width:52rem}
.shot a{display:block;border-radius:18px}
.shot img{display:block;width:100%%;height:auto;border-radius:18px;border:1px solid var(--mid2)}
.papers{display:grid;gap:clamp(1.5rem,3vw,2.5rem);margin-top:2.4rem}
.paper{margin:0;background:var(--panel);border-radius:18px;padding:clamp(.75rem,2.6vw,2.2rem)}
.sheetp{display:block;border:1px solid var(--mid2);box-shadow:0 6px 16px -8px rgba(42,31,21,.35)}
.sheetp img{display:block;width:100%%;height:auto}
.cols{display:grid;gap:clamp(3rem,6vw,5rem)}
@media (min-width:900px){.cols{grid-template-columns:1fr 1fr}}
.plain{margin:1.4rem 0 0;padding:0 0 0 1.2rem;max-width:60ch}
.plain li{padding:.3rem 0}
.plain li::marker{color:var(--walnut)}
.band{background:var(--dark);color:var(--sand);padding:calc(var(--sec) * .67) 0}
.band blockquote{margin:1.6rem 0 0;max-width:44rem}
.band blockquote p{font-size:var(--s2);line-height:1.5;font-weight:400}
.band .sig{margin-top:1.4rem;font-weight:700}
.band a{display:inline-block;margin-top:1.4rem;font-weight:500}
.band :focus-visible{outline-color:var(--sand)}
.price{background:var(--panel);border-radius:18px;padding:clamp(1.6rem,4vw,3.4rem);display:grid;gap:2rem 4rem}
@media (min-width:900px){.price{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start}}
.price h2{font-size:var(--s4)}
.price .btn{margin-top:1.8rem}
.price h3{font-size:var(--s1);letter-spacing:0;line-height:1.3}
.price .plain{margin-top:.8rem}
.price .fine{margin-top:1rem;font-size:var(--s-0);max-width:52ch}
.price .fine+.fine{margin-top:.4rem}
.faq{margin-top:2rem;max-width:52rem;border-top:1px solid var(--mid2)}
.faq details{border-bottom:1px solid var(--mid2)}
.faq summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:1rem;padding:1.15rem 0;font-weight:700;font-size:var(--s1);line-height:1.35}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:"+";font-weight:400;font-size:1.6rem;line-height:.9;flex:none}
.faq details[open] summary::after{content:"\\2212"}
.faq details p{padding:0 0 1.4rem;max-width:62ch}
footer{background:var(--panel);padding:3rem 0 3.5rem;font-size:var(--s-0)}
footer p+p{margin-top:.7rem}
footer .wrap{max-width:76rem}
footer p{max-width:70ch}
"""

SCRIPT = """document.querySelectorAll('.player button').forEach(function(b){b.addEventListener('click',function(){var f=document.createElement('iframe');f.src=(this.dataset.src||'%s')+'?autoplay=1&rel=0';f.title=this.dataset.t;f.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';f.allowFullscreen=true;f.referrerPolicy='strict-origin-when-cross-origin';this.parentNode.replaceChild(f,this);f.focus()})});""" % YT_EMBED


def diagram(t):
    parts = []
    rows = [(5, 490), (499, 490)]
    cols = [(5, 780), (789, 780), (1573, 716)]
    for (y, h) in rows:
        for i, (x, w) in enumerate(cols):
            cx, cy = x + w / 2, y + h / 2
            parts.append(
                f'<rect class="part" x="{x}" y="{y}" width="{w}" height="{h}"/>'
                f'<text class="nm" x="{cx:g}" y="{cy - 30:g}">{escape(t["parts"][i])}</text>'
                f'<text class="sz" x="{cx:g}" y="{cy + 40:g}">{w} × {h}</text>'
                f'<path class="grain" d="M{cx-90:g} {cy+105:g}H{cx+90:g}M{cx-68:g} {cy+91:g}L{cx-90:g} {cy+105:g}L{cx-68:g} {cy+119:g}M{cx+68:g} {cy+91:g}L{cx+90:g} {cy+105:g}L{cx+68:g} {cy+119:g}"/>'
            )
    offc = (
        '<rect class="offc" x="5" y="993" width="2430" height="222"/>'
        '<rect class="offc" x="2293" y="5" width="142" height="490"/>'
        '<rect class="offc" x="2293" y="499" width="142" height="490"/>'
        f'<text class="ol" x="1220" y="1122">{escape(t["offcut"])} 2430 × 222</text>'
    )
    # (n, x1, y1, x2, y2, badge x, badge y)
    cuts = [
        (1, 0, 497, 2440, 497, 395, 497),
        (2, 0, 991, 2440, 991, 395, 991),
        (3, 787, 5, 787, 495, 787, 250),
        (4, 1571, 5, 1571, 495, 1571, 250),
        (5, 2291, 5, 2291, 495, 2291, 250),
        (6, 787, 499, 787, 989, 787, 744),
        (7, 1571, 499, 1571, 989, 1571, 744),
        (8, 2291, 499, 2291, 989, 2291, 744),
    ]
    lines, badges = [], []
    for n, x1, y1, x2, y2, bx, by in cuts:
        d = f"--d:{0.35 + (n - 1) * 0.3:.2f}s"
        lines.append(f'<path class="cut" style="{d}" pathLength="1" d="M{x1} {y1}L{x2} {y2}"/>')
        badges.append(
            f'<g class="badge" style="{d}"><circle cx="{bx}" cy="{by}" r="42"/>'
            f'<text x="{bx}" y="{by + 18}">{n}</text></g>'
        )
    return (
        '<svg viewBox="0 0 2440 1220" role="img" aria-labelledby="dia-t dia-d" xmlns="http://www.w3.org/2000/svg">'
        f'<title id="dia-t">{escape(t["svg_title"])}</title><desc id="dia-d">{escape(t["svg_desc"])}</desc>'
        '<rect class="sheet" x="0" y="0" width="2440" height="1220"/>'
        + "".join(parts) + offc + "".join(lines) + "".join(badges) + "</svg>"
    )


def jsonld(t):
    data = [
        {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Cutter",
            "description": t["ld_desc"],
            "operatingSystem": "Windows 10, Windows 11, macOS (Apple silicon)",
            "applicationCategory": "BusinessApplication",
            "inLanguage": "en",
            "url": t["url"],
            "image": OG_IMG,
            "offers": {"@type": "Offer", "price": "99", "priceCurrency": "USD", "url": BUY},
            "author": {"@type": "Person", "name": "Tomas Janulionis", "url": WORKSHOP},
        },
        {
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": t["ld_video_name"],
            "description": t["ld_video_desc"],
            "thumbnailUrl": OG_IMG,
            "uploadDate": "2026-11-22",
            "duration": "PT1M27S",
            "embedUrl": YT_EMBED,
            "contentUrl": YT_WATCH,
            "inLanguage": "en",
        },
    ]
    return "".join(
        f'<script type="application/ld+json">{json.dumps(d, ensure_ascii=False, separators=(",", ":"))}</script>'
        for d in data
    )


def page(t):
    p = t["prefix"]
    img = p + "img/"
    ol_name, ol_href, ol_lang = t["other_lang"]
    css = CSS % {"p": p}
    ul = lambda items: "".join(f"<li>{i}</li>" for i in items)
    cut_items = "".join(
        f'<li><span aria-hidden="true">{n}</span>{escape(c)}</li>' for n, c in enumerate(t["cuts"], 1)
    ) + f'<li><span aria-hidden="true">6–8</span>{escape(t["cuts_rest"])}</li>'
    # screen readers: numbers are in the visible badges; give ol real numbering via aria labels
    steps = []
    for n, (h, body) in enumerate(t["steps"], 1):
        extra = ""
        if n == 2:
            extra = (
                f'<figure class="shot"><a href="{img}cutter-blum-pdf-import.webp"><img src="{img}cutter-blum-pdf-import.webp" width="1400" height="1019" '
                f'loading="lazy" decoding="async" alt="{escape(t["import_alt"])}"></a></figure>'
            )
        steps.append(
            f'<li><span class="num" aria-hidden="true">{n}</span><div><h3>{h}</h3><p>{body}</p>{extra}</div></li>'
        )
    faq = "".join(
        f"<details><summary>{q}</summary><p>{a.format(email=EMAIL)}</p></details>" for q, a in t["faq"]
    )
    head = f"""<!doctype html>
<html lang="{t['lang']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(t['title'])}</title>
<meta name="description" content="{escape(t['meta_desc'])}">
<link rel="canonical" href="{t['url']}">
<link rel="alternate" hreflang="en" href="{BASE}">
<link rel="alternate" hreflang="pl" href="{BASE}pl/">
<link rel="alternate" hreflang="x-default" href="{BASE}">
<link rel="icon" href="{FAVICON}">
<meta name="theme-color" content="#d9c9ba">
<meta property="og:type" content="website">
<meta property="og:site_name" content="TLnagarut">
<meta property="og:locale" content="{t['locale']}">
<meta property="og:locale:alternate" content="{'pl_PL' if t['lang'] == 'en' else 'en_US'}">
<meta property="og:url" content="{t['url']}">
<meta property="og:title" content="{escape(t['og_title'])}">
<meta property="og:description" content="{escape(t['meta_desc'])}">
<meta property="og:image" content="{OG_IMG}">
<meta property="og:image:width" content="1280">
<meta property="og:image:height" content="720">
<meta property="og:image:alt" content="{escape(t['video_alt'])}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{escape(t['og_title'])}">
<meta name="twitter:description" content="{escape(t['meta_desc'])}">
<meta name="twitter:image" content="{OG_IMG}">
{jsonld(t)}
<style>{' '.join(l.strip() for l in css.strip().splitlines())}</style>
</head>"""
    body = f"""
<body>
<a class="skip" href="#main">{t['skip']}</a>
<header class="wrap topbar">
<span class="mark">Cutter</span>
<nav aria-label="{'Language' if t['lang']=='en' else 'Język'}">
<a href="{ol_href}" hreflang="{ol_lang}" lang="{ol_lang}">{ol_name}</a>
</nav>
</header>
<main id="main">
<div class="wrap hero">
<div class="hero-text">
<h1>{escape(t['h1'])}</h1>
<p>{escape(t['hero_p'])}</p>
<div class="cta"><a class="btn" href="#video">{t['watch_link']}</a></div>
<p class="small">{t['hero_small']}</p>
</div>
<figure class="dia">
<div class="dia-in">
{diagram(t)}
<div class="order"><h2 id="order-h">{t['cut_order_h']}</h2><ol aria-labelledby="order-h">{cut_items}</ol></div>
</div>
<figcaption>{t['caption'].replace(' × ', '\u00a0×\u00a0')}</figcaption>
</figure>
</div>

<section id="video" class="wrap" aria-labelledby="video-h">
<h2 id="video-h" class="sec-h">{t['video_h']}</h2>
<div class="video">
<div class="player"><button type="button" data-t="{escape(t['video_iframe_title'])}" aria-label="{escape(t['video_play'])}"><img src="{img}cutter-video-poster.jpg" width="1280" height="720" alt="{escape(t['video_alt'])}" loading="lazy" decoding="async"><span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 3.5v17l14-8.5z"/></svg></span></button></div>
<p class="vmeta"><span>{t['video_meta']}</span><a href="{YT_WATCH}">{t['video_yt']}</a></p>
</div>
</section>

<section class="wrap" aria-labelledby="how-h">
<h2 id="how-h" class="sec-h">{t['how_h']}</h2>
<ol class="steps">{''.join(steps)}</ol>
</section>

<section class="wrap" aria-labelledby="paper-h">
<h2 id="paper-h" class="sec-h">{t['paper_h']}</h2>
<p class="lead">{t['paper_p']}</p>
<div class="papers">
<figure class="paper"><a class="sheetp" href="{img}cutter-print-summary.webp"><img src="{img}cutter-print-summary.webp" width="1600" height="666" loading="lazy" decoding="async" alt="{escape(t['summary_alt'])}"></a></figure>
<figure class="paper"><a class="sheetp" href="{img}cutter-print-sheet-layout.webp"><img src="{img}cutter-print-sheet-layout.webp" width="1600" height="767" loading="lazy" decoding="async" alt="{escape(t['sheet_alt'])}"></a></figure>
</div>
</section>

<div class="wrap cols">
<section aria-labelledby="noblum-h"><h2 id="noblum-h">{t['noblum_h']}</h2><ul class="plain">{ul(t['noblum'])}</ul></section>
<section aria-labelledby="good-h"><h2 id="good-h">{t['good_h']}</h2><ul class="plain">{ul(t['good'])}</ul></section>
</div>

<section id="shapr3d" class="wrap" aria-labelledby="s3-h">
<h2 id="s3-h" class="sec-h">{t['s3_h']}</h2>
<p class="lead">{t['s3_p']}</p>
<div class="video">
<div class="player"><button type="button" data-src="{S3_EMBED}" data-t="{escape(t['s3_iframe_title'])}" aria-label="{escape(t['s3_play'])}"><img src="{img}cutter-shapr3d-video-poster.jpg" width="1280" height="720" alt="{escape(t['s3_alt'])}" loading="lazy" decoding="async"><span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 3.5v17l14-8.5z"/></svg></span></button></div>
<p class="vmeta"><span>{t['s3_meta']}</span><a href="{S3_WATCH}">{t['s3_play']}</a></p>
</div>
</section>

<section class="band" aria-labelledby="who-h">
<div class="wrap">
<h2 id="who-h">{t['who_h']}</h2>
<blockquote><p>{t['who_p']}</p><p class="sig">{t['who_sig']}</p></blockquote>
<a href="{WORKSHOP}">{t['who_link']}</a>
</div>
</section>

<section id="buy" class="wrap" aria-labelledby="price-h">
<div class="price">
<div>
<h2 id="price-h">{t['price_h']}</h2>
<a class="btn" href="{BUY}">{t['buy_short']}</a>
<p class="fine">{t['early']}</p>
<p class="fine">{t['gumroad']}</p>
</div>
<div>
<h3>{t['get_h']}</h3>
<ul class="plain">{ul(t['get'])}</ul>
<p class="fine">{t['req']}</p>
</div>
</div>
</section>

<section class="wrap" aria-labelledby="faq-h">
<h2 id="faq-h">{t['faq_h']}</h2>
<div class="faq">{faq}</div>
</section>
</main>
<footer>
<div class="wrap">
<p>{t['disclaimer']}</p>
<p>{t['contact']} <a href="mailto:{EMAIL}">{EMAIL}</a></p>
<p>{t['made_by'].format(workshop=WORKSHOP)}</p>
</div>
</footer>
<script>{SCRIPT}</script>
</body>
</html>
"""
    return head + body


def main():
    for t, out in ((EN, SITE / "index.html"), (PL, SITE / "pl" / "index.html")):
        out.parent.mkdir(parents=True, exist_ok=True)
        html = page(t)
        out.write_text(html, encoding="utf-8")
        print(f"{out.relative_to(ROOT)}: {len(html.encode('utf-8')) / 1024:.1f} KB")


if __name__ == "__main__":
    main()
