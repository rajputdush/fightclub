(function () {
  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var rupee = function (n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); };
  function hash(str) {
    var h = 7;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 9973;
    return h + 1;
  }
  function today() {
    return new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  /* nav: mark the current page */
  var page = document.body.getAttribute("data-page");
  document.querySelectorAll(".nav a[data-page]").forEach(function (a) {
    if (a.getAttribute("data-page") === page) a.setAttribute("aria-current", "page");
  });

  /* countdown to the next Friday 9 PM, in the viewer's own time */
  if ($("digits")) {
    var nextBell = function () {
      var now = new Date();
      var t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0, 0, 0);
      t.setDate(t.getDate() + (5 - now.getDay() + 7) % 7);
      if (t <= now) t.setDate(t.getDate() + 7);
      return t;
    };
    var target = nextBell();
    var tick = function () {
      var diff = target - new Date();
      if (diff <= 0) { target = nextBell(); diff = target - new Date(); }
      var s = Math.floor(diff / 1000);
      $("d").textContent = pad(Math.floor(s / 86400));
      $("h").textContent = pad(Math.floor(s % 86400 / 3600));
      $("m").textContent = pad(Math.floor(s % 3600 / 60));
      $("s").textContent = pad(s % 60);
    };
    tick();
    setInterval(tick, 1000);
    try {
      $("when").textContent = target.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) + ", 9 PM, your local time.";
    } catch (e) {}
  }

  /* membership card */
  if ($("form-member")) {
    $("form-member").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("name").value.trim();
      if (!name) return;
      var alias = $("alias").value.trim();
      var cls = $("cls").value;
      $("cName").textContent = name;
      $("cAlias").textContent = alias || "None. The crowd will pick one.";
      $("cCls").textContent = cls;
      $("cDay").textContent = $("day").value.trim() || "Classified";
      $("no").textContent = "No. " + ("0000" + hash(name.toLowerCase() + alias.toLowerCase() + cls)).slice(-4);
      $("cDate").textContent = today();
      $("seal").hidden = false;
      $("member").classList.remove("blank");
    });
    $("cls").addEventListener("change", function () {
      if ($("member").classList.contains("blank")) $("cCls").textContent = this.value;
    });
  }

  /* challenge slip */
  if ($("form-challenge")) {
    var text = "";
    $("form-challenge").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("ring").value.trim();
      var purse = Math.round(Number($("purse").value));
      if (!name || !(purse >= 100)) { $("cmsg").textContent = "Add a ring name and a purse of at least ₹100."; return; }
      var foe = $("foe").value.trim() || "Anyone brave enough";
      var cls = $("cls").value;
      var where = $("where").value.trim() || "Friday, 9 PM, basement level";
      var line = $("line").value.trim();
      $("sName").textContent = name;
      $("sFoe").textContent = foe;
      $("sCls").textContent = cls;
      $("sWhere").textContent = where;
      $("sLine").textContent = line || "No comment.";
      $("sPurse").textContent = rupee(purse);
      $("sNo").textContent = "No. " + ("0000" + hash(name.toLowerCase() + foe.toLowerCase() + purse)).slice(-4);
      $("sDate").textContent = today();
      $("slip").classList.remove("blank");
      $("sSeal").hidden = false;
      text = "FIGHTIN CHALLENGE " + $("sNo").textContent + "\n" +
        name + " challenges " + foe + "\n" +
        cls + " | Purse " + rupee(purse) + ", winner takes all\n" +
        where + (line ? "\n“" + line + "”" : "") + "\n" +
        "Gloves on. Tap means done. Purse with the referee before the bell.";
      $("shareText").value = text;
      $("share").hidden = false;
      $("cmsg").textContent = "";
    });
    $("copy").addEventListener("click", function () {
      var ta = $("shareText");
      var fallback = function () { ta.focus(); ta.select(); $("cmsg").textContent = "Press copy on your keyboard to finish."; };
      try {
        navigator.clipboard.writeText(ta.value).then(function () { $("cmsg").textContent = "Copied. Send it to your opponent."; }, fallback);
      } catch (err) { fallback(); }
    });
  }

  /* roster filter */
  if ($("roster")) {
    var fighters = [
      { n: "Night Shift", c: "70 to 80 kg", w: 9, l: 1, won: 64000, q: "Sleeps in the day and swings at night." },
      { n: "Landlord", c: "80 kg and over", w: 11, l: 3, won: 92000, q: "Collects on the first of every month." },
      { n: "The Auditor", c: "Under 60 kg", w: 7, l: 2, won: 38000, q: "Counts every punch twice." },
      { n: "Meera", c: "70 to 80 kg", w: 6, l: 2, won: 41500, q: "Never throws a punch she cannot explain." },
      { n: "Tuesday", c: "60 to 70 kg", w: 5, l: 4, won: 21500, q: "Nobody remembers when she shows up." },
      { n: "Big Sandeep", c: "60 to 70 kg", w: 4, l: 3, won: 18000, q: "Not big. The name came first." },
      { n: "His Inbox", c: "80 kg and over", w: 3, l: 5, won: 12000, q: "Always one more round to catch up on." },
      { n: "Unpaid Intern", c: "80 kg and over", w: 2, l: 6, won: 5000, q: "Fighting for the experience." },
      { n: "Kabir", c: "Under 60 kg", w: 8, l: 3, won: 47000, q: "Talks less every time he wins." }
    ];
    var filter = "All";
    var draw = function () {
      var ul = $("roster");
      ul.replaceChildren();
      fighters.filter(function (f) { return filter === "All" || f.c === filter; })
        .sort(function (a, b) { return b.won - a.won; })
        .forEach(function (f) {
          var li = document.createElement("li");
          li.className = "fighter";
          var h = document.createElement("h3"); h.textContent = f.n;
          var c = document.createElement("div"); c.className = "cls"; c.textContent = f.c;
          var rec = document.createElement("div"); rec.className = "rec";
          [[f.w, "Wins"], [f.l, "Losses"], [rupee(f.won), "Won"]].forEach(function (p) {
            var d = document.createElement("div");
            var b = document.createElement("b"); b.textContent = p[0];
            var s = document.createElement("small"); s.textContent = p[1];
            d.appendChild(b); d.appendChild(s); rec.appendChild(d);
          });
          var q = document.createElement("p"); q.textContent = "“" + f.q + "”";
          li.appendChild(h); li.appendChild(c); li.appendChild(rec); li.appendChild(q);
          ul.appendChild(li);
        });
    };
    document.querySelectorAll("#filters button").forEach(function (b) {
      b.addEventListener("click", function () {
        filter = b.getAttribute("data-cls");
        document.querySelectorAll("#filters button").forEach(function (x) {
          x.setAttribute("aria-pressed", x === b ? "true" : "false");
        });
        draw();
      });
    });
    draw();
  }
})();
