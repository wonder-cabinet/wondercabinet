// Shared events data
// status: "upcoming" | "past"
// recurring: true if this is a weekly/recurring event
// writeup: post-event reflection (for archive)

window.EVENTS = [
  // ============= UPCOMING =============
  {
    id: "yoga-nov-06",
    day: "06", month: "Nov", year: 2025,
    dow: "Mon", dowAr: "الاثنين",
    start: "19:00", end: "20:30",
    type: "Class",
    title: "Yoga with Eilda Zaghmout",
    titleAr: "يوغا مع ايلدا زغموت",
    subtitle: "Weekly guided practice · Head of Meditation at Tawazon",
    location: "Ground floor",
    cover: "assets/covers/yoga.svg",
    recurring: true,
    recurringLabel: "Every Monday",
    status: "upcoming",
    register: "https://forms.gle/ykHvYEn1QUo4B3oi7",
    short: "An immersive journey of self-discovery and healing.",
    shortAr: "رحلة شيقة لاكتشاف الذات.",
    body: [
      "A regular appointment at the Wonder Cabinet, every Monday Eilda Zaghmout, professional yoga teacher and \"Head of Meditation\" at Tawazon, will continue to guide you through an immersive journey of self discovery and healing.",
      "Cost — 30 NIS per class, or 100 NIS for a four-class package. Mixed classes. Mats and props provided."
    ],
    bodyAr: [
      "في مجلس العجب، كل يوم اثنين إيلدا زغموت، معلمة اليوغا المحترفة و\"رئيسة التأمل\" في مؤسسة توازن، تقوم في إرشادك خلال رحلة شيقة لاكتشاف الذات.",
      "التكلفة: ٣٠ شيكل لكل حصة أو ١٠٠ شيكل لأربعة حصص."
    ]
  },
  {
    id: "soundwaves-nov-08",
    day: "08", month: "Nov", year: 2025,
    dow: "Wed", dowAr: "الأربعاء",
    start: "19:00", end: "20:00",
    type: "Film",
    title: "Sound Waves: The Symphony of Physics",
    titleAr: "الموجات الصوتية: سيمفونية الفيزياء",
    subtitle: "Making Sound — Part I of II · Dr. Helen Czerski",
    location: "Screening room",
    cover: "assets/covers/soundwaves.svg",
    status: "upcoming",
    short: "The extraordinary science behind the sounds we know — and those we cannot hear.",
    shortAr: "العلوم المذهلة وراء الأصوات المألوفة، والتي لا نسمعها.",
    body: [
      "Dr Helen Czerski investigates the extraordinary science behind the sounds we're familiar with and the sounds that we normally can't hear.",
      "The first of two screenings — this one unpacking how sound is made, from the physics of a struck string to the mechanics of speech.",
      "In English · 1 hour · free entry."
    ],
    bodyAr: [
      "تستكشف د. هيلين تشيرسكي العلوم المذهلة وراء الأصوات المألوفة والأصوات التي لا نسمعها عادةً.",
      "الجزء الأول من جزأين، باللغة الإنجليزية، ساعة واحدة."
    ]
  },
  {
    id: "rast-nov-11",
    day: "11", month: "Nov", year: 2025,
    dow: "Sat", dowAr: "السبت",
    start: "19:00", end: "20:00",
    type: "Performance",
    title: "Rast",
    titleAr: "راست",
    subtitle: "A solo performance on the oud · Tareq Abu Salameh",
    location: "Main hall",
    cover: "assets/covers/rast.svg",
    featured: true,
    status: "upcoming",
    register: "#",
    short: "Through the expressive voice of the oud, tracing the traditional form of taqasim.",
    shortAr: "عبر صوت العود، استكشاف شكل التقاسيم.",
    body: [
      "Rast is a solo performance that, through the expressive voice of the oud, explores the traditional form of taqasim — a distinctive mode of improvisation at the heart of Eastern musical heritage.",
      "This form is remarkable for its ability to weave together a wide spectrum of musical traditions shared among Turkish, Arab, Persian, Assyrian, Kurdish, and Syriac cultures.",
      "— Tareq Abu Salameh (b. 1990, Jerusalem) is a Palestinian composer based in Milan since 2022."
    ],
    bodyAr: [
      "راست عرضٌ منفردٌ يستكشف، عبر صوت العود التعبيري، الشكل التقليدي للتقاسيم.",
      "— طارق أبو سلامة (مواليد ١٩٩٠ القدس)، مؤلّف موسيقي فلسطيني يقيم في ميلانو."
    ]
  },
  {
    id: "yoga-nov-13",
    day: "13", month: "Nov", year: 2025,
    dow: "Mon", dowAr: "الاثنين",
    start: "19:00", end: "20:30",
    type: "Class",
    title: "Yoga with Eilda Zaghmout",
    titleAr: "يوغا مع ايلدا زغموت",
    subtitle: "Weekly guided practice",
    location: "Ground floor",
    cover: "assets/covers/yoga.svg",
    recurring: true,
    recurringLabel: "Every Monday",
    status: "upcoming",
    register: "https://forms.gle/ykHvYEn1QUo4B3oi7",
    short: "Weekly guided practice.",
    shortAr: "الدرس الأسبوعي.",
    body: ["See 06 November for full details."],
    bodyAr: ["انظر إلى يوم ٦ نوفمبر."]
  },
  {
    id: "dome-nov-15",
    day: "15", month: "Nov", year: 2025,
    dow: "Wed", dowAr: "الأربعاء",
    start: "19:00", end: "20:00",
    type: "Film",
    title: "The Dome Sessions",
    titleAr: "جلسات القُبّة",
    subtitle: "In Resonance Collective · Q&A with Firas El Hallak",
    location: "Screening room",
    cover: "assets/covers/dome.svg",
    featured: true,
    status: "upcoming",
    short: "Sound and space, emerging from the unfinished dome in Tripoli, Lebanon.",
    shortAr: "الصوت والمكان، من القبة غير المكتملة في طرابلس.",
    body: [
      "An exploration of sound and space, emerging from the architectural and acoustic features of the unfinished Dome of the Rachid Karami International Fair in Tripoli.",
      "Designed by Oscar Niemeyer in 1962. When the Lebanese Civil War began, construction ceased, leaving the Dome acoustically untreated — creating a haunting reverb."
    ],
    bodyAr: [
      "استكشاف للعلاقة بين الصوت والمكان، من القبة غير المكتملة في طرابلس، لبنان.",
      "صُمّم الفضاء عام ١٩٦٢ على يد المعماري أوسكار نيماير."
    ]
  },
  {
    id: "radio-nov-18",
    day: "18", month: "Nov", year: 2025,
    dow: "Sat", dowAr: "السبت",
    start: "19:00", end: "22:00",
    type: "Radio",
    title: "7orany + ADAN",
    titleAr: "جلسات إذاعية: 7orany و ADAN",
    subtitle: "Radio Session · Live on Radio AlHara",
    location: "Main hall · Bar open",
    cover: "assets/covers/radio.svg",
    featured: true,
    status: "upcoming",
    short: "Records spun live from the Cabinet. Three-hour broadcast.",
    shortAr: "أسطوانات تُبثّ مباشرة. ثلاث ساعات.",
    body: [
      "Bashar Horany followed by ADAN, spinning records live on Radio AlHara from the Wonder Cabinet.",
      "Bashar Horany \"7orany\" — born and raised in Haifa, graphic designer and owner of a family print shop since 1975.",
      "ADAN — Palestinian curator, architect and DJ from Jerusalem, based in London."
    ],
    bodyAr: ["بشار حوراني وADAN يقدّمان أسطوانات مباشرة عبر راديو الحارة."]
  },
  {
    id: "yoga-nov-20",
    day: "20", month: "Nov", year: 2025,
    dow: "Mon", dowAr: "الاثنين",
    start: "19:00", end: "20:30",
    type: "Class",
    title: "Yoga with Eilda Zaghmout",
    titleAr: "يوغا مع ايلدا زغموت",
    subtitle: "Weekly guided practice",
    location: "Ground floor",
    cover: "assets/covers/yoga.svg",
    recurring: true, recurringLabel: "Every Monday",
    status: "upcoming",
    register: "https://forms.gle/ykHvYEn1QUo4B3oi7",
    short: "Weekly guided practice.", shortAr: "الدرس الأسبوعي.",
    body: ["See 06 November for full details."],
    bodyAr: ["انظر إلى يوم ٦ نوفمبر."]
  },
  {
    id: "yoga-nov-27",
    day: "27", month: "Nov", year: 2025,
    dow: "Mon", dowAr: "الاثنين",
    start: "19:00", end: "20:30",
    type: "Class",
    title: "Yoga with Eilda Zaghmout",
    titleAr: "يوغا مع ايلدا زغموت",
    subtitle: "Weekly guided practice",
    location: "Ground floor",
    cover: "assets/covers/yoga.svg",
    recurring: true, recurringLabel: "Every Monday",
    status: "upcoming",
    register: "https://forms.gle/ykHvYEn1QUo4B3oi7",
    short: "Weekly guided practice.", shortAr: "الدرس الأسبوعي.",
    body: ["See 06 November for full details."],
    bodyAr: ["انظر إلى يوم ٦ نوفمبر."]
  },
  {
    id: "soundwaves-2-dec-03",
    day: "03", month: "Dec", year: 2025,
    dow: "Wed", dowAr: "الأربعاء",
    start: "19:00", end: "20:00",
    type: "Film",
    title: "Sound Waves II: Making Waves",
    titleAr: "الموجات الصوتية ٢",
    subtitle: "Part II of II · Dr. Helen Czerski",
    location: "Screening room",
    cover: "assets/covers/soundwaves.svg",
    status: "upcoming",
    short: "The second screening in the two-part series.",
    shortAr: "الجزء الثاني من السلسلة.",
    body: ["The second of two screenings on the physics of sound."],
    bodyAr: ["الجزء الثاني من السلسلة."]
  },
  {
    id: "reading-dec-06",
    day: "06", month: "Dec", year: 2025,
    dow: "Sat", dowAr: "السبت",
    start: "18:00", end: "19:30",
    type: "Reading",
    title: "Evening Reading Room",
    titleAr: "غرفة القراءة المسائية",
    subtitle: "Open readings from the Cabinet library",
    location: "Library",
    cover: "assets/covers/reading.svg",
    status: "upcoming",
    short: "Bring a book, or borrow one. Tea on the house.",
    shortAr: "أحضر كتاباً أو استعر كتاباً.",
    body: ["A quiet, open reading evening."],
    bodyAr: ["أمسية قراءة هادئة."]
  },

  // ============= ARCHIVE (past) =============
  {
    id: "archive-opening-oct-2024",
    day: "12", month: "Oct", year: 2024,
    dow: "Sat", dowAr: "السبت",
    start: "19:00", end: "23:00",
    type: "Opening",
    title: "Cabinet Opening Night",
    titleAr: "ليلة افتتاح المجلس",
    subtitle: "The first gathering · 200 friends, neighbours, makers",
    location: "Whole building",
    cover: "assets/covers/opening.svg",
    status: "past",
    writeup: "Two hundred people walked through the doors on the night the Cabinet first opened — neighbours, makers, students, friends from Bethlehem, Ramallah, Jerusalem, Haifa. Tea kept appearing. Three hours in, the courtyard had turned into a small dance floor. Notes from that night still hang on the corkboard upstairs.",
    writeupAr: "في ليلة افتتاح المجلس، عبرت أبوابه نحو مئتين من الأصدقاء والجيران والصنّاع. الشاي لا ينتهي، والساحة تحوّلت بعد ثلاث ساعات إلى حلبة رقص صغيرة.",
    body: [],
    bodyAr: []
  },
  {
    id: "archive-bigbus-mar-2025",
    day: "22", month: "Mar", year: 2025,
    dow: "Sat", dowAr: "السبت",
    start: "16:00", end: "21:00",
    type: "Workshop",
    title: "The Big Bus — Building Workshop",
    titleAr: "ورشة الحافلة الكبيرة",
    subtitle: "An afternoon of woodwork, soldering and sandwiches",
    location: "Workshop",
    cover: "assets/covers/bus.svg",
    status: "past",
    writeup: "We tried to convert a 1986 Mercedes coach into a mobile cinema, and mostly succeeded. Three benches, one projector mount, two broken drill bits. The bus is now parked behind the Cabinet, ready for its first screening tour through the West Bank.",
    writeupAr: "حاولنا تحويل حافلة مرسيدس موديل ١٩٨٦ إلى سينما متنقلة. ثلاثة مقاعد، حامل بروجكتور، ولقمتي ثقب مكسورتين.",
    body: [],
    bodyAr: []
  },
  {
    id: "archive-sumud-may-2025",
    day: "10", month: "May", year: 2025,
    dow: "Sat", dowAr: "السبت",
    start: "19:00", end: "21:00",
    type: "Performance",
    title: "Sumud — A Choir for the Land",
    titleAr: "صمود — جوقة للأرض",
    subtitle: "Choir performance · curated by Dalia Sabbah",
    location: "Main hall",
    cover: "assets/covers/sumud.svg",
    status: "past",
    writeup: "A choir of twenty-four voices, drawn from villages across Palestine, performed an evening of work songs, lullabies and lament. Recordings of the night were broadcast a week later on Radio AlHara.",
    writeupAr: "جوقة من أربعة وعشرين صوتاً، من قرى متعددة في فلسطين، أدّت أمسية من أغاني العمل والتهليلات والرثاء.",
    body: [],
    bodyAr: []
  },
  {
    id: "archive-printclub-jul-2025",
    day: "05", month: "Jul", year: 2025,
    dow: "Sat", dowAr: "السبت",
    start: "11:00", end: "17:00",
    type: "Workshop",
    title: "Risograph Print Club",
    titleAr: "نادي الريزوغراف",
    subtitle: "Open studio · 12 prints, 6 hours, 2 colours",
    location: "Studio",
    cover: "assets/covers/print.svg",
    status: "past",
    writeup: "Twelve people walked out with their first risograph prints — fluorescent pink and blue, ink still drying. The two-colour palette became the constraint that shaped half a dozen unexpected collaborations.",
    writeupAr: "اثنا عشر شخصاً غادروا الستوديو حاملين أوّل أعمالهم بالريزوغراف، بحبر زهري فلوري وأزرق.",
    body: [],
    bodyAr: []
  }
];


// Season computation: Northern hemisphere meteorological seasons (Bethlehem)
// Winter spans Dec→Feb; we anchor it to the December year (e.g. Dec 2025 + Jan/Feb 2026 are all "Winter 2025")
function __twcSeason(month, year){
  if (["Sep","Oct","Nov"].includes(month)) return { key: "autumn-" + year,   name: "Autumn", nameAr: "خريف", year: year };
  if (month === "Dec")                     return { key: "winter-" + year,   name: "Winter", nameAr: "شتاء", year: year };
  if (["Jan","Feb"].includes(month))       return { key: "winter-" + (year-1), name: "Winter", nameAr: "شتاء", year: year-1 };
  if (["Mar","Apr","May"].includes(month)) return { key: "spring-" + year,   name: "Spring", nameAr: "ربيع", year: year };
  if (["Jun","Jul","Aug"].includes(month)) return { key: "summer-" + year,   name: "Summer", nameAr: "صيف", year: year };
  return { key: "unknown-" + year, name: "—", nameAr: "—", year: year };
}
window.EVENTS.forEach(e => { e.season = __twcSeason(e.month, e.year); });
window.SEASONS = (function(){
  const seen = {};
  window.EVENTS.forEach(e => { seen[e.season.key] = e.season; });
  // sort by year desc, then by season order within year (winter > autumn > summer > spring)
  const order = { winter: 4, autumn: 3, summer: 2, spring: 1 };
  return Object.values(seen).sort((a,b) => {
    if (a.year !== b.year) return b.year - a.year;
    const ak = a.key.split("-")[0], bk = b.key.split("-")[0];
    return (order[bk] || 0) - (order[ak] || 0);
  });
})();

window.EVENTS_BY_ID = Object.fromEntries(window.EVENTS.map(e=>[e.id, e]));
