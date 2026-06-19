// ============================================================
//  EDIT THIS FILE — everything in the experience and in the PDF
//  (signs, can targets, welcome note, farewell, download) comes
//  from it.
// ============================================================

export const CV = {
  name: 'Ivan Pelivan',
  title: 'Software Engineer',
  company: 'Codeasy',
  location: 'Croatia',
  email: 'ivan.pelivan@codeasy.com',
  github: 'github.com/pelivan',
  linkedin: 'linkedin.com/in/ivan-pelivan-511474262',

  summary:
    'Software engineer who likes growing things — products, features, ' +
    'and the occasional apple tree. Builds web apps end to end, from data ' +
    'models and APIs to playful, interactive frontends (this orchard ' +
    'included). Happiest when the problem is fuzzy and there is something ' +
    'real to ship at the end of the day.',

  // The welcome note — typed out, handwritten-letter style, on the intro card.
  welcome: {
    title: "Welcome to Ivan's Orchard",
    subtitle: 'a little corner of my world',
    lines: [
      'Hey there — glad you stopped by.',
      '',
      'This is my orchard. Wander around, read the signs',
      'along the path, and grab a few apples from the baskets.',
      '',
      'Down by the fence there are some old tin cans. Lob an',
      'apple at each one and it’ll knock loose a little story',
      'about what I’ve done.',
      '',
      'When you’ve had your fun, the cabin door opens and you',
      'can take a proper copy of my CV home with you.',
      '',
      '(Oh — and there’s a car in the driveway that could',
      'use a hand. Have a poke around.)',
      '',
      '— Ivan',
    ],
  },

  // Painted onto the wooden story signs along the path. Keep entries short.
  experience: [
    {
      role: 'Software Engineer',
      org: 'Codeasy',
      period: '2023 — present',
      points: [
        'Full-stack work on the Codeasy platform',
        'Frontend features, APIs and integrations',
        'Shipping product improvements end to end',
      ],
    },
    {
      role: 'Before the orchard',
      org: 'Projects & studies',
      period: 'earlier',
      points: [
        'Personal and academic software projects',
        'Open-source tinkering — see github.com/pelivan',
      ],
    },
  ],

  skills: {
    'IN THE TREES (FRONTEND)': ['JavaScript / TypeScript', 'React', 'HTML / CSS', 'Three.js'],
    'UNDER THE HOOD (BACKEND)': ['Node.js', 'REST APIs', 'SQL databases'],
    'TOOLS IN THE SHED': ['Git / GitHub', 'CI/CD', 'Linux', 'Docker'],
  },

  languages: ['Croatian — native', 'English — professional'],

  // One little story per tin can. Order = left-to-right along the rail.
  achievements: [
    'Ships production features at Codeasy that real people use',
    'Built this whole orchard with Three.js — you’re standing in it',
    'Full-stack range: comfortable from the database to the pixel',
    'Picks up new tools fast, and isn’t scared of the unknown',
    'A steady teammate: clear comms, good reviews, no drama',
    'Always tinkering — side projects live at github.com/pelivan',
  ],

  education: [
    {
      school: 'University studies — Computer Science',
      period: 'graduated',
      note: 'Foundations in algorithms, systems and software engineering',
    },
  ],

  // A meta / "making of" sign — true, not fabricated personal data.
  colophon: {
    title: 'This Place',
    subtitle: 'how the orchard was built',
    lines: [
      'You’re standing inside a CV.',
      '',
      'The whole orchard is built with Three.js. Every',
      'texture is painted on a canvas, every sound is',
      'synthesized in the browser, and the PDF you can',
      'take home is generated on the spot — no files,',
      'no downloads, no asset packs.',
      '',
      'Things to try:',
      '• knock all the tin cans off the rail',
      '• find the 6 hidden golden apples',
      '• get the old car in the driveway running',
    ],
  },

  // Reward text for the car/oil easter egg.
  easterEgg: 'You topped up the oil and got her running. Nice — Ivan likes someone who fixes things.',
};
