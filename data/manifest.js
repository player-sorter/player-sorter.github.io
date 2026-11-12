window.SQUAD_MANIFEST = {
  siteUrl: "player-sorter.github.io",
  requestsUrl: "https://script.google.com/macros/s/AKfycbxs9FMyExkNvFozpEOyqXstcIE5wyAa-doZCyNUQiIQ6XxnwZ9M1az6XbI2ghBeMCg9/exec",
  showFirst: 5,
  sections: [
    {
      id: "mens-clubs",
      name: "Men's clubs",
      tab: "Men",
      groups: [
        {
          id: "laliga",
          name: "LaLiga",
          country: "Spain",
          teams: ["atletico-madrid", "barcelona", "real-madrid", "real-betis", "villarreal", "rayo-vallecano", "getafe", "deportivo-a-coruna", "real-sociedad", "athletic-club", "sevilla", "valencia", "malaga", "espanyol", "celta", "osasuna", "alaves", "elche", "levante", "racing-santander"]
        },
        {
          id: "premier-league",
          name: "Premier League",
          country: "England",
          teams: ["arsenal", "liverpool", "manchester-city", "manchester-united", "aston-villa", "chelsea", "tottenham", "newcastle", "fulham", "leeds", "everton", "bournemouth", "brighton", "ipswich-town"]//, "sunderland"]
        },
        {
          id: "bundesliga",
          name: "Bundesliga",
          country: "Germany",
          teams: ["bayern-munich", "dortmund", "schalke", "stuttgart", "leverkusen", "frankfurt", "leipzig", "hamburg"]
        },
        {
          id: "ligue-1",
          name: "Ligue 1",
          country: "France",
          teams: ["psg", "monaco", "paris-fc", "marseille", "lyon", "lille", "lens"]
        },
        {
          id: "serie-a",
          name: "Serie A",
          country: "Italy",
          teams: ["roma", "juventus", "ac-milan", "inter", "cagliari", "como", "fiorentina", "atalanta", "lazio", "napoli", "torino"]
        },
        {
          id: "eredivisie",
          name: "Eredivisie",
          country: "Netherlands",
          teams: ["ajax", "feyenoord", "psv"]
        },
        {
          id: "liga-portugal",
          name: "Liga Portugal",
          country: "Portugal",
          teams: ["benfica", "porto", "sporting"]
        },
        {
          id: "mls",
          name: "Major League Soccer",
          country: "United States",
          teams: ["inter-miami", "orlando-city", "new-england-revolution"]
        },
        {
          id: "liga-profesional",
          name: "Liga Profesional de Futbol (LPF)",
          country: "Argentina",
          teams: ["river-plate", "boca-juniors"]
        },
        {
          id: "brasileiro",
          name: "Campeonato Brasileiro Série A",
          country: "Brazil",
          teams: ["flamengo", "cruzeiro", "palmeiras"]
        },
        {
          id: "liga-mx",
          name: "Liga MX",
          country: "Mexico",
          teams: ["club-america", "monterrey", "cruz-azul", "chivas"]
        },
        {
          id: "super-lig",
          name: "Süper Lig",
          country: "Türkiye",
          teams: ["fenerbahce", "galatasaray", "besiktas"]
        },
        {
          id: "greek-super-league",
          name: "Greek Super League",
          country: "Greece",
          teams: ["olympiacos", "aek-athens"]
        },
        {
          id: "belgian-pro-league",
          name: "Belgian Pro League",
          country: "Belgium",
          teams: ["club-brugge"]
        },
        {
          id: "czech-first-league",
          name: "Czech First League",
          country: "Czechia",
          teams: ["slavia-praha"]
        },
        {
          id: "eliteserien",
          name: "Eliteserien",
          country: "Norway",
          teams: ["bodo-glimt", "viking"]
        },
        {
          id: "austrian-bundesliga",
          name: "Austrian Bundesliga",
          country: "Austria",
          teams: ["lask"]
        },
        {
          id: "ukrainian-premier-league",
          name: "Ukrainian Premier League",
          country: "Ukraine",
          teams: ["shakhtar-donetsk"]
        },
        {
          id: "championship",
          name: "Championship",
          country: "England",
          teams: ["queens-park-rangers", "west-ham-united", "wolves"]//, "sheffield-united", "southampton", "swansea"]
        },
        {
          id: "laliga-hypermotion",
          name: "LALIGA HYPERMOTION",
          country: "Spain",
          teams: ["leganes", "real-oviedo", "real-valladolid", "granada", "las-palmas"]
        },
        {
          id: "primera-federacion",
          name: "Primera Federación",
          country: "Spain",
          teams: ["real-zaragoza"]
        },
        {
          id: "azerbaijan-premier-league",
          name: "Azerbaijan Premier League",
          country: "Azerbaijan",
          teams: ["sabah"]
        },
        {
          id: "slovak-super-liga",
          name: "Slovak Super Liga",
          country: "Slovakia",
          teams: ["slovan-bratislava"]
        },
        /*
        {
          id: "saudi-pro-league",
          name: "Saudi Pro League",
          country: "Saudi Arabia",
          teams: ["al-hilal", "al-nassr"]
        },
        {
          id: "egyptian-premier-league",
          name: "Egyptian Premier League",
          country: "Egypt",
          teams: ["al-ahly"]
        },
        */
      ]
    },
    {
      id: "womens-clubs",
      name: "Women's clubs",
      tab: "Women",
      groups: [
        {
          id: "liga-f",
          name: "Liga F",
          country: "Spain",
          teams: ["atletico-madrid-femenino", "barcelona-femeni", "real-madrid-femenino"]
        },
        {
          id: "wsl",
          name: "WSL",
          country: "England",
          teams: ["arsenal-women", "chelsea-women", "manchester-city-women", "manchester-united-women", "london-city-lionesses", "liverpool-women"]
        },
        {
          id: "premiere-ligue",
          name: "Première Ligue",
          country: "France",
          teams: ["ol-lyonnes", "psg-women"]
        },
        {
          id: "frauen-bundesliga",
          name: "Frauen-Bundesliga",
          country: "Germany",
          teams: ["bayern-munich-women"]
        },
        {
          id: "liga-bpi",
          name: "Liga BPI",
          country: "Portugal",
          teams: ["benfica-femenino"]
        }
      ]
    },
    {
      id: "wcs",
      name: "National teams",
      tab: "Nations",
      groups: [
        {
          id: "world-cup-2026",
          name: "World Cup 2026",
          teams: [
            "2026-spain",
            "2026-argentina",
            "2026-france",
            "2026-england",
            "2026-uruguay",
            "2026-norway",
            "2026-portugal",
            "2026-germany",
            "2026-mexico",
            "2026-brasil",
            "2026-belgium",
            "2026-algeria",
            "2026-egypt",
            "2026-usa",
            "2026-sweden",
            "2026-morocco",
            "2026-netherlands",
            "2026-australia"
          ],
          podium: { winner: "2026-spain", finalist: "2026-argentina", semis: ["2026-france", "2026-england"] }
        },
        {
          id: "asean-cup-2026",
          name: "ASEAN Cup 2026",
          teams: ["2026-indonesia"],
          podium: { winner: "2026-indonesia", finalist: "", semis: [] }
        },
        {
          id: "womens-world-cup-2023",
          name: "Women's World Cup 2023",
          teams: ["2023-spain", "2023-england", "2023-france", "2023-sweden", "2023-australia", "2023-usa"],
          podium: { winner: "2023-spain", finalist: "2023-england", semis: ["2023-sweden", "2023-australia"] }
        },
        {
          id: "world-cup-2022",
          name: "World Cup 2022",
          teams: ["2022-argentina"],
          podium: { winner: "2022-argentina", finalist: "", semis: [] }
        },
        {
          id: "world-cup-2018",
          name: "World Cup 2018",
          teams: ["2018-france"],
          podium: { winner: "2018-france", finalist: "", semis: [] }
        }
      ]
    },
    {
      id: "specials",
      name: "Specials",
      tab: "Specials",
      groups: [
        {
          id: "build-your-own",
          name: "Custom",
          builder: true
        },
        {
          id: "ballon-dor",
          name: "Ballon d'Or",
          teams: ["2026-ballon-dor-men", "2026-ballon-dor-women"]
        }
      ]
    }
  ]
};