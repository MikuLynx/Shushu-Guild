// ---- EDIT THIS FILE ----

// REGISTRATION SWITCH:  true = registration form is open
//                       false = visitors see the "Registration is full" page (regis_full.html)
window.REGISTRATION_OPEN = false;

// 1) Google Sheets connection. Paste your Google Apps Script "Web app" URL here
//    (see the setup steps). Leave "" until it is ready.
window.SHEET_URL = "https://script.google.com/macros/s/AKfycbzPiTsidtqgk46sDp1iBgYXA0pzuxphzWBka9QEpzaLDmQwakjiVRGVLBC2X__NxKtffA/exec";

// 2) Schedule — Han-Wei Clash. Times are in UTC, format "YYYY-MM-DD HH:MM".
//    Visitors see them converted to their own time zone automatically.
window.SCHEDULE = [
  { event: "Warband Formation",           utc: "2026-11-22 16:00", notes: "Form your warband" },
  { event: "Zone Matching",               utc: "2026-11-24 16:00", notes: "" },
  { event: "Match Notice",                utc: "2026-11-27 08:00", notes: "Opponent announced" },
  { event: "Han-Wei Clash — Season Opens", utc: "2026-11-28 02:00", notes: "New season starts" }
];

// 3) Season phases ("Realm Status" in the game). All times are UTC, "YYYY-MM-DD HH:MM".
//    rules = phase rules, unlocks = features/events that open, ch = challenges and the reward for finishing them.
//    Card-pool (gacha banner) info is intentionally NOT listed here.
window.PHASES = [
 {
  "n": 1,
  "name": "Seize the Season",
  "start": "",
  "end": "2026-11-28 06:02",
  "tag": "New Server Day",
  "rules": [
   "Stamina, Resources, and Farming Orders will not auto-recover"
  ],
  "unlocks": [],
  "ch": [
   {
    "type": "Server",
    "task": "Occupy 100 Lv.2+ resource sites server-wide",
    "reward": "Scroll ×2"
   }
  ]
 },
 {
  "n": 2,
  "name": "Majestic Army",
  "start": "2026-11-28 06:02",
  "end": "2026-11-28 12:00",
  "rules": [
   "Stamina, Resources, and Farming Orders will recover normally",
   "Resource Sites can be developed up to Lv.10"
  ],
  "unlocks": [
   {
    "name": "Site Development",
    "desc": "Unlocks Resource Site Development feature",
    "utc": "",
    "on": false
   }
  ],
  "ch": [
   {
    "type": "Personal",
    "task": "Clear Bandit Suppression Chapter 3",
    "reward": "Scroll ×2"
   },
   {
    "type": "Server",
    "task": "Occupy 100 Resource Sites at Lv.3 or higher server-wide",
    "reward": "Scroll ×2"
   }
  ]
 },
 {
  "n": 3,
  "name": "United Beacon",
  "start": "2026-11-28 12:00",
  "end": "2026-11-30 04:00",
  "rules": [
   "Failed Siege in this phase returns War Declaration Order"
  ],
  "unlocks": [
   {
    "name": "Capture City",
    "desc": "Unlock City War Declaration",
    "utc": "",
    "on": false
   }
  ],
  "ch": [
   {
    "type": "Personal",
    "task": "Clear Bandit Suppression Chapter 5",
    "reward": "Scroll ×2"
   },
   {
    "type": "Alliance",
    "task": "Occupy 1 City of Lv.1 or above",
    "reward": "Gold Ingot ×100"
   },
   {
    "type": "Server",
    "task": "Occupy 1,000 Lv.5+ resource sites server-wide",
    "reward": "Scroll ×2"
   }
  ]
 },
 {
  "n": 4,
  "name": "Formulating Strategies",
  "start": "2026-11-30 04:00",
  "end": "2026-12-02 04:00",
  "rules": [
   "Increase the daily purchase limit in Merit Store",
   "Failed Siege: No Declaration Order"
  ],
  "unlocks": [
   {
    "name": "Crusade against Qingzhou Bandits",
    "desc": "",
    "utc": "2026-12-01 04:00",
    "on": true
   },
   {
    "name": "Cross-State Alliance",
    "desc": "Opens",
    "utc": "2026-11-30 17:00",
    "on": false
   }
  ],
  "ch": [
   {
    "type": "Personal",
    "task": "Clear Bandit Suppression Chapter 8",
    "reward": "Scroll ×2"
   },
   {
    "type": "Alliance",
    "task": "Occupy 1 City of Lv.2 or above",
    "reward": "Gold Ingot ×100"
   },
   {
    "type": "Server",
    "task": "Occupy 1,000 Lv.8+ resource sites server-wide",
    "reward": "Scroll ×2"
   }
  ]
 },
 {
  "n": 5,
  "name": "Plan and Conquer",
  "start": "2026-12-02 04:00",
  "end": "2026-12-04 04:00",
  "rules": [
   "Unlock Weekly Purchase Limit items in Merit Store",
   "Unlock Tunnel Teleport Feature",
   "Increases the daily limit of elixirs crafted with Healer"
  ],
  "unlocks": [
   {
    "name": "Capture Pass",
    "desc": "Lv.2 State Open",
    "utc": "",
    "on": false
   },
   {
    "name": "Exclusive Weapon",
    "desc": "Unlock Officer Gear Feature",
    "utc": "",
    "on": false
   },
   {
    "name": "Resonance",
    "desc": "EXP from Player Duels",
    "utc": "",
    "on": false
   }
  ],
  "ch": [
   {
    "type": "Personal",
    "task": "Clear Bandit Suppression Chapter 14",
    "reward": "Scroll ×2"
   },
   {
    "type": "Alliance",
    "task": "Occupy 1 City of Lv.3 or above",
    "reward": "Gold Ingot ×100"
   },
   {
    "type": "Server",
    "task": "Occupy 1,000 Lv.9+ resource sites server-wide",
    "reward": "Scroll ×2"
   }
  ]
 },
 {
  "n": 6,
  "name": "Fight for Every Inch",
  "start": "2026-12-04 04:00",
  "end": "2026-12-07 04:00",
  "rules": [
   "Qingzhou Bandits upgraded to Lv.2",
   "Resource Sites can be developed up to Lv.14"
  ],
  "unlocks": [
   {
    "name": "Barbarian King's Rebellion",
    "desc": "Opens",
    "utc": "2026-12-05 17:00",
    "on": false
   },
   {
    "name": "Strategic Clash",
    "desc": "Opens",
    "utc": "2026-12-05 17:00",
    "on": false
   },
   {
    "name": "Realm Clearance",
    "desc": "Unlock Realm Clearance Gameplay",
    "utc": "",
    "on": false
   }
  ],
  "ch": [
   {
    "type": "Personal",
    "task": "Clear Bandit Suppression Chapter 17",
    "reward": "Scroll ×2"
   },
   {
    "type": "Alliance",
    "task": "Occupy 1 City of Lv.4 or above",
    "reward": "Gold Ingot ×100"
   },
   {
    "type": "Server",
    "task": "Occupy 1,000 Lv.10+ resource sites server-wide",
    "reward": "Scroll ×2"
   }
  ]
 },
 {
  "n": 7,
  "name": "Battlefield Gallant",
  "start": "2026-12-07 04:00",
  "end": "2026-12-10 04:00",
  "rules": [
   "Refresh items in the Merit Store"
  ],
  "unlocks": [],
  "ch": [
   {
    "type": "Personal",
    "task": "Clear Bandit Suppression Chapter 23",
    "reward": "Scroll ×2"
   },
   {
    "type": "Alliance",
    "task": "Occupy 1 City of Lv.6 or above",
    "reward": "Gold Ingot ×100"
   },
   {
    "type": "Server",
    "task": "Occupy 1,000 Lv.11+ resource sites server-wide",
    "reward": "Scroll ×2"
   }
  ]
 },
 {
  "n": 8,
  "name": "Triumph at Langju",
  "start": "2026-12-10 04:00",
  "end": "2026-12-14 04:00",
  "rules": [
   "Qingzhou Bandits upgraded to Lv.3",
   "You may reselect the tomes being studied",
   "In Cross-State Alliance II, the stationing limit of the Origin State will increase"
  ],
  "unlocks": [
   {
    "name": "Merchant Escort",
    "desc": "Opens",
    "utc": "2026-12-09 17:00",
    "on": false
   },
   {
    "name": "Cross-State Alliance II",
    "desc": "Opens",
    "utc": "2026-12-12 17:00",
    "on": false
   },
   {
    "name": "Realm's Gambit",
    "desc": "",
    "utc": "2026-12-09 17:00",
    "on": true
   }
  ],
  "ch": [
   {
    "type": "Personal",
    "task": "Clear Bandit Suppression Chapter 27",
    "reward": "Scroll ×2"
   },
   {
    "type": "Alliance",
    "task": "Occupy 1 City of Lv.8 or above",
    "reward": "Gold Ingot ×100"
   },
   {
    "type": "Server",
    "task": "Occupy 1,000 Lv.12+ resource sites server-wide",
    "reward": "Scroll ×2"
   }
  ]
 },
 {
  "n": 9,
  "name": "Regional Dominance",
  "start": "2026-12-14 04:00",
  "end": "2026-12-21 04:00",
  "rules": [
   "Unlock Bank Redemption Shop",
   "Realm Clearance difficulty and Faction Rewards increased",
   "Mid-Term Settlement"
  ],
  "unlocks": [
   {
    "name": "Assault on Wuchao",
    "desc": "Opens",
    "utc": "2026-12-14 17:00",
    "on": false
   }
  ],
  "ch": [
   {
    "type": "Personal",
    "task": "Clear Bandit Suppression Chapter 30",
    "reward": "Scroll ×2"
   },
   {
    "type": "Alliance",
    "task": "Occupy 1 City of Lv.9 or above",
    "reward": "Gold Ingot ×100"
   },
   {
    "type": "Server",
    "task": "Occupy 1,000 Lv.13+ resource sites server-wide",
    "reward": "Scroll ×2"
   }
  ]
 },
 {
  "n": 10,
  "name": "Claim the Throne",
  "start": "2026-12-21 04:00",
  "end": "",
  "tag": "Season Settlement Day",
  "rules": [
   "Final Settlement"
  ],
  "unlocks": [
   {
    "name": "Esoteric Divination",
    "desc": "Opens",
    "utc": "2026-12-20 17:00",
    "on": false
   },
   {
    "name": "Barbarian King's Rebellion",
    "desc": "Opens",
    "utc": "2026-12-20 17:00",
    "on": false
   },
   {
    "name": "Merchant Escort",
    "desc": "Opens",
    "utc": "2026-12-24 17:00",
    "on": false
   }
  ],
  "ch": [
   {
    "type": "Personal",
    "task": "Clear Bandit Suppression Chapter 34",
    "reward": "Scroll ×5"
   },
   {
    "type": "Alliance",
    "task": "Occupy 1 City of Lv.11 or above",
    "reward": "Gold Ingot ×200"
   },
   {
    "type": "Server",
    "task": "Occupy 1,000 Resource Sites at Lv.15 or higher server-wide",
    "reward": "Scroll ×5"
   }
  ]
 }
];
