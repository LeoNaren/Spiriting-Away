const verses = [
  // Bhagavad Gita
  {
    id: 1,
    source: "Bhagavad Gita",
    chapter: 2,
    verse: 47,
    original: "Karmanye vadhikaraste, ma phaleshu kadachana. Ma karma phala hetur bhur, ma te sango stv akarmani.",
    translation: "You have the right to perform your duties, but never to the fruits of your actions. Let not the results be your motive, nor let attachment to inaction take hold of you.",
    meaning: "Krishna tells Arjuna — and through him, all of us — that action done in earnest is our only true domain. The outcome belongs to something larger than us. This isn't resignation; it's liberation. When we release our grip on results, the action itself becomes pure. We stop calculating, performing, and posturing. We simply do what is ours to do. Most spiritual restlessness comes from being attached to outcomes we cannot control. This verse is the antidote.",
    type: "verse"
  },
  {
    id: 2,
    source: "Bhagavad Gita",
    chapter: 6,
    verse: 5,
    original: "Uddhared atmanatmanam natmanam avasadayet. Atmaiva hy atmano bandhur atmaiva ripur atmanah.",
    translation: "Let a man lift himself by his own self; let him not degrade himself. For the self alone is the friend of the self, and the self alone is the enemy of the self.",
    meaning: "There is no external rescuer. The same mind that has kept you in cycles of suffering is the very instrument through which you must find your way out. This is not a harsh teaching — it is an empowering one. Krishna is saying: you are not helpless. You are not a victim of circumstance or fate. The one who imprisons you and the one who can free you are the same being. This is why the spiritual path is so deeply personal — no teacher, ritual, or tradition can walk it for you.",
    type: "verse"
  },
  {
    id: 3,
    source: "Bhagavad Gita",
    chapter: 18,
    verse: 66,
    original: "Sarva-dharman parityajya mam ekam saranam vraja. Aham tvam sarva-papebhyo mokshayishyami ma shucah.",
    translation: "Abandon all varieties of duty and simply surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.",
    meaning: "This is among the final and most intimate words Krishna speaks to Arjuna. After all the philosophy, all the frameworks — dharma, karma, yoga — he offers something beyond all of it: complete surrender. Not as weakness, but as the deepest trust. The word 'sharanam' means refuge, not defeat. This verse speaks to those who have exhausted their own efforts and analyses. It is the teaching for the moment when you realize you cannot think your way through — you can only let go.",
    type: "verse"
  },

  // Brihadaranyaka Upanishad
  {
    id: 4,
    source: "Brihadaranyaka Upanishad",
    chapter: "1.3.28",
    verse: null,
    original: "Asato ma sad gamaya. Tamaso ma jyotir gamaya. Mrityor ma amritam gamaya.",
    translation: "Lead me from the unreal to the real. Lead me from darkness to light. Lead me from death to immortality.",
    meaning: "This prayer is not asking for a better life — it is asking for a truer one. The 'unreal' here refers to the world of appearances, of ego, of the self we have mistaken ourselves to be. The 'real' is Brahman — the unchanging ground beneath all experience. Darkness is not evil but ignorance — the unawareness of our own nature. And death is not physical; it is the sense of being a separate, limited, mortal self. The one who prays this is already on the path — because only someone who senses a deeper truth would ask to be led toward it.",
    type: "verse"
  },
  {
    id: 5,
    source: "Brihadaranyaka Upanishad",
    chapter: "4.4.5",
    verse: null,
    original: "Yad vai tan manah, yad vai tan manah.",
    translation: "We are what our deep, driving desire is. As our desire is, so is our will. As our will is, so is our deed. As our deed is, so is our destiny.",
    meaning: "Long before modern psychology, the Brihadaranyaka Upanishad mapped the chain from inner state to outer life. It begins not with action, but with desire — the deep, often unconscious longing that drives everything else. This is why spiritual traditions place such emphasis on purifying desire rather than just controlling behaviour. If the desire is clean, what flows from it — will, deed, destiny — will also be clean. The teaching is quietly radical: to change your life, go further inward than you think you need to.",
    type: "verse"
  },
  {
  id: 6,
  source: "Brihadaranyaka Upanishad",
  chapter: "1.4.10",
  verse: null,
  original: "Aham Brahmasmi.",
  translation: "I am Brahman.",
  meaning: "Two words in Sanskrit. Perhaps the most direct pointer in all of spiritual literature. This is not a declaration of ego — it is the dissolution of it. The 'I' here is not the personal self, the one with a name and a history and a body. It is the witnessing awareness beneath all of that — pure, boundless, unconditioned. The Brihadaranyaka presents this as a direct recognition, not a belief to be adopted. It is what remains when every false identification falls away. Most seekers spend years asking 'who am I?' — this mahavakya is the answer, given directly, without ceremony.",
  type: "verse"
  },

  // Chandogya Upanishad
  {
    id: 7,
    source: "Chandogya Upanishad",
    chapter: "6.8.7",
    verse: null,
    original: "Tat tvam asi.",
    translation: "That thou art.",
    meaning: "Three words. Possibly the most profound sentence in all of human philosophy. The father Uddalaka says this to his son Shvetaketu, pointing to the essence of all existence — Brahman — and then pointing to the boy himself. 'That' (Tat) is the infinite, the absolute, the ground of all being. 'Thou' (Tvam) is you — not your name, your body, your personality, but the awareness that is aware of all of these. 'Art' (Asi) is present tense. Not 'you will become' or 'you could be' — you are, right now, already that. This is the heart of Advaita Vedanta: the seeker and the sought are one.",
    type: "verse"
  },
  {
    id: 8,
    source: "Chandogya Upanishad",
    chapter: "3.14.1",
    verse: null,
    original: "Sarvam khalv idam brahma.",
    translation: "All of this is indeed Brahman.",
    meaning: "This is not a poetic metaphor — it is a direct statement of metaphysics. The entire universe, in all its variety and apparent separateness, is a single undivided reality. The tree, the stone, the thought, the feeling, the distant star — all are Brahman appearing as multiplicity. The spiritual implications are vast. If everything is Brahman, then nothing is truly other. Harm done to another is harm done to oneself. Reverence for life is not sentiment — it is recognition. The Chandogya is asking us to train our perception until we stop seeing objects and start seeing the one reality wearing infinite forms.",
    type: "verse"
  },

  // Mandukya Upanishad
  {
    id: 9,
    source: "Mandukya Upanishad",
    chapter: "1.2",
    verse: null,
    original: "Sarvam hy etad brahma, ayam atma brahma.",
    translation: "All this is indeed Brahman. This Self is Brahman.",
    meaning: "The Mandukya Upanishad is the shortest — just twelve verses — and yet Adi Shankaracharya said it alone is sufficient for liberation. This verse is its opening declaration: the universe is Brahman, and your own Self is Brahman. The teaching that follows maps the four states of consciousness — waking, dreaming, deep sleep, and turiya (pure awareness). The point is that the witness of all three states — the one who is present through all of them without changing — that silent witness is your truest nature. It is not something to attain. It is what remains when you stop mistaking yourself for everything else.",
    type: "verse"
  },
  {
    id: 10,
    source: "Mandukya Upanishad",
    chapter: "1.7",
    verse: null,
    original: "Nantah-prajnam, na bahis-prajnam, nobhayatah-prajnam... prapancopashamam shantam shivam advaitam chaturtham manyante sa atma sa vijneyah.",
    translation: "Not inward-turned, not outward-turned, not both... beyond all phenomena, the fourth — peaceful, auspicious, non-dual. That is the Self. That is to be known.",
    meaning: "The Mandukya describes turiya — the fourth state — by stripping away everything it is not. It is not waking consciousness, not the dreaming mind, not the blankness of deep sleep. It is the pure awareness in which all three arise and dissolve. The words used are telling: shanta (peaceful), shiva (auspicious), advaita (non-dual). This state is not exotic or far away. It is the background of every experience you have ever had — the silent, unchanging witness. The Upanishad's entire project is to point you back to what has always already been here.",
    type: "verse"
  }
]

export default verses
