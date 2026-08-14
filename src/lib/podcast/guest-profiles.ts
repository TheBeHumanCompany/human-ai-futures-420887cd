/**
 * Guest role + short bio, keyed by episode number.
 *
 * Why this exists: `guestBio` is null on every episode in the live dataset, so
 * the "Meet the guest" column renders a bare name on all 39 pages. Until the
 * field is authored in Studio, this map supplies the same two things every
 * episode page needs — a role line and a 50–80 word bio.
 *
 * **Accuracy rule.** Every sentence below is drawn from that episode's own show
 * notes in `catalogue.snapshot.json`. Nothing here is invented: no credential,
 * company, award or biographical detail appears unless the episode description
 * states it. Episodes whose titles name a brand rather than a person (1 and 6)
 * have no entry at all, and episodes with too little detail get a role line
 * only — an absent bio is correct, filler is not.
 *
 * Sanity always wins: `guestProfile()` is consulted only where the CMS has not
 * been populated, so authoring a real bio in Studio silently supersedes this.
 */
export interface GuestProfile {
  /** Role / title / company line, shown under the guest name. */
  role?: string;
  /** ~50–80 words. Omitted where the episode does not support one. */
  bio?: string;
}

const PROFILES: Record<number, GuestProfile> = {
  2: {
    role: "Founder, Adhere to Studios",
    bio: "Alexandra Dean is the founder of Adhere to Studios, a sustainable outerwear brand redefining fashion with purpose. She studied fashion design in Vancouver before joining Lululemon, where she developed her skills in technical garment development and design. She now builds high-performance outerwear from excess materials using lower-impact methods, and speaks candidly about the realities of building a sustainable brand solo.",
  },
  3: {
    role: "CEO and Founder, Devin & Lang",
    bio: "Tyler McCombs is the CEO and founder of Devin & Lang, an apparel brand that grew out of his frustration with ripped boxers and became a multi-million dollar business. He launched months before the pandemic, pivoted into face masks to survive it, and built the company into a women-led operation. He speaks to the unglamorous decisions behind that growth.",
  },
  4: {
    role: "Founder, Lavva",
    bio: "Elizabeth Fisher is the founder of Lavva, a plant-based cultured superfood brand born out of her own cancer recovery. She built the company around whole, functional ingredients such as green plantains and pili nuts, faced near-collapse during the pandemic, and reclaimed her company when it looked lost. Her perspective joins food, health and ownership in a way few founders can speak to firsthand.",
  },
  5: {
    role: "Founder, Cheekbone Beauty",
    bio: "Jenn Harper is a proud Mohawk entrepreneur, advocate, and the founder of Cheekbone Beauty, a clean beauty brand that celebrates Indigenous culture and sustainability. Her mission is to create space for Indigenous voices in the beauty industry and inspire the next generation of leaders.",
  },
  7: {
    role: "Founder, Vitality Wellness World",
    bio: "Ariel Jarvis is the founder of Vitality Wellness World. A homeschooled ballerina until a career-ending injury, she pivoted into natural health and worked through nine years of university while juggling multiple jobs. She now runs a 3,000 square foot clinic with 13 practitioners, blending health care, wealth care and retreats — a practice built entirely on alignment and people.",
  },
  8: {
    role: "Founder, FXRY",
    bio: "Calley Dawson is the founder of FXRY, a fashion repair startup on a mission to keep clothes in rotation and out of landfills. After 25 years in apparel design with brands including Urban Outfitters and Brooks Running, she left mass production to build a business around circularity, offering expert repairs and local pickup and drop-off in Seattle while bootstrapping toward national growth.",
  },
  9: {
    role: "Founder, Hubs Collective",
    bio: "Christine Monahan is the founder of Hubs Collective, where she helps niche leaders build consistent revenue through collaboration and purpose-driven strategy. With decades of experience in sales, sponsorships and event production, she reimagined how entrepreneurs connect and grow after a life-altering moment. She is known for the discipline of doing “less, way better,” and for putting trust and alignment at the centre of business.",
  },
  10: {
    role: "Co-founder, Neuraura",
    bio: "Claire Dixon is the co-founder of Neuraura, where she is building a biowearable solution for PCOS — a chronic condition affecting one in five women. She came to health tech from brain-machine interface work, and speaks openly about funding, team-building and the daily reality of running a mission-driven company at the intersection of technology, health and impact.",
  },
  11: {
    role: "Founder, CanadianProtein.com and BioSteel",
    bio: "Dan Crosby is the founder of CanadianProtein.com and BioSteel. He went from blending supplements in his kitchen to running two large-scale manufacturing facilities and a 250-person operation. Shaped by real estate investing through the 2008 crash and by scaling through e-commerce, he is direct about leadership, focus and making fast decisions — and about why every day still feels like the night before an exam.",
  },
  12: {
    role: "Founder, Voes & Co.",
    bio: "Desiree Dupuis is the founder of Voes & Co., a vegan luxury footwear brand built on compassion and sustainability. Her own search for stylish, animal-free and plastic-free shoes led her to develop high-end designs using next-generation plant-based materials such as cactus and corn leather. She speaks frankly about bootstrapping a values-led business and building awareness without investors.",
  },
  13: {
    role: "CEO and Founder, FloatVR",
    bio: "Doron Meir is the CEO and founder of FloatVR, a mental wellness platform using generative virtual reality to help people reset, refocus and recharge. His own experience with ADHD and emotional regulation drove him to make the benefits of meditation reachable for people who struggle with overstimulation or anxiety. He works with companies on attention restoration and on cultures that put people first.",
  },
  14: {
    role: "Founder, Jevity Life Science",
    bio: "Jerry Kroll is the founder of Jevity Life Science and a pioneer in electric vehicles. His one-person EV, the Solo, was built to reshape urban transportation, and his current work follows advances in AI, gene therapy and personalized medicine toward far longer healthy lifespans. He draws a direct line between the early skepticism aimed at electric cars and today's doubts about longevity science.",
  },
  15: {
    role: "Founder, Elements Brazil",
    bio: "Joao (John) Ribeiro is the founder of Elements Brazil and has four businesses behind him. He began with a failed shipment of banana-based snacks, quit his job at HSBC and knocked on doors at Safeway stores before building a thriving food distribution company. Resilience, faith and relationships shape how he leads, and his people-first approach is the through line of the whole story.",
  },
  16: {
    role: "Co-founder, Rviita",
    bio: "Karly Jacobsen is the co-founder of Rviita, the first non-carbonated, better-for-you energy drink delivered in pouch packaging. A close friend's energy drink-related heart scare prompted her and her brother, Mitch, to build a healthier alternative, now one of Canada's most exciting beverage startups. She moved from night-shift nursing into entrepreneurship, and is candid about early manufacturing nightmares and team-first culture.",
  },
  17: {
    role: "Co-founder, MistyWest",
    bio: "Leigh Christie is the co-founder of MistyWest, a Vancouver engineering firm designing intelligent, connected devices — from rugged IoT sensors to AI-powered vision systems — for companies including Meta, Google and Intel. With a background in fuel cells and electric vehicles, he turned a passion for invention and systems thinking into a purpose-driven engineering studio, and is honest about the growing pains along the way.",
  },
  18: {
    role: "Co-founder and CEO, Joni",
    bio: "Linda Biggs is the co-founder and CEO of Joni, a modern period care company reworking a stagnant industry with innovation, impact and integrity. She built a devoted community, scaled through word-of-mouth and social purpose, and earned B Corp certification while staying bootstrapped. Her focus on team culture and workplace norms makes her a clear voice on human-centred leadership.",
  },
  19: {
    role: "Founder, The Skin Girls",
    bio: "Lisa Marie Blair is the founder of The Skin Girls, one of Vancouver's top medical aesthetics clinics. She grew a one-room setup in Chinatown into a six-room clinic serving celebrities and locals alike, and later launched Skin Edition, a vegan, cruelty-free skincare line that gives back to women's charities. She speaks with warmth about leadership, trust and staying grounded while scaling.",
  },
  20: {
    role: "Founder, Dermapure; Co-founder, Recess",
    bio: "Marilyne Gagne is the visionary behind the Dermapure clinic empire and co-founder of Recess. From small-town beginnings she built one of Canada's most successful aesthetic clinic networks, and is now turning toward mental health and social wellness with Recessa Modern, a social thermal station. She reflects honestly on building teams, navigating partnerships and staying true to herself.",
  },
  21: {
    role: "Founder, Nuez Acres",
    bio: "Nancy Wingham is the founder of Nuez Acres, a sustainable beauty brand grown out of her family's small pecan farm in Mexico. What began as a mission to support hometown farmers through a pecan market collapse became a vertically integrated skincare company sold across North America, known for zero-waste production and pecan oil-based formulas. She launched during the pandemic, in business with family.",
  },
  22: {
    role: "Registered Psychologist and Founder, Sana Psychological",
    bio: "Paige Abbott is a registered psychologist and the founder of Sana Psychological in Calgary. With a background in outpatient addiction treatment and more than 15 years in the field, she moved from solo practice to leading a growing team of mental health professionals, launching during the pandemic. She is thoughtful about the shift from clinician to business owner and about authenticity in leadership.",
  },
  23: {
    role: "Co-founder, Ufeelu",
    bio: "Sameer Padamsey is the co-founder of Ufeelu, where he is carving out a wellness category in cannabis. Rather than intoxicating effects, his CBD-based products target sleep, mood and pain relief through non-intoxicating compounds. He has built a purpose-driven brand inside one of Canada's most regulated industries, from product development and government systems to a values-based team and hard-won customer trust.",
  },
  24: {
    role: "Co-founder, MOD Kitchen",
    bio: "Tony Ferreira is a chef, former restaurant group director and co-founder of MOD Kitchen. After helping scale a hospitality group from 1 to 40 restaurants in Hong Kong, he returned to Vancouver to build a delivery-first food hub for restaurant entrepreneurs: ten private kitchens, shared infrastructure and a tech-enabled ordering system. He is candid about the mindset shift from operator to startup founder.",
  },
  25: {
    role: "Founder, Zimt Chocolates",
    bio: "Emma Smith is the founder of Zimt Chocolates, a plant-based, ethical chocolate brand she started from scratch in her early twenties. What began as a bootstrapped solo venture is now a thriving small business with a loyal following across Western Canada, built on compassion for people, animals and the planet. She is open about the emotional and physical toll of running a values-driven company.",
  },
  26: {
    role: "Founder, Amino Balls Inc.",
    bio: "Beata Antoninas is the founder of Amino Balls Inc. A personal struggle with sugar cravings, fitness competition pressure and disordered eating led her to make protein balls to stabilize her blood sugar; that habit became a fast-growing snack brand now in thousands of retail stores. She built it without industry experience, through her own health challenges, in partnership with her fiancé.",
  },
  27: {
    role: "Co-founder, Plume Science",
    bio: "Brett Bilon is the co-founder of Plume Science, which he built alongside his wife and business partner. The company began as an R&D project to develop safe, effective, non-toxic beauty products and produced their now-patented lash and brow serum. He has navigated explosive early growth, international expansion and a pandemic pivot from retail to e-commerce while raising a family.",
  },
  28: {
    role: "Founder and CEO, FoodMesh",
    bio: "Jessica Regan is the founder and CEO of FoodMesh, built to confront food waste in a country where nearly half the food goes to waste while one in four people face food insecurity. Her matchmaking platform redirects unsellable but still good food to charities, farmers and upcyclers, and has grown into a B Corp working with major grocers, municipalities and over 2,500 organizations.",
  },
  29: {
    role: "Founder, ElektraFi",
    bio: "Antonio Zivanovic is the founder of ElektraFi, a company democratizing financial wellness through employer-based platforms. He moved from corporate health and wellness consulting into fintech to help employees understand, manage and feel secure about their money through confidential, user-friendly tools. He is a thoughtful voice on culture, trust and the role of empathy and fairness in hiring and retention.",
  },
  30: {
    bio: "Maria Porcellato works in the wellness space, a path she came to through her own experience of stress and burnout. She speaks about recognizing the signs in herself, the steps she took to recover emotionally and physically, and the deeper calling that followed to help others do the same — a case for slowing down and self-awareness in a culture that glorifies constant productivity.",
  },
  31: {
    bio: "Glyn Lewis is a leader and community builder with a deep passion for creating meaningful change. His path runs through advocacy, leadership and building organizations that serve people and purpose. He talks about navigating the challenges of social impact work and staying grounded in core values — a reminder of what becomes possible when someone leads with integrity.",
  },
  32: {
    role: "CEO, Tocha Foods",
    bio: "Viggy Venkat is the CEO of Tocha Foods, a community leader and a creative mind dedicated to building spaces that empower others. He describes how curiosity, compassion and a strong sense of purpose shaped the way he shows up, from early challenges through breakthrough moments. His perspective centres on conscious leadership, nurturing community and leading with authenticity.",
  },
  33: {
    role: "Founder, Wise Bites",
    bio: "Cathline James is the founder of Wise Bites, a visionary entrepreneur and a woman of deep faith. She tells the real story behind her success — perseverance, tough decisions and moments of clarity — from the early days of her business through leading in high-pressure environments. She speaks directly to the challenges she faced as a woman in leadership and the values that drive her.",
  },
  34: {
    role: "CEO, Luna Nectar",
    bio: "Mia Fiona Kut is the CEO of Luna Nectar, and a creative, actor and entrepreneur. She shares a journey of self-expression, resilience and redefining success on her own terms, from navigating the entertainment industry to launching her own ventures. She is open about the challenges she faced and the moments that shaped her, personally and professionally.",
  },
  35: {
    bio: "Marc Wandler is a founder and forward-thinking entrepreneur focused on building systems and solutions that serve people first. His experience spans leadership, social impact and business innovation, and he speaks to the mindset needed to grow something that lasts. Values-driven leadership, staying mission-focused in a fast-paced world, and the place of community and empathy in business run through the conversation.",
  },
  36: {
    role: "Founder, MisMacK Clean Cosmetics",
    bio: "Missy MacKintosh is the founder of MisMacK Clean Cosmetics and is leading a shift in the beauty industry. She worked behind the scenes as a professional makeup artist before building her own inclusive, cruelty-free brand, shaped by her values and her vision for change. She is honest about disrupting a saturated market and about what true representation means in beauty.",
  },
  37: {
    role: "Owner, The Sartorial Shop",
    bio: "Zahir Rajani is the mind behind The Sartorial Shop, one of Vancouver's most refined custom suit boutiques. He came from commercial real estate, a stable world of buildings and contracts, and traded that predictability to revive his family's legacy: his parents opened their tailoring shop in 1984, following his grandfather, a master clothier in East Africa.",
  },
  38: {
    role: "Founder, NovoBeing",
    bio: "Nik Vassev is the founder of NovoBeing, a VR therapeutics company bringing meditation, breathwork and mental wellness into the healthcare system through immersive technology. He raised over $1 million in funding after more than 300 investor rejections, and built the company on clinical trials showing real results — including pain reduced by over 50% with ten minutes of daily practice.",
  },
  39: {
    role: "Owner, Briteweb",
    bio: "Jill De Chavez is the owner of Briteweb, a digital agency managing the online presence of mission-driven organizations such as the David Suzuki Foundation. After years overseeing large corporate projects, she bought the very agency where she once worked. Now leading a 15-person team, she is frank about what running a company actually demands, from difficult personnel decisions to the culture she wants to build.",
  },
};

/** The profile for an episode, or an empty object when none is on file. */
export function guestProfile(episodeNumber: number | null): GuestProfile {
  if (episodeNumber === null) return {};
  return PROFILES[episodeNumber] ?? {};
}
