"""End-to-end QA suite for the Global Business Academy web app (mock mode).
Run:  cd apps/web && npm run build && npx next start -p 3100 &   then   python3 qa/e2e.py
Needs: python playwright + chromium. Writes qa/out/results.json and screenshots of failures.
"""
import json, os, re, subprocess, sys, time, traceback
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("BASE", "http://localhost:3100")
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out"); os.makedirs(OUT, exist_ok=True)
EXP = json.loads(subprocess.check_output(["node", "--experimental-strip-types", os.path.join(HERE, "expected.mjs")]))
CHROMIUM = os.environ.get("CHROMIUM", "/opt/pw-browsers/chromium")
results, console_errors = [], []
page_ref = {"pg": None}

def check(id, name, cond, detail=""):
    results.append({"id": id, "name": name, "pass": bool(cond), "detail": str(detail)[:300]})
    print(("PASS " if cond else "FAIL ") + id + "  " + name + ("" if cond else "   -> " + str(detail)[:200]), flush=True)

def scenario(id, fn, *a):
    try:
        fn(*a)
    except Exception as e:
        check(id, "scenario crashed", False, repr(e).replace("\n", " ")[:250])
        try:
            page_ref["pg"].screenshot(path=os.path.join(OUT, f"{id}-crash.png"))
        except Exception:
            pass

def new_page(ctx):
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: console_errors.append((pg.url, "pageerror: " + str(e)[:160])))
    pg.on("console", lambda m: console_errors.append((pg.url, m.text[:160])) if m.type == "error" else None)
    pg.set_default_timeout(8000)
    page_ref["pg"] = pg
    return pg

def goto(pg, path, wait=500):
    pg.goto(BASE + path); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(wait)

def txt(pg, sel="main"):
    return pg.locator(sel).first.inner_text()

def cards(pg):
    return pg.locator("main a.card").count()

def login(pg, email, pw, loc="en", expect_url=None):
    goto(pg, f"/{loc}/login", 300)
    pg.locator("input[type=email]").fill(email)
    pg.locator("input[autocomplete=current-password]").fill(pw)
    pg.locator("form button.btn-gold").click()
    pg.wait_for_timeout(700)

def logout(pg):
    pg.evaluate("localStorage.removeItem('gba.token'); localStorage.removeItem('gba.cart')")

def register(pg, name, email, pw, child=False, terms=True, loc="en"):
    goto(pg, f"/{loc}/register", 900)
    if child: pg.locator("[role=radio]").nth(1).click()
    pg.locator("input[autocomplete=name]").fill(name)
    pg.locator("input[autocomplete=email]").fill(email)
    pg.locator("input[autocomplete=tel]").fill("0555555555")
    pg.locator("input[autocomplete=new-password]").fill(pw)
    if terms: pg.locator("form input[type=checkbox]").first.check()
    pg.locator("form button.btn-gold").click()
    pg.wait_for_timeout(800)

def add_course(pg, slug, mode_index=0, loc="en"):
    goto(pg, f"/{loc}/courses/{slug}", 300)
    pg.locator("[role=radio]").nth(mode_index).click()
    pg.locator("button.btn-outline").first.click()   # "Add to cart"
    pg.wait_for_timeout(200)

def pay_cart(pg, loc="en"):
    goto(pg, f"/{loc}/cart", 300)
    pg.locator("a.btn-gold").click(); pg.wait_for_url("**/checkout")
    pg.locator("main input[type=checkbox]").check()
    pg.locator("button.btn-gold").click(); pg.wait_for_timeout(2300)

# ============================================================== A. public site / i18n / catalogue
def A_public(b):
    ctx = b.new_context(viewport={"width": 1360, "height": 900}); pg = new_page(ctx)
    r = pg.goto(BASE + "/"); pg.wait_for_load_state("networkidle")
    check("A01", "root redirects to /ar", "/ar" in pg.url, pg.url)
    html = pg.locator("html")
    check("A02", "Arabic page is rtl + lang=ar", html.get_attribute("dir") == "rtl" and html.get_attribute("lang") == "ar")
    goto(pg, "/en")
    check("A03", "English page is ltr + lang=en", pg.locator("html").get_attribute("dir") == "ltr" and pg.locator("html").get_attribute("lang") == "en")
    fam = pg.evaluate("getComputedStyle(document.body).fontFamily")
    check("A04", "English body font is Roboto", "Roboto" in fam.split(",")[0], fam)
    goto(pg, "/ar"); fam = pg.evaluate("getComputedStyle(document.body).fontFamily")
    check("A05", "Arabic body font is Tajawal", "Tajawal" in fam.split(",")[0], fam)
    goto(pg, "/ar/courses?audience=kids")
    pg.locator("header a[hreflang=en]").click(); pg.wait_for_url("**/en/courses**"); pg.wait_for_load_state("networkidle")
    check("A06", "language switch keeps path and query", pg.url.endswith("/en/courses?audience=kids"), pg.url)
    goto(pg, "/en")
    check("A07", "home: 3 audience tracks", pg.locator("main section a[href*='audience=']").count() >= 3)
    check("A08", "home: featured courses (6 cards)", cards(pg) >= 6, cards(pg))
    check("A09", "home: live sessions block lists upcoming sessions", pg.locator("text=Live sessions coming up").count() == 1)
    check("A10", "home: exactly one h1", pg.locator("h1").count() == 1)
    # unknown routes
    for path, id in (("/ar/does-not-exist", "A11"), ("/en/courses/nope", "A12"), ("/fr", "A13"), ("/en/mentors/nope", "A14")):
        r = pg.goto(BASE + path)
        check(id, f"unknown route {path} -> 404", r.status == 404, r.status)
    # catalogue
    goto(pg, "/en/courses")
    check("A20", f"catalogue shows all {EXP['total']} courses", cards(pg) == EXP["total"], cards(pg))
    for a, n in EXP["audience"].items():
        goto(pg, f"/en/courses?audience={a}"); check(f"A21-{a}", f"filter audience={a} -> {n}", cards(pg) == n, cards(pg))
    for m, n in EXP["mode"].items():
        goto(pg, f"/en/courses?mode={m}"); check(f"A22-{m}", f"filter mode={m} -> {n}", cards(pg) == n, cards(pg))
    for l, n in EXP["level"].items():
        goto(pg, f"/en/courses?level={l}"); check(f"A23-{l}", f"filter level={l} -> {n}", cards(pg) == n, cards(pg))
    for t, n in EXP["topic"].items():
        goto(pg, f"/en/courses?topic={t}"); check(f"A24-{t}", f"filter topic={t} -> {n}", cards(pg) == n, cards(pg))
    goto(pg, "/en/courses?free=1"); check("A25", "free only -> 1 and it is the free course", cards(pg) == EXP["free"] and EXP["cheapestSlug"] in pg.locator("main a.card").first.get_attribute("href"))
    goto(pg, "/ar/courses?q=" + "المخاطر"); check("A26", "Arabic search finds titles and subtitles", cards(pg) == EXP["searchRisk"], cards(pg))
    goto(pg, "/en/courses?q=project"); check("A27", "English search 'project'", cards(pg) == EXP["searchProject"], cards(pg))
    goto(pg, "/en/courses?q=zzzzzz"); check("A28", "no results message", "No matching courses" in txt(pg) and cards(pg) == 0)
    goto(pg, "/en/courses?sort=priceAsc"); first = pg.locator("main a.card").first.get_attribute("href")
    check("A29", "sort price low to high: cheapest first", EXP["cheapestSlug"] in first, first)
    goto(pg, "/en/courses?sort=priceDesc"); first = pg.locator("main a.card").first.get_attribute("href")
    check("A30", "sort price high to low: priciest first", EXP["priciestSlug"] in first, first)
    goto(pg, "/en/courses?audience=experts&mode=blended&level=advanced")
    exp_n = sum(1 for c in EXP["slugs"] if c["audience"] == "experts")  # sanity only
    check("A31", "combined filters narrow results (<= experts total)", 0 < cards(pg) <= exp_n, cards(pg))
    goto(pg, "/en/courses?audience=kids&topic=projects&level=advanced"); check("A32", "combined filters with no match -> empty state", cards(pg) == 0)
    goto(pg, "/en/courses?audience=kids")
    pg.locator("aside >> text=Reset").click(); pg.wait_for_url("**/courses"); pg.wait_for_timeout(600)
    n = cards(pg); check("A33", "reset link clears filters", n == EXP["total"], n)
    goto(pg, "/en/courses?audience=%27%3Cscript%3Ealert(1)%3C/script%3E")
    check("A34", "hostile query param does not break the page", cards(pg) == 0 and pg.locator("h1").count() == 1)
    goto(pg, "/en/courses?q=%27%20OR%201%3D1--"); check("A35", "SQL-looking search is treated as text", cards(pg) == 0)
    # every course page
    bad = []
    for c in EXP["slugs"]:
        r = pg.goto(f"{BASE}/en/courses/{c['slug']}"); pg.wait_for_load_state("networkidle")
        h1 = pg.locator("h1").first.inner_text() if pg.locator("h1").count() else ""
        nrad = pg.locator("[role=radio]").count()
        if r.status != 200 or h1.strip() != c["titleEn"] or nrad != len(c["offerings"]): bad.append((c["slug"], r.status, h1[:30], nrad))
    check("A40", "all course pages render with correct title and offering count", not bad, bad[:3])
    for c in EXP["slugs"][:3]:
        r = pg.goto(f"{BASE}/ar/courses/{c['slug']}"); pg.wait_for_load_state("networkidle")
        check("A41-" + c["slug"], "Arabic course page shows Arabic title", c["titleAr"] in pg.locator("h1").first.inner_text())
    goto(pg, "/en/courses/career-launchpad")
    prices = []
    for i in range(pg.locator("[role=radio]").count()):
        pg.locator("[role=radio]").nth(i).click(); pg.wait_for_timeout(150)
        prices.append(pg.locator("main .text-4xl").first.inner_text())
    check("A42", "selecting each offering updates the big price", len(set(prices)) == len(prices), prices)
    goto(pg, "/en/courses/little-project-heroes")
    pg.locator("[role=radio]").nth(2).click(); pg.wait_for_timeout(150)
    check("A43", "blended offering lists live sessions with seats left", pg.locator("text=Upcoming sessions").count() == 1 and pg.locator("text=seats left").count() >= 3)
    check("A44", "kids course shows guardian note", "parent or guardian" in txt(pg))
    goto(pg, "/en/courses/strategic-programme-leadership"); check("A45", "expert course shows CPD points", "CPD" in txt(pg))
    check("A46", "syllabus is expandable and lists lessons", pg.locator("details").count() >= 3 and pg.locator("details li").count() >= 5)
    goto(pg, "/en/courses/career-launchpad")
    pg.locator("main a[href*='/mentors/']").first.click(); pg.wait_for_url("**/mentors/**"); pg.wait_for_load_state("networkidle")
    check("A47", "course -> mentor profile link works", "/mentors/" in pg.url and pg.locator("h1").count() == 1, pg.url)
    # mentors
    goto(pg, "/en/mentors"); check("A50", f"mentors list shows {EXP['mentors']}", pg.locator("main a[href*='/mentors/']").count() == EXP["mentors"], pg.locator("main a[href*='/mentors/']").count())
    bad = []
    for s in EXP["mentorSlugs"]:
        r = pg.goto(f"{BASE}/en/mentors/{s}"); pg.wait_for_load_state("networkidle")
        if r.status != 200 or cards(pg) < 1: bad.append(s)
    check("A51", "every mentor profile renders with their courses", not bad, bad)
    ctx.close()

# ============================================================== B-E stateful flows (one browser context)
def flows(b):
    ctx = b.new_context(viewport={"width": 1360, "height": 900}); ctx.set_default_timeout(8000)
    ctx.on("dialog", lambda d: d.accept())
    pg = new_page(ctx)
    state = {}
    scenario("B", B_auth, pg, state)
    scenario("C", C_commerce, pg, state)
    scenario("D", D_admin, pg, state)
    scenario("E", E_mentor, pg, state)
    scenario("F", F_mobile, ctx, pg)
    scenario("G", G_quality, ctx, pg)
    ctx.close()

def B_auth(pg, st):
    goto(pg, "/en/my-courses"); check("B01", "anonymous My courses asks to log in", "Log in to see your courses" in txt(pg))
    goto(pg, "/en/learn/career-launchpad"); check("B02", "anonymous learning page asks to log in", pg.locator("a[href*='/login']").count() >= 1)
    goto(pg, "/en/checkout"); pg.wait_for_timeout(600); check("B03", "anonymous checkout redirects to login with next", "/login" in pg.url and "next=" in pg.url, pg.url)
    st["email"] = f"qa{int(time.time())}@test.sa"; st["pw"] = "Test@1234"
    register(pg, "QA Learner", st["email"], "abc", terms=True); check("B04", "weak password rejected", "too weak" in txt(pg) or pg.locator("[role=alert]").count() == 1)
    register(pg, "QA Learner", st["email"], st["pw"], terms=False); check("B05", "terms must be accepted", "accept the terms" in txt(pg))
    register(pg, "QA Learner", st["email"], st["pw"]); check("B06", "valid registration lands on My courses", pg.url.endswith("/en/my-courses"), pg.url)
    check("B07", "header shows Log out after registration", pg.locator("header >> text=Log out").count() == 1)
    pg.reload(); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(500)
    check("B08", "session survives reload", pg.locator("header >> text=Log out").count() == 1)
    logout(pg); register(pg, "QA Dup", st["email"], st["pw"]); check("B09", "duplicate email rejected", "already registered" in txt(pg))
    login(pg, st["email"], "Wrong@123"); check("B10", "wrong password rejected", "Incorrect email or password" in txt(pg))
    login(pg, "nobody@test.sa", st["pw"]); check("B11", "unknown email rejected (same message)", "Incorrect email or password" in txt(pg))
    login(pg, st["email"].upper(), st["pw"]); check("B12", "login is case-insensitive on email", pg.url.endswith("/my-courses"), pg.url)
    logout(pg)
    st["child_email"] = f"qakid{int(time.time())}@test.sa"
    register(pg, "QA Guardian", st["child_email"], st["pw"], child=True); check("B13", "guardian registration succeeds", pg.url.endswith("/my-courses"), pg.url)
    logout(pg)
    goto(pg, "/en/login?next=/en/cart"); pg.locator("input[type=email]").fill(st["email"]); pg.locator("input[autocomplete=current-password]").fill(st["pw"]); pg.locator("form button.btn-gold").click(); pg.wait_for_timeout(700)
    check("B14", "login honours ?next=", pg.url.endswith("/en/cart"), pg.url)
    goto(pg, "/en/login?next=https://evil.example"); pg.locator("input[type=email]").fill(st["email"]); pg.locator("input[autocomplete=current-password]").fill(st["pw"]); pg.locator("form button.btn-gold").click(); pg.wait_for_timeout(700)
    check("B15", "?next= to another site is ignored (open redirect)", "evil.example" not in pg.url, pg.url)
    logout(pg)
    login(pg, "admin@demo.sa", "Admin@1234"); check("B16", "admin lands on /admin", pg.url.endswith("/en/admin"), pg.url)
    logout(pg); login(pg, "mentor@demo.sa", "Mentor@1234"); check("B17", "mentor lands on /mentor", pg.url.endswith("/en/mentor"), pg.url)
    check("B18", "mentor sees Mentor portal button, no Admin button", pg.locator("header >> text=Mentor portal").count() == 1 and pg.locator("header >> text=Admin portal").count() == 0)
    logout(pg); login(pg, "learner@demo.sa", "Demo@1234"); check("B19", "learner lands on My courses, no portal buttons", pg.url.endswith("/my-courses") and pg.locator("header >> text=portal").count() == 0, pg.url)
    for path in ("/en/admin", "/en/admin/courses", "/en/admin/courses/new", "/en/mentor", "/en/mentor/courses"):
        goto(pg, path, 300); check("B20" + path.replace("/", "-"), f"learner blocked from {path}", "No access" in txt(pg) and pg.locator("input").count() == 0)
    logout(pg); login(pg, "admin@demo.sa", "Admin@1234")
    goto(pg, "/en/mentor", 300); check("B21", "admin without mentor role blocked from /mentor", "No access" in txt(pg))
    logout(pg)

def C_commerce(pg, st):
    login(pg, st["email"], st["pw"])
    add_course(pg, "career-launchpad", 0)
    check("C01", "cart badge shows 1", pg.locator("header a[href$='/cart'] span").first.inner_text().strip() == "1")
    pg.reload(); pg.wait_for_timeout(500); check("C02", "cart survives reload", pg.locator("header a[href$='/cart'] span").count() == 1)
    add_course(pg, "career-launchpad", 1); goto(pg, "/en/cart")
    check("C03", "second offering of same course replaces the first", pg.locator("main ul li").count() == 1 and "Blended" in txt(pg))
    add_course(pg, "risk-management-in-practice", 0); goto(pg, "/en/cart")
    check("C04", "two courses in cart", pg.locator("main ul li").count() == 2)
    t = txt(pg)
    nums = [float(x.replace(",", "")) for x in re.findall(r"SAR ([\d,]+(?:\.\d+)?)", t)]
    # lines: 499, 890, subtotal, vat, total
    check("C05", "cart total = sum of lines (VAT included)", 499 + 890 in nums, nums)
    net = round(138900 / 1.15) / 100; vat = round(1389 - net, 2)
    check("C06", f"cart splits VAT 15% correctly (net {net} + VAT {vat})", net in nums and vat in nums, nums)
    pg.locator("main ul li button").first.click(); pg.wait_for_timeout(200); check("C07", "remove line works", pg.locator("main ul li").count() == 1)
    pg.locator("main ul li button").first.click(); pg.wait_for_timeout(200); check("C08", "empty cart state", "Your cart is empty" in txt(pg))
    # buy a real one: recorded career launchpad 299
    add_course(pg, "career-launchpad", 0); goto(pg, "/en/cart"); pg.locator("a.btn-gold").click(); pg.wait_for_url("**/checkout")
    check("C09", "checkout shows 3 payment methods", pg.locator("[role=radio]").count() == 3)
    pg.locator("[role=radio]").nth(1).click(); check("C10", "Apple Pay hides card fields", pg.locator("input[placeholder='MM/YY']").count() == 0)
    pg.locator("[role=radio]").nth(0).click()
    pg.locator("button.btn-gold").click(); pg.wait_for_timeout(300); check("C10b", "payment is blocked until terms are accepted, with a clear error", "Accept the terms and the refund policy" in txt(pg) and "Payment successful" not in txt(pg))
    pg.locator("main input[type=checkbox]").check(); pg.locator("input[placeholder='Card number']").fill("1234 5678 9012 3456"); pg.locator("button.btn-gold").click(); pg.wait_for_timeout(300)
    check("C10c", "invalid card number is rejected with a clear message", "card number is not valid" in txt(pg))
    pg.locator("input[placeholder='Card number']").fill("4242 4242 4242 4242"); pg.locator("input[placeholder='MM/YY']").fill("01/20"); pg.locator("button.btn-gold").click(); pg.wait_for_timeout(300)
    check("C10d", "expired card is rejected with a clear message", "expiry date is invalid" in txt(pg))
    pg.locator("input[placeholder='MM/YY']").fill("12/30"); pg.locator("button.btn-gold").click(); pg.wait_for_timeout(500); check("C11", "button shows processing state", "Processing" in pg.locator("button.btn-gold").inner_text() or pg.locator("text=Payment successful").count() == 1)
    pg.wait_for_timeout(2000)
    check("C12", "payment success page with order + invoice numbers", "Payment successful" in txt(pg) and re.search(r"GBA-\d{4}-\d{5}", txt(pg)) and "INV-" in txt(pg), txt(pg)[:120])
    st["order"] = re.search(r"GBA-\d{4}-\d{5}", txt(pg)).group(0) if re.search(r"GBA-\d{4}-\d{5}", txt(pg)) else ""
    check("C13", "cart is emptied after paying", pg.locator("header a[href$='/cart'] span").count() == 0)
    goto(pg, "/en/my-courses"); check("C14", "purchased course appears in My courses", "Career Launchpad" in txt(pg))
    check("C15", "recorded course shows access end date", "Access ends" in txt(pg))
    # buy again -> rejected
    add_course(pg, "career-launchpad", 0); pg.wait_for_timeout(300); pay_cart(pg)
    check("C16", "buying a course you already own is refused", "already own" in txt(pg) and "Payment successful" not in txt(pg), txt(pg)[:120])
    goto(pg, "/en/cart"); pg.locator("main ul li button").first.click()
    # free course
    add_course(pg, EXP["cheapestSlug"], 0); goto(pg, "/en/cart")
    check("C17", "free course cart total shows Free", "Free" in txt(pg))
    pg.locator("a.btn-gold").click(); pg.wait_for_url("**/checkout"); pg.locator("main input[type=checkbox]").check(); pg.locator("button.btn-gold").click(); pg.wait_for_timeout(1000)
    check("C18", "free course can be 'bought' without an invoice", "Payment successful" in txt(pg) and "INV-" not in txt(pg), txt(pg)[:120])
    # learning
    goto(pg, "/en/learn/little-project-heroes"); pg.wait_for_timeout(500); check("C20", "learn page for a course not owned prompts to enrol", pg.locator("text=Enrol now").count() == 1)
    goto(pg, "/en/learn/career-launchpad"); pg.wait_for_timeout(600)
    n = pg.locator("aside button").count(); check("C21", "learn page lists all lessons", n == next(c["lessons"] for c in EXP["slugs"] if c["slug"] == "career-launchpad"), n)
    for i in range(n):
        pg.locator("aside button").nth(i).click(); pg.wait_for_timeout(80)
        btn = pg.locator("main button.btn-gold")
        if btn.is_enabled(): btn.click(); pg.wait_for_timeout(120)
    pg.locator("main button.btn-gold").first.click() if pg.locator("main button.btn-gold").first.is_enabled() else None
    check("C22", "completing every lesson reaches 100% and issues a certificate code", re.search(r"GBA-[A-Z0-9]{6}", txt(pg)) is not None, txt(pg)[-160:])
    goto(pg, "/en/my-courses"); pg.locator("[role=tab]").nth(2).click(); pg.wait_for_timeout(200)
    check("C23", "finished course moves to Completed tab with certificate code", "Career Launchpad" in txt(pg) and "Verification code" in txt(pg))
    goto(pg, "/en/my-courses"); pg.locator("[role=tab]").nth(2).click(); pg.wait_for_timeout(200)
    check("C23b", "completed course shows a green 100% progress state", pg.locator("[role=progressbar][aria-valuenow='100']").count() == 1 and "Completed" in txt(pg))
    pg.locator("main a:has-text('View certificate')").first.click(); pg.wait_for_url("**/certificate/**"); pg.wait_for_timeout(800)
    t = txt(pg); check("C23c", "certificate shows learner, course, date, code, mentor and academy sign-off", st["email"] and "QA Learner" in t and "Career Launchpad" in t and re.search(r"GBA-[A-Z0-9]{6}", t) and "Mentor" in t and "Academy management" in t, t[:200])
    check("C23d", "certificate has an academy stamp and two signature slots", pg.locator("svg[aria-label='Academy stamp']").count() == 1 and pg.locator("#certificate svg").count() >= 3)
    check("C23e", "print button present", pg.locator("button:has-text('Print')").count() == 1)
    goto(pg, "/en/certificate/GBA-NOPE00"); check("C23f", "unknown certificate code says not found", "could not find" in txt(pg))
    # reviews
    goto(pg, "/en/courses/career-launchpad"); n0 = pg.locator("main li.card").count()
    pg.locator("textarea").fill("short"); pg.locator("button:has-text('Submit')").click(); pg.wait_for_timeout(200)
    check("C24a", "too-short review is rejected with a clear message", "at least 10 characters" in txt(pg))
    pg.locator("textarea").fill("QA review: great course"); pg.locator("button:has-text('Submit')").click(); pg.wait_for_timeout(400)
    check("C24", "enrolled learner can post a review and it appears", pg.locator("main li.card").count() == n0 + 1 and "QA review" in txt(pg))
    goto(pg, "/en/courses/strategic-programme-leadership"); n0 = pg.locator("main li.card").count()
    pg.locator("textarea").fill("should not post"); pg.locator("button:has-text('Submit')").click(); pg.wait_for_timeout(400)
    check("C25", "non-enrolled learner cannot post a review", pg.locator("main li.card").count() == n0 and "enrolling" in txt(pg), txt(pg)[-100:])
    logout(pg); goto(pg, "/en/courses/career-launchpad"); check("C26", "anonymous visitors see no review form", pg.locator("textarea").count() == 0)
    st["bought"] = True

def D_admin(pg, st):
    login(pg, "admin@demo.sa", "Admin@1234")
    t = txt(pg); check("D01", "dashboard renders stat cards", pg.locator("main .card").count() >= 8)
    check("D02", f"dashboard counts {EXP['total']} courses and {EXP['mentors']} mentors", str(EXP["total"]) in t and str(EXP["mentors"]) in t, t[:200])
    check("D03", "dashboard revenue reflects the test purchase (299)", "SAR 299" in t, t[:300])
    goto(pg, "/en/admin/courses"); check("D04", "course list shows all courses", pg.locator("tbody tr").count() == EXP["total"], pg.locator("tbody tr").count())
    pg.locator("input[placeholder]").first.fill("Negotiation"); pg.wait_for_timeout(200); check("D05", "course list search filters rows", pg.locator("tbody tr").count() == 1)
    # create course
    slug = f"qa-course-{int(time.time()) % 100000}"; st["slug"] = slug
    goto(pg, "/en/admin/courses/new")
    pg.get_by_label("Slug (English)").fill(slug)
    pg.locator("input[lang=ar]").first.fill("دورة الجودة"); pg.locator("input[lang=en]").first.fill("QA Course")
    pg.locator("label:has(> span:text-is('Mentor')) select").select_option(index=1)
    pg.get_by_label("Hours").fill("5")
    pg.locator("button:has-text('Add offering')").click()
    pg.get_by_label("Price (SAR)").first.fill("123.45")
    pg.locator("button:has-text('Add offering')").click()
    pg.get_by_label("Format").nth(1).select_option("live")
    pg.locator("button:has-text('Add session')").click()
    pg.locator("input[type=datetime-local]").fill("2027-03-01T18:30")
    pg.get_by_label("Price (SAR)").nth(1).fill("500")
    pg.locator("main button:has-text('Save')").first.click(); pg.wait_for_timeout(800)
    check("D10", "create course saves and redirects to its edit page", f"/admin/courses/c-{slug}" in pg.url, pg.url)
    goto(pg, f"/en/admin/courses/c-{slug}")
    check("D11", "created course keeps title, price 123.45 and the live session", pg.locator("input[lang=en]").first.input_value() == "QA Course" and pg.get_by_label("Price (SAR)").first.input_value() == "123.45" and pg.locator("input[type=datetime-local]").count() == 1, pg.get_by_label("Price (SAR)").first.input_value())
    check("D12", "session time round-trips in Riyadh time", pg.locator("input[type=datetime-local]").input_value() == "2027-03-01T18:30", pg.locator("input[type=datetime-local]").input_value())
    check("D13", "slug is locked after creation", pg.get_by_label("Slug (English)").is_disabled())
    goto(pg, "/en/admin/courses"); check("D14", "course list now has +1", pg.locator("tbody tr").count() == EXP["total"] + 1, pg.locator("tbody tr").count())
    goto(pg, "/en/admin/courses/new"); pg.get_by_label("Slug (English)").fill(slug); pg.locator("input[lang=en]").first.fill("Dup"); pg.locator("label:has(> span:text-is('Mentor')) select").select_option(index=1); pg.locator("main button:has-text('Save')").first.click(); pg.wait_for_timeout(500)
    check("D15", "duplicate slug is refused with a message", "already used" in txt(pg), txt(pg)[:150])
    goto(pg, f"/en/admin/courses/c-{slug}"); pg.locator("input[lang=en]").first.fill("QA Course EDITED"); pg.locator("main button:has-text('Save')").first.click(); pg.wait_for_timeout(500)
    goto(pg, f"/en/admin/courses/c-{slug}"); check("D16", "edit persists after reload", pg.locator("input[lang=en]").first.input_value() == "QA Course EDITED")
    # syllabus editing
    pg.locator("button:has-text('Add module')").click(); pg.locator("button:has-text('Add lesson')").click()
    check("D17", "syllabus editor adds module and lesson rows", pg.locator("input[placeholder*='Lesson title']").count() == 2)
    pg.locator("main button:has-text('Save')").first.click(); pg.wait_for_timeout(500)
    # unpublish
    goto(pg, "/en/admin/courses"); pg.locator("input[placeholder]").first.fill("QA Course"); pg.wait_for_timeout(200)
    pg.locator("tbody tr").first.locator("button").click(); pg.wait_for_timeout(300)
    check("D18", "course can be hidden (badge changes)", "Hidden" in pg.locator("tbody tr").first.inner_text())
    # mentors
    goto(pg, "/en/admin/mentors"); n0 = pg.locator("tbody tr").count()
    pg.locator("button:has-text('New mentor')").click()
    pg.get_by_label("Slug (English)").fill("qa-mentor"); pg.locator("input[lang=en]").first.fill("QA Mentor"); pg.locator("input[lang=ar]").first.fill("مرشد الجودة")
    pg.locator("main button:has-text('Save')").first.click(); pg.wait_for_timeout(500)
    check("D20", "mentor created", pg.locator("tbody tr").count() == n0 + 1, pg.locator("tbody tr").count())
    # users and roles
    goto(pg, "/en/admin/users"); check("D21", "users list includes test learners", st["email"] in txt(pg).lower() and st["child_email"] in txt(pg).lower())
    row = pg.locator("tbody tr", has_text=st["child_email"]); check("D22", "guardian registration is flagged", "Guardian" in row.inner_text())
    row = pg.locator("tbody tr", has_text=st["email"]); row.locator("label:has-text('Mentor')").click(); pg.wait_for_timeout(300)
    check("D23", "admin can grant Mentor role", "bg-navy" in pg.locator("tbody tr", has_text=st["email"]).locator("label:has-text('Mentor')").get_attribute("class"))
    pg.locator("tbody tr", has_text="admin@demo.sa").locator("label:has-text('Admin')").click(); pg.wait_for_timeout(300)
    check("D24", "admin cannot remove own admin role", "cannot remove your own admin" in txt(pg).lower(), txt(pg)[:200])
    # reviews
    goto(pg, "/en/admin/reviews"); n = pg.locator("main li.card").count(); check("D30", "reviews list shows seed + test review", n >= EXP["reviews"] + 1, n)
    card = pg.locator("main li.card:has(input)").first; card.locator("input").fill("Thank you!"); card.locator("button.btn-navy").click(); pg.wait_for_timeout(300)
    check("D31", "mentor reply can be added", "Thank you!" in txt(pg))
    pg.locator("main li.card").first.locator("button:has-text('Delete review')").click(); pg.wait_for_timeout(300)
    check("D32", "review can be deleted", pg.locator("main li.card").count() == n - 1)
    goto(pg, "/en/admin/orders"); check("D40", "orders list shows the purchase with VAT", st["order"] in txt(pg) and "SAR 39" in txt(pg), txt(pg)[:200])
    logout(pg)
    # promoted user sees mentor portal but no profile yet
    login(pg, st["email"], st["pw"]); goto(pg, "/en/mentor", 400)
    check("D50", "user promoted to mentor without linked profile sees 'not linked'", "not linked" in txt(pg).lower(), txt(pg)[:150])
    logout(pg)
    login(pg, "admin@demo.sa", "Admin@1234"); goto(pg, "/en/admin/mentors")
    pg.locator("tbody tr", has_text="QA Mentor").locator("button").click(); pg.get_by_label("Linked login account").fill(st["email"]); pg.locator("main button:has-text('Save')").first.click(); pg.wait_for_timeout(500)
    check("D51", "admin links a mentor profile to a login", st["email"] in txt(pg).lower(), txt(pg)[:150])
    logout(pg); login(pg, st["email"], st["pw"]); goto(pg, "/en/mentor", 400)
    check("D52", "after linking, the same login opens the mentor portal", "Overview" in txt(pg, "body") and pg.locator("input").count() == 0 or "Learners" in txt(pg, "body"), txt(pg)[:150])
    logout(pg)

def E_mentor(pg, st):
    login(pg, "mentor@demo.sa", "Mentor@1234")
    goto(pg, "/en/mentor/courses"); n = pg.locator("tbody tr").count(); check("E01", "mentor sees only own courses (3 seeded + the 1 admin created for them)", n == 4, n)
    t = txt(pg); check("E02", "other mentors' courses are not listed", "Little Project Heroes" not in t and "Negotiation" not in t)
    goto(pg, "/en/mentor/courses/c-little-project-heroes", 600); check("E03", "direct URL to another mentor's course shows nothing", pg.locator("input[lang=en]").count() == 0)
    goto(pg, "/en/mentor/courses/c-career-launchpad", 600)
    check("E04", "restricted editor: price, slug, audience, flags are disabled", pg.get_by_label("Price (SAR)").first.is_disabled() and pg.get_by_label("Slug (English)").is_disabled() and pg.get_by_label("Audience").is_disabled())
    check("E05", "restricted editor: cannot add or remove offerings", pg.locator("button:has-text('Add offering')").count() == 0)
    price_before = pg.get_by_label("Price (SAR)").first.input_value()
    pg.locator("input[lang=en]").first.fill("Career Launchpad (mentor edit)"); pg.locator("main button:has-text('Save')").first.click(); pg.wait_for_timeout(500)
    goto(pg, "/en/mentor/courses/c-career-launchpad", 600)
    check("E06", "mentor edit saved, price unchanged", pg.locator("input[lang=en]").first.input_value() == "Career Launchpad (mentor edit)" and pg.get_by_label("Price (SAR)").first.input_value() == price_before)
    goto(pg, "/en/mentor/courses/c-strategic-programme-leadership", 600)
    live = pg.locator("input[type=datetime-local]"); n0 = live.count()
    pg.locator("button:has-text('Add session')").first.click(); pg.locator("input[type=datetime-local]").last.fill("2027-04-01T10:00"); pg.locator("main button:has-text('Save')").first.click(); pg.wait_for_timeout(500)
    goto(pg, "/en/mentor/courses/c-strategic-programme-leadership", 600)
    check("E07", "mentor can add a live session", pg.locator("input[type=datetime-local]").count() == n0 + 1, (n0, pg.locator("input[type=datetime-local]").count()))
    goto(pg, "/en/mentor/sessions"); check("E08", "sessions page lists sessions with join buttons", pg.locator("main li.card").count() >= 5 and pg.locator("button:has-text('Join session')").count() >= 5)
    goto(pg, "/en/mentor/learners"); t = txt(pg)
    check("E09", "learners list shows the learner who bought the course (name only)", "QA Learner" in t or "Demo" in t or "متعلم" in t, t[:200])
    check("E10", "learners list exposes no email addresses", "@" not in t, re.findall(r"\S+@\S+", t)[:2])
    goto(pg, "/en/mentor/reviews"); n = pg.locator("main li.card").count(); check("E11", "reviews only for own courses", n >= 1)
    card = pg.locator("main li.card:has(input)").first; card.locator("input").fill("Mentor reply QA"); card.locator("button.btn-navy").click(); pg.wait_for_timeout(300)
    check("E12", "mentor can reply to a review", "Mentor reply QA" in txt(pg))
    check("E13", "mentor has no delete-review control", pg.locator("button:has-text('Delete review')").count() == 0)
    goto(pg, "/en/mentor/profile"); pg.locator("textarea[lang=en]").fill("Updated bio QA"); pg.locator("main button:has-text('Save')").first.click(); pg.wait_for_timeout(300)
    check("E14", "mentor can edit own profile", "Saved" in txt(pg))
    goto(pg, "/en/mentor"); check("E15", "mentor overview shows sales from the test purchase", "SAR 299" in txt(pg), txt(pg)[:300])
    goto(pg, "/en/admin", 300); check("E16", "mentor cannot open admin", "No access" in txt(pg))
    logout(pg)

# ============================================================== F. mobile / responsive
def F_mobile(ctx, pg, ):
    pg.set_viewport_size({"width": 390, "height": 844})
    pages = ["/ar", "/en", "/ar/courses", "/en/courses?audience=kids", "/ar/courses/career-launchpad", "/en/courses/little-project-heroes", "/ar/mentors", "/en/mentors/layla-al-harbi", "/ar/login", "/ar/register", "/en/cart"]
    for p in pages:
        goto(pg, p, 300)
        over = pg.evaluate("""() => { const w = document.documentElement.clientWidth; const bad = []; document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.width > 0 && (r.right > w + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed' && !e.closest('[class*=overflow-x]') && !e.closest('svg')) bad.push(e.tagName + '.' + (e.className||'').toString().slice(0,40)); }); return [document.documentElement.scrollWidth > w + 1, bad.slice(0,3)]; }""")
        check("F01" + p.replace("/", "-"), f"mobile 390px no horizontal overflow {p}", not over[0], over)
    login(pg, "admin@demo.sa", "Admin@1234"); 
    for p in ("/ar/admin", "/ar/admin/courses", "/ar/admin/courses/c-career-launchpad", "/ar/admin/users"):
        goto(pg, p, 400); w = pg.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
        check("F02" + p.replace("/", "-"), f"mobile admin page not overflowing the viewport {p}", not w)
    pg.screenshot(path=os.path.join(OUT, "mobile-admin-users.png"))
    logout(pg); login(pg, "mentor@demo.sa", "Mentor@1234")
    for p in ("/ar/mentor", "/ar/mentor/sessions"):
        goto(pg, p, 400); w = pg.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
        check("F03" + p.replace("/", "-"), f"mobile mentor page not overflowing {p}", not w)
    logout(pg)
    goto(pg, "/ar"); pg.locator("header button[aria-label=Menu]").click(); pg.wait_for_timeout(200)
    check("F04", "mobile menu opens with nav links", pg.locator("header nav[aria-label=Mobile] a").count() >= 6)
    pg.set_viewport_size({"width": 820, "height": 1100}); goto(pg, "/en/courses", 300)
    check("F05", "tablet 820px: no horizontal overflow on catalogue", not pg.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"))
    pg.set_viewport_size({"width": 1360, "height": 900})

# ============================================================== G. quality: a11y, links, console, perf
def G_quality(ctx, pg):
    pages = ["/ar", "/en", "/ar/courses", "/en/courses/career-launchpad", "/en/mentors", "/en/mentors/layla-al-harbi", "/en/login", "/en/register", "/en/cart"]
    for p in pages:
        goto(pg, p, 300)
        r = pg.evaluate("""() => ({
          noalt: [...document.images].filter(i => !i.hasAttribute('alt')).length,
          h1: document.querySelectorAll('h1').length,
          title: document.title.length > 3,
          lang: !!document.documentElement.lang,
          btn: [...document.querySelectorAll('button,a')].filter(e => !(e.innerText||'').trim() && !e.getAttribute('aria-label') && !e.querySelector('img[alt]:not([alt=""])') && !e.getAttribute('title')).length,
          inp: [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea,select')].filter(i => !i.getAttribute('aria-label') && !i.closest('label') && !(i.id && document.querySelector('label[for="'+i.id+'"]'))).length,
        })""")
        check("G01" + p.replace("/", "-"), f"a11y basics {p} (alt, one h1, title, names, labels)", r["noalt"] == 0 and r["h1"] == 1 and r["title"] and r["lang"] and r["btn"] == 0 and r["inp"] == 0, r)
    # links crawl
    hrefs = set()
    for p in ("/en", "/en/courses", "/en/courses/career-launchpad", "/en/mentors", "/ar"):
        goto(pg, p, 200)
        for h in pg.eval_on_selector_all("a[href]", "els => els.map(e => e.getAttribute('href'))"):
            if h.startswith("/") and not h.startswith("//"): hrefs.add(h)
    broken = []
    for h in sorted(hrefs):
        r = ctx.request.get(BASE + h)
        if r.status >= 400: broken.append((h, r.status))
    check("G02", f"no broken internal links ({len(hrefs)} checked)", not broken, broken[:5])
    # security headers / basic
    r = ctx.request.get(BASE + "/en")
    check("G03", "no server version leak in X-Powered-By", "x-powered-by" not in {k.lower() for k in r.headers}, r.headers.get("x-powered-by"))
    # performance snapshot
    pg2 = new_page(ctx); sizes = {"b": 0}
    pg2.on("response", lambda resp: sizes.__setitem__("b", sizes["b"] + int(resp.headers.get("content-length", "0") or 0)))
    t0 = time.time(); pg2.goto(BASE + "/en"); pg2.wait_for_load_state("networkidle"); dt = time.time() - t0
    nav = pg2.evaluate("(() => { const n = performance.getEntriesByType('navigation')[0]; return [Math.round(n.domContentLoadedEventEnd), Math.round(n.loadEventEnd)]; })()")
    check("G04", "home loads in < 3s locally (informational: DCL/load ms, KB)", dt < 3, {"dcl_load_ms": nav, "kb": round(sizes["b"] / 1024)})
    pg2.close(); page_ref["pg"] = pg
    # console errors overall
    errs = [e for e in console_errors if "favicon" not in e[1]]
    errs = [e for e in errs if not ("404" in e[1] and any(k in e[0] for k in ("does-not-exist", "/nope", "/fr")))]
    uniq = sorted({(re.sub(r"https?://[^/]+", "", u).split("?")[0], m[:90]) for u, m in errs})
    check("G05", "no JavaScript / console errors during the whole run", not uniq, uniq[:6])

def H_new(b):
    ctx = b.new_context(viewport={"width": 1360, "height": 900}); pg = new_page(ctx)
    goto(pg, "/en")
    check("H01", "hero shows founder photo with alt text", pg.locator("img[alt='Badr Burshaid']").count() == 1 and pg.evaluate("document.querySelector(\"img[alt='Badr Burshaid']\").naturalWidth") > 100)
    check("H02", "hero shows slogan, founder quote and signature placeholder", "Learn by doing" in txt(pg) and pg.locator("figure:has(span:text-is(\"Signature\")) blockquote").count() == 1 and pg.locator("text=Signature").count() >= 1)
    check("H03", "sample-wording notice is visible while content is a draft", "pending approval" in txt(pg))
    check("H04", "footer shows licence numbers flagged as sample data", all(x in pg.locator("footer").inner_text() for x in ("1010000000", "300000000000003", "TVTC-0000000", "Sample data")))
    bg = pg.evaluate("getComputedStyle(document.body).backgroundColor"); hb = pg.evaluate("getComputedStyle(document.querySelector('header')).backgroundColor"); fb = pg.evaluate("getComputedStyle(document.querySelector('footer')).backgroundColor")
    lum = lambda sel: pg.evaluate("(s) => { const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0,0,1,1); const el = s === 'body' ? document.body : document.querySelector(s); x.fillStyle = getComputedStyle(el).backgroundColor; x.fillRect(0,0,1,1); const d = x.getImageData(0,0,1,1).data; return 0.2126*d[0]+0.7152*d[1]+0.0722*d[2]; }", sel)
    ls = [lum("body"), lum("header"), lum("footer")]
    check("H05", "default surfaces are light/cream (body, header, footer luminance > 225)", all(v > 225 for v in ls), ls)
    for loc in ("en", "ar"):
        for d in ("terms", "privacy", "refund"):
            r = pg.goto(f"{BASE}/{loc}/legal/{d}"); pg.wait_for_load_state("networkidle")
            check(f"H10-{loc}-{d}", f"legal page {loc}/{d} renders with sections and company details", r.status == 200 and pg.locator("article section").count() >= 5 and "1010000000" in txt(pg) and pg.locator("h1").count() == 1)
    goto(pg, "/en/register")
    check("H11", "register form links to terms and privacy", pg.locator("form a[href$='/legal/terms']").count() == 1 and pg.locator("form a[href$='/legal/privacy']").count() == 1)
    pg.locator("form button.btn-gold").click(); pg.wait_for_timeout(400)
    errs = pg.locator("form [role=alert]").all_inner_texts()
    check("H12", "empty register shows an error under every required field", len(errs) >= 4, errs)
    check("H13", "a toast summarises the problem", pg.locator("[aria-live] [role=alert]").count() >= 1)
    check("H14", "first invalid field gets focus", pg.evaluate("document.activeElement && document.activeElement.getAttribute('aria-invalid')") == "true")
    pg.locator("input[autocomplete=email]").fill("bad@x"); pg.locator("input[autocomplete=tel]").fill("123"); pg.locator("input[autocomplete=name]").click(); pg.wait_for_timeout(200)
    t = txt(pg, "form"); check("H15", "email and mobile errors explain the expected format", "name@example.com" in t and "05" in t)
    pg.locator("input[autocomplete=new-password]").fill("abcdefgh"); pg.wait_for_timeout(150)
    check("H16", "password checklist reflects rules live", "✓ At least 8" in txt(pg, "form") or "✓ 8" in txt(pg, "form"), txt(pg, "form")[-300:])
    goto(pg, "/en/login"); pg.locator("form button.btn-gold").click(); pg.wait_for_timeout(300)
    check("H17", "empty login shows email and password errors", pg.locator("form [role=alert]").count() >= 2)
    login(pg, "learner@demo.sa", "Demo@1234"); check("H18", "login shows a welcome toast", pg.locator("[aria-live] >> text=Welcome back").count() == 1)
    pg.locator("header button:has-text('Log out')").click(); pg.wait_for_timeout(300); check("H19", "logout shows a toast", pg.locator("[aria-live] >> text=logged out").count() == 1)
    ctx.close()

def main():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROMIUM)
        scenario("A", A_public, b)
        flows(b)
        scenario("H", H_new, b)
        b.close()
    passed = sum(r["pass"] for r in results)
    print(f"\n{passed}/{len(results)} checks passed")
    json.dump({"base": BASE, "passed": passed, "total": len(results), "results": results}, open(os.path.join(OUT, "results.json"), "w"), indent=1)
    sys.exit(0 if passed == len(results) else 1)

if __name__ == "__main__":
    main()
