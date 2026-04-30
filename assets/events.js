// Shared events data
// status: "upcoming" | "past"
// recurring: true if this is a weekly/recurring event

window.EVENTS = [

  // ============= SPRING 2026 — April =============

  {
    id: "yoga-weekly",
    day: "06", month: "Apr", year: 2026,
    dow: "Mon", dowAr: "الاثنين",
    start: "19:00", end: "20:30",
    type: "Class",
    title: "Yoga with Eilda Zaghmout",
    titleAr: "يوغا مع ايلدا زغموت",
    subtitle: "Every Monday · Head of Meditation at Tawazon",
    location: "Ground floor",
    recurring: true,
    recurringLabel: "Every Monday · 19:00",
    status: "upcoming",
    register: "https://forms.gle/ykHvYEn1QUo4B3oi7",
    short: "An immersive journey of self-discovery and healing.",
    shortAr: "رحلة شيقة لاكتشاف الذات والشفاء.",
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
    id: "soundwaves-apr-08",
    day: "08", month: "Apr", year: 2026,
    dow: "Wed", dowAr: "الأربعاء",
    start: "19:00", end: "20:00",
    type: "Film",
    title: "Sound Waves: The Symphony of Physics",
    titleAr: "الموجات الصوتية: سيمفونية الفيزياء",
    subtitle: "Making Sound — Part I of II · Dr. Helen Czerski",
    location: "Screening room",
    status: "past",
    short: "The extraordinary science behind the sounds we know — and those we cannot hear.",
    shortAr: "العلوم المذهلة وراء الأصوات المألوفة، والتي لا نسمعها.",
    body: [
      "Dr Helen Czerski investigates the extraordinary science behind the sounds we're familiar with and the sounds that we normally can't hear.",
      "The first of two screenings — this one unpacking how sound is made, from the physics of a struck string to the mechanics of speech.",
      "In English · 1 hour · free entry."
    ],
    bodyAr: [
      "تستكشف د. هيلين تشيرسكي العلوم المذهلة وراء الأصوات المألوفة والأصوات التي لا نسمعها عادةً.",
      "الجزء الأول من جزأين — يكشف عن كيفية توليد الصوت، من فيزياء الوتر إلى آليات الكلام.",
      "بالإنجليزية · ساعة واحدة · دخول مجاني."
    ]
  },

  {
    id: "rast-apr-11",
    day: "11", month: "Apr", year: 2026,
    dow: "Sat", dowAr: "السبت",
    start: "19:00", end: "20:00",
    type: "Performance",
    title: "Rast",
    titleAr: "راست",
    subtitle: "A solo performance on the oud · Tareq Abu Salameh",
    location: "Main hall",
    featured: true,
    status: "past",
    register: "https://forms.gle/ykHvYEn1QUo4B3oi7",
    short: "Through the expressive voice of the oud, tracing the traditional form of taqasim.",
    shortAr: "عبر صوت العود التعبيري، استكشاف شكل التقاسيم التقليدي.",
    body: [
      "Rast is a solo performance that, through the expressive voice of the oud, explores the traditional form of taqasim — a distinctive mode of improvisation at the heart of Eastern musical heritage.",
      "This form is remarkable for its ability to weave together a wide spectrum of musical traditions shared among Turkish, Arab, Persian, Assyrian, Kurdish, and Syriac cultures.",
      "— Tareq Abu Salameh (b. 1990, Jerusalem) is a Palestinian composer based in Milan since 2022."
    ],
    bodyAr: [
      "راست عرضٌ منفردٌ يستكشف، عبر صوت العود التعبيري، الشكل التقليدي للتقاسيم — نمطٌ مميّز من الارتجال في قلب التراث الموسيقي الشرقي.",
      "يتميّز هذا الشكل بقدرته على نسج طيفٍ واسع من الموسيقى المشتركة بين الثقافات التركية والعربية والفارسية والآشورية والكردية والسريانية.",
      "— طارق أبو سلامة (مواليد ١٩٩٠ القدس)، مؤلّف موسيقي فلسطيني يقيم في ميلانو منذ ٢٠٢٢."
    ],
    content: [
      { type: "text",
        en: [
          "Rast is a solo performance that, through the expressive voice of the oud, explores the traditional form of taqasim — a distinctive mode of improvisation at the heart of Eastern musical heritage.",
          "This form is remarkable for its ability to weave together a wide spectrum of musical traditions shared among Turkish, Arab, Persian, Assyrian, Kurdish, and Syriac cultures."
        ],
        ar: [
          "راست عرضٌ منفردٌ يستكشف، عبر صوت العود التعبيري، الشكل التقليدي للتقاسيم — نمطٌ مميّز من الارتجال في قلب التراث الموسيقي الشرقي.",
          "يتميّز هذا الشكل بقدرته على نسج طيفٍ واسع من الموسيقى المشتركة بين الثقافات التركية والعربية والفارسية والآشورية والكردية والسريانية."
        ]
      },
      { type: "pullquote",
        en: "Taqasim is the space between the known and the unknown — where the musician becomes a vessel.",
        ar: "التقاسيم هي الفضاء بين المعروف والمجهول — حيث يصبح الموسيقي وعاءً.",
        attribution: "Tareq Abu Salameh"
      },
      { type: "audio",
        titleEn: "Recording — Rast, 11 April 2026",
        titleAr: "تسجيل — راست، ١١ أبريل ٢٠٢٦",
        durationMin: 52,
        src: null
      }
    ]
  },


  {
    id: "dome-apr-15",
    day: "15", month: "Apr", year: 2026,
    dow: "Wed", dowAr: "الأربعاء",
    start: "19:00", end: "20:00",
    type: "Film",
    title: "The Dome Sessions",
    titleAr: "جلسات القُبّة",
    subtitle: "In Resonance Collective · Q&A with Firas El Hallak",
    location: "Screening room",
    status: "past",
    short: "Sound and space, emerging from the unfinished Niemeyer dome in Tripoli, Lebanon.",
    shortAr: "الصوت والمكان، من القبة غير المكتملة لنيماير في طرابلس.",
    body: [
      "An exploration of sound and space, emerging from the architectural and acoustic features of the unfinished Dome of the Rachid Karami International Fair in Tripoli, Lebanon.",
      "Designed by Oscar Niemeyer. When the Lebanese Civil War began, construction ceased, leaving the Dome acoustically untreated — creating a haunting reverb.",
      "Followed by a Q&A with Firas El Hallak. Released on Ruptured Label."
    ],
    bodyAr: [
      "استكشاف للعلاقة بين الصوت والمكان، من القبة غير المكتملة في معرض رشيد كرامي الدولي في طرابلس، لبنان.",
      "صُمّم الفضاء على يد المعماري أوسكار نيماير. حين اندلعت الحرب الأهلية اللبنانية، توقّف البناء، تاركاً القبة دون معالجة صوتية — مما أنتج صدىً مسحوراً.",
      "يتبعه حوار مع فراس الحلاق. صدر على Ruptured Label."
    ]
  },

  {
    id: "radio-sessions-apr-18",
    day: "18", month: "Apr", year: 2026,
    dow: "Sat", dowAr: "السبت",
    start: "19:00", end: "22:00",
    type: "Radio",
    title: "Radio Sessions: 7orany and ADAN",
    titleAr: "جلسات إذاعية: 7orany و ADAN",
    subtitle: "Live on Radio AlHara · Bar open",
    location: "Main hall · Bar open",
    status: "past",
    short: "Bashar Horany followed by ADAN, spinning records live from the Cabinet on Radio AlHara.",
    shortAr: "بشار حوراني ثم ADAN، يبثّان أسطوانات مباشرة عبر راديو الحارة من مجلس العجب.",
    body: [
      "Bashar Horany \"7orany\" — born and raised in Haifa, graphic designer and owner of a family print shop since 1975. His sets move through the undocumented edges of Arab music.",
      "ADAN — Palestinian curator, architect and DJ from Jerusalem, based in London. Her practice is rooted in the intersection of sound, space, and memory.",
      "Three-hour live broadcast on Radio AlHara."
    ],
    bodyAr: [
      "بشار حوراني «7orany» — وُلد وترعرع في حيفا، مصمّم غرافيك وصاحب مطبعة عائلية منذ ١٩٧٥. تجوب مجموعاته أطراف الموسيقى العربية غير الموثّقة.",
      "ADAN — فنانة فلسطينية من القدس، مقيمة في لندن، ممارسة في تقاطع الصوت والمكان والذاكرة.",
      "بثٌّ حيّ لثلاث ساعات عبر راديو الحارة."
    ],
    content: [
      { type: "text",
        en: [
          "Bashar Horany followed by ADAN, spinning records live on Radio AlHara from the Wonder Cabinet. A three-hour broadcast.",
          "Bashar Horany \"7orany\" — born and raised in Haifa, graphic designer and owner of a family print shop since 1975. His sets move through the undocumented edges of Arab music.",
          "ADAN — Palestinian curator, architect and DJ from Jerusalem, based in London. Her practice is rooted in the intersection of sound, space, and memory."
        ],
        ar: [
          "بشار حوراني ثم ADAN، يبثّان أسطوانات مباشرة عبر راديو الحارة من مجلس العجب. بثٌّ لثلاث ساعات.",
          "بشار حوراني «7orany» — وُلد وترعرع في حيفا، مصمّم غرافيك وصاحب مطبعة عائلية منذ ١٩٧٥.",
          "ADAN — فنانة فلسطينية من القدس، مقيمة في لندن."
        ]
      },
      { type: "audio",
        titleEn: "Full broadcast — Radio AlHara, 18 April 2026",
        titleAr: "البثّ الكامل — راديو الحارة، ١٨ أبريل ٢٠٢٦",
        durationMin: 180,
        src: null
      }
    ]
  },


  {
    id: "noor-abed-apr-22",
    day: "22", month: "Apr", year: 2026,
    dow: "Wed", dowAr: "الأربعاء",
    start: "19:00", end: "20:00",
    type: "Film",
    title: "An Informal Trilogy",
    titleAr: "ثلاثية غير رسمية",
    subtitle: "Films by Noor Abed · Double screening",
    location: "Screening room",
    featured: true,
    status: "past",
    short: "Three films by Noor Abed — a double screening at the Wonder Cabinet and Bayn Al Nakhlaytan, Jericho.",
    shortAr: "ثلاثة أفلام لنور عابد — عرضٌ مزدوج في مجلس العجب وبين النخلتين، أريحا.",
    body: [
      "A double screening of three films by Noor Abed: Penelope (2014), our songs (2021), and A Night We Held Between (2024).",
      "Simultaneously at the Wonder Cabinet, Bethlehem, and at Bayn Al Nakhlaytan, Jericho."
    ],
    bodyAr: [
      "عرضٌ مزدوج لثلاثة أفلام لنور عابد: بنيلوبي (٢٠١٤)، أغانينا (٢٠٢١)، وليلة احتجزناها بيننا (٢٠٢٤).",
      "في آنٍ واحد في مجلس العجب، بيت لحم، وفي بين النخلتين، أريحا."
    ],
    content: [
      { type: "text",
        en: [
          "A double screening of three films by Noor Abed — simultaneously at the Wonder Cabinet, Bethlehem, and at Bayn Al Nakhlaytan, Jericho.",
          "Penelope (2014) · our songs (2021) · A Night We Held Between (2024)."
        ],
        ar: [
          "عرضٌ مزدوج لثلاثة أفلام لنور عابد — في آنٍ واحد في مجلس العجب، بيت لحم، وفي بين النخلتين، أريحا.",
          "بنيلوبي (٢٠١٤) · أغانينا (٢٠٢١) · ليلة احتجزناها بيننا (٢٠٢٤)."
        ]
      }
    ]
  },

  {
    id: "carhartt-radioalhara-apr-24",
    day: "24", month: "Apr", year: 2026,
    dow: "Fri", dowAr: "الجمعة",
    start: "17:00", end: "22:00",
    type: "Radio",
    title: "Carhartt WIP × Radio AlHara",
    titleAr: "Carhartt WIP × راديو الحارة",
    subtitle: "Collection Launch · Radio AlHara 6th Anniversary",
    location: "Main hall · Bar open",
    featured: true,
    status: "past",
    short: "YA HU, Aram Sabbah, and Al Nather — live on Radio AlHara's 6th anniversary, with food by Um Alaa.",
    shortAr: "YA HU وأرام صبّاح والناذر — مباشرةً في الذكرى السادسة لراديو الحارة، مع أكل أم علاء.",
    body: [
      "A collection launch event with Radio AlHara to mark their 6th anniversary.",
      "Music by YA HU, Aram Sabbah, and Al Nather. Food by Um Alaa.",
      "17:00 – 22:00 · Free entry."
    ],
    bodyAr: [
      "فعالية إطلاق مجموعة مع راديو الحارة بمناسبة ذكراهم السادسة.",
      "موسيقى: YA HU، أرام صبّاح، والناذر. أكل: أم علاء.",
      "٥:٠٠ مساءً – ١٠:٠٠ مساءً · دخول مجاني."
    ],
    content: [
      { type: "text",
        en: [
          "Carhartt WIP × Radio AlHara: a collection launch event to mark Radio AlHara's 6th anniversary.",
          "Music by YA HU, Aram Sabbah, and Al Nather. Food by Um Alaa.",
          "17:00 – 22:00 · Free entry · Bar open."
        ],
        ar: [
          "Carhartt WIP × راديو الحارة: فعالية إطلاق مجموعة بمناسبة الذكرى السادسة لراديو الحارة.",
          "موسيقى: YA HU، أرام صبّاح، والناذر. أكل: أم علاء.",
          "٥:٠٠ مساءً – ١٠:٠٠ مساءً · دخول مجاني · البار مفتوح."
        ]
      }
    ]
  },


  {
    id: "hana-elias-apr-29",
    day: "29", month: "Apr", year: 2026,
    dow: "Wed", dowAr: "الأربعاء",
    start: "19:00", end: "20:00",
    type: "Film",
    title: "Short Films by Hana Elias",
    titleAr: "أفلام قصيرة لهنا الياس",
    subtitle: "Adrift (2025) + Where the Wind Blows (2024)",
    location: "Screening room",
    status: "upcoming",
    short: "Two short films by Hana Elias — with a soundtrack drawing from the Cremisan Valley and Sounds of Places.",
    shortAr: "فيلمان قصيران لهنا الياس — بموسيقى مستوحاة من وادي كريميزان وأصوات الأماكن.",
    body: [
      "Adrift (2025) and Where the Wind Blows (2024) — two short films by Hana Elias.",
      "The soundtracks draw from field recordings made in the Cremisan Valley during Sounds of Places."
    ],
    bodyAr: [
      "تائه (٢٠٢٥) وحيثما تهبّ الريح (٢٠٢٤) — فيلمان قصيران لهنا الياس.",
      "تستلهم الموسيقى من التسجيلات الميدانية التي أُجريت في وادي كريميزان خلال مشروع أصوات الأماكن."
    ]
  }

];


// Season computation — Northern hemisphere meteorological seasons (Bethlehem)
// Winter spans Dec→Feb; anchored to the December year (Dec 2025 + Jan/Feb 2026 = "Winter 2025")
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
  const order = { winter: 4, autumn: 3, summer: 2, spring: 1 };
  return Object.values(seen).sort((a,b) => {
    if (a.year !== b.year) return b.year - a.year;
    const ak = a.key.split("-")[0], bk = b.key.split("-")[0];
    return (order[bk] || 0) - (order[ak] || 0);
  });
})();

window.EVENTS_BY_ID = Object.fromEntries(window.EVENTS.map(e=>[e.id, e]));
