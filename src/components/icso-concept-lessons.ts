export type IcsoQuestion = {
  prompt: string;
  options: [string, string, string, string];
  answer: number;
  explanation: string;
};

export type IcsoStep = {
  prompt: string;
  options: [string, string, string];
  answer: number;
  result: string;
  hint: string;
  wrongFeedback?: Partial<Record<number, string>>;
};

export type IcsoMission = {
  title: string;
  minutes: number;
  idea: string;
  scene: { title: string; kind: "path" | "scope" | "topology"; nodes: [string, string, string]; caption: string };
  steps: IcsoStep[];
  check: IcsoQuestion;
};

export type IcsoLesson = {
  title: string;
  subtitle: string;
  theme: "network" | "ai";
  missions: IcsoMission[];
  challenge: IcsoQuestion[];
  sourceNote: string;
};

export const networkingLesson: IcsoLesson = {
  title: "Networking & Cyber Safety Lab",
  subtitle: "Connect devices, trace the web, and make safer choices online.",
  theme: "network",
  sourceNote: "A compact practice model. No real network connection or message is opened.",
  missions: [
    {
      title: "Share on a network", minutes: 3,
      idea: "A computer network links devices so they can share data or resources such as a printer.",
      scene: { title: "Classroom connection", kind: "path", nodes: ["💻 Laptop", "↔ Network", "🖨️ Printer"], caption: "The devices can share the printer when connected to the same network." },
      steps: [
        { prompt: "Which setup lets two classroom computers use one printer?", options: ["Connect them to a shared network", "Put them on separate desks", "Turn off the printer"], answer: 0, result: "The network lets both computers reach the shared printer.", hint: "Think about a connection between the devices." },
        { prompt: "What else can connected computers share?", options: ["Only electricity", "Files and data", "Only screen brightness"], answer: 1, result: "Networks can also carry files and data between devices.", hint: "A network moves information." },
      ],
      check: { prompt: "Which is the main purpose of a computer network?", options: ["To make every screen identical", "To connect devices and share resources", "To replace all storage", "To remove the internet"], answer: 1, explanation: "A network connects devices so they can exchange data and share resources." },
    },
    {
      title: "Choose the network size", minutes: 4,
      idea: "LAN, MAN and WAN describe common network scopes: local area, metropolitan area and wide area.",
      scene: { title: "From nearby to far away", kind: "scope", nodes: ["🏫 Building · LAN", "🏙️ City · MAN", "🌍 Wide area · WAN"], caption: "These are typical examples, not strict distance cutoffs." },
      steps: [
        { prompt: "A school's computers connect within one building. Which scope fits best?", options: ["WAN", "LAN", "MAN"], answer: 1, result: "A local area network, or LAN, covers a limited area such as a school building.", hint: "Local means nearby." },
        { prompt: "A network links several sites across a city. Which scope fits best?", options: ["MAN", "LAN", "PAN"], answer: 0, result: "A metropolitan area network, or MAN, can span a city.", hint: "Metropolitan refers to a city." },
        { prompt: "A company links offices across countries. Which scope fits best?", options: ["LAN", "MAN", "WAN"], answer: 2, result: "A wide area network, or WAN, can span large geographic areas.", hint: "Wide area is the largest of these three examples." },
      ],
      check: { prompt: "What does LAN stand for?", options: ["Large Access Node", "Local Area Network", "Linked Area Number", "Local Application Network"], answer: 1, explanation: "LAN means Local Area Network." },
    },
    {
      title: "Trace the topology", minutes: 4,
      idea: "Topology describes how network devices are connected. Star has a central device; bus uses one shared backbone; ring forms a loop.",
      scene: { title: "Three connection shapes", kind: "topology", nodes: ["⭐ Star", "━ Bus", "◯ Ring"], caption: "These drawings show connection shapes, not the speed of a real network." },
      steps: [
        { prompt: "Every classroom device connects to one central switch. Which shape is this?", options: ["Ring", "Star", "Bus"], answer: 1, result: "In a star topology, each device connects to a central device.", hint: "Look for a centre with spokes.", wrongFeedback: { 0: "A ring connects devices in a closed loop. Here every device has its own link to a centre.", 2: "A bus uses one shared backbone cable. Here each device links to a central switch." } },
        { prompt: "Every device taps into one shared main cable. Which shape is this?", options: ["Bus", "Star", "Ring"], answer: 0, result: "A bus topology uses a shared backbone cable.", hint: "Think of several stops along one route." },
        { prompt: "Devices connect in a closed loop. Which shape is this?", options: ["Bus", "Star", "Ring"], answer: 2, result: "A ring topology connects devices in a loop. The direction of data flow depends on the design.", hint: "A ring is a loop." },
      ],
      check: { prompt: "Which topology has a central switch with devices connected around it?", options: ["Bus", "Ring", "Star", "No topology"], answer: 2, explanation: "Star connects each device to a central device." },
    },
    {
      title: "Find a page on the web", minutes: 4,
      idea: "The internet connects networks globally; an intranet restricts access to an organisation. A browser opens pages, while a search engine helps find them.",
      scene: { title: "Search and open", kind: "path", nodes: ["🌐 Browser", "🔎 Search engine", "📄 Website"], caption: "The search engine is a web service used through a browser." },
      steps: [
        { prompt: "A school has a private internal network available only to staff on campus. What is it?", options: ["Intranet", "The whole internet", "A browser"], answer: 0, result: "An intranet is a private network used within an organisation.", hint: "Only the organisation's members can use it.", wrongFeedback: { 1: "The internet connects networks globally. This example is the school's restricted internal network.", 2: "A browser is software for opening pages. The question describes a private network." } },
        { prompt: "Which program displays a web page on your screen?", options: ["Search engine", "Web browser", "Printer driver"], answer: 1, result: "A web browser retrieves and displays web pages.", hint: "Think of Firefox, Chrome or Edge." },
        { prompt: "What helps you find pages matching your keywords?", options: ["Search engine", "Intranet cable", "Antivirus"], answer: 0, result: "A search engine finds matching pages; you usually use it inside a browser.", hint: "Think of Google, Bing or DuckDuckGo." },
      ],
      check: { prompt: "Which pair is correctly matched?", options: ["Browser — finds only private files", "Search engine — displays all pages by itself", "Intranet — private organisation network", "Internet — one school's private network"], answer: 2, explanation: "An intranet is private to an organisation; the internet connects networks globally." },
    },
    {
      title: "Spot the malware", minutes: 4,
      idea: "Malware means harmful software. A virus infects files, a worm copies itself, and a Trojan pretends to be safe.",
      scene: { title: "Three warning patterns", kind: "path", nodes: ["📄 Virus · file", "🔁 Worm · self-copy", "🎭 Trojan · disguise"], caption: "These are simplified patterns for recognition, not real malware samples." },
      steps: [
        { prompt: "A harmful program attaches itself to a document and spreads when the file is opened. Which is it?", options: ["Trojan", "Virus", "Worm"], answer: 1, result: "A virus infects a file or program and can spread when that infected item is run.", hint: "This one depends on an infected file." },
        { prompt: "A harmful program replicates itself across connected devices. Which is it?", options: ["Worm", "Trojan", "Browser"], answer: 0, result: "A worm can copy itself and spread across systems or networks.", hint: "It copies itself." },
        { prompt: "A fake game installer hides harmful code. Which is it?", options: ["Virus", "Worm", "Trojan"], answer: 2, result: "A Trojan disguises itself as something useful or harmless.", hint: "The disguise is the clue.", wrongFeedback: { 0: "A virus infects another file or program. The clue here is the fake game's disguise.", 1: "A worm copies and spreads itself. The clue here is the fake game's disguise." } },
      ],
      check: { prompt: "Which statement about a Trojan is correct?", options: ["It is always a web browser", "It looks harmless while hiding harmful code", "It is a network shape", "It can only infect printers"], answer: 1, explanation: "A Trojan tricks people by appearing legitimate." },
    },
    {
      title: "Choose a safer action", minutes: 4,
      idea: "Pause before unfamiliar links or downloads. Use strong, unique passwords, updates and extra sign-in protection when available.",
      scene: { title: "Suspicious inbox", kind: "path", nodes: ["🎁 Prize message", "⏸️ Pause", "🧑‍🧑‍🧒 Trusted adult"], caption: "The pretend message never opens a real link." },
      steps: [
        { prompt: "A stranger's message says you won a prize and asks for your password. What should you do?", options: ["Reply with the password", "Open the link quickly", "Do not reply; tell a trusted adult"], answer: 2, result: "Do not share a password or follow the link. Tell a trusted adult and report the message.", hint: "The message is asking for a secret.", wrongFeedback: { 0: "A password is private. A prize message asking for it is a warning sign.", 1: "The link could lead to a fake sign-in page. Pause and ask a trusted adult." } },
        { prompt: "Which password habit is safer?", options: ["Use one short password everywhere", "Use a different strong password for each account", "Write passwords in public comments"], answer: 1, result: "Unique strong passwords reduce the damage if one account is exposed.", hint: "Reusing a password spreads the risk." },
        { prompt: "What should you do before installing an unfamiliar app?", options: ["Ask a trusted adult and check the source", "Ignore updates and warnings", "Give it every permission"], answer: 0, result: "Check the source and ask a trusted adult before installing unknown software.", hint: "Do not trust an unfamiliar download immediately." },
      ],
      check: { prompt: "A link from an unknown sender asks you to sign in. Which action is safest?", options: ["Enter your password", "Forward it to friends", "Avoid the link and ask a trusted adult", "Download its attachment"], answer: 2, explanation: "A suspicious sign-in link may be phishing. Do not enter credentials; seek help." },
    },
  ],
  challenge: [
    { prompt: "Which network usually covers a school building?", options: ["WAN", "MAN", "LAN", "The entire internet"], answer: 2, explanation: "A LAN connects devices in a limited local area." },
    { prompt: "A diagram has one device in the centre and links to each computer. Name the topology.", options: ["Bus", "Ring", "Star", "WAN"], answer: 2, explanation: "A star connects devices through a central device." },
    { prompt: "Choose the correct statements. 1. A browser displays web pages. 2. A search engine helps find pages.", options: ["Only 1", "Only 2", "Both 1 and 2", "Neither"], answer: 2, explanation: "Both statements are correct; a search engine is commonly used through a browser." },
    { prompt: "A harmful app looks like a free game. What is the best malware label?", options: ["Trojan", "Worm", "LAN", "Search engine"], answer: 0, explanation: "A Trojan hides harmful behaviour behind a harmless-looking app." },
    { prompt: "Which action best protects a child from a suspicious prize message?", options: ["Share a password to claim it", "Click first and ask later", "Ignore the link and tell a trusted adult", "Install its attachment"], answer: 2, explanation: "Pause, avoid the link and seek help from a trusted adult." },
    { prompt: "Which statement is correct?", options: ["An intranet is open to everyone worldwide", "A WAN connects only one room", "A worm can spread by copying itself", "A browser is malware"], answer: 2, explanation: "A worm can replicate and spread; the other statements confuse network or software terms." },
  ],
};

export const aiRoboticsLesson: IcsoLesson = {
  title: "AI & Robotics Mission Lab",
  subtitle: "Sort AI tasks, guide a robot, and test what a prediction means.",
  theme: "ai",
  sourceNote: "The examples are small simulations. No model is trained and no robot is controlled.",
  missions: [
    {
      title: "AI or simple automation?", minutes: 4,
      idea: "AI systems can use data to recognise patterns, make predictions or work with language. A fixed timer follows a preset rule.",
      scene: { title: "Two kinds of programs", kind: "path", nodes: ["📊 Data", "🧠 Model or rule", "💡 Output"], caption: "An AI prediction can be useful and still be wrong." },
      steps: [
        { prompt: "A camera app identifies a cat in a new photo. Which description fits best?", options: ["A pattern-recognition AI task", "Only a fixed timer", "A printer cable"], answer: 0, result: "Recognising objects in images is a common AI task called computer vision.", hint: "The app interprets an image." },
        { prompt: "A lamp turns on every day at exactly 6 p.m. using a fixed timer. Does it need AI?", options: ["Yes, every timer is AI", "No, a fixed rule can do that", "Only if it has a camera"], answer: 1, result: "A timer can follow a preset rule without AI.", hint: "It does the same pre-set action each day.", wrongFeedback: { 0: "A fixed time rule does the same action each day; it does not need a learned prediction.", 2: "A camera is a sensor. Having a camera would not by itself make the timer an AI system." } },
      ],
      check: { prompt: "Which statement about AI output is safest?", options: ["It is always correct", "It can make mistakes and should be checked", "It must come from a robot", "It never uses data"], answer: 1, explanation: "AI predictions can be useful but are not guaranteed correct." },
    },
    {
      title: "Match the AI domain", minutes: 4,
      idea: "Speech recognition works with spoken audio; NLP works with human language; computer vision works with images.",
      scene: { title: "Input to task", kind: "path", nodes: ["🎙️ Speech", "💬 Language", "📷 Images"], caption: "Real products may combine more than one domain." },
      steps: [
        { prompt: "A phone turns your spoken words into written text. Which domain is most direct?", options: ["Computer vision", "Speech recognition", "Robotics"], answer: 1, result: "Speech recognition converts spoken audio into text.", hint: "The input is spoken sound.", wrongFeedback: { 0: "Computer vision works with images. This task starts with spoken sound.", 2: "Robotics controls physical machines. This task converts speech to text." } },
        { prompt: "A chatbot replies to a typed question. Which domain helps it handle language?", options: ["NLP", "Computer vision", "Mechanical motion"], answer: 0, result: "Natural language processing, or NLP, works with human language.", hint: "The input and output are words." },
        { prompt: "Software locates a bicycle in a photograph. Which domain is most direct?", options: ["Speech recognition", "Expert rules", "Computer vision"], answer: 2, result: "Computer vision works with images or video.", hint: "The input is a picture." },
      ],
      check: { prompt: "Which pairing is correct?", options: ["Speech recognition — identifies spoken words", "Computer vision — stores passwords", "NLP — moves a wheel", "Robotics — translates only text"], answer: 0, explanation: "Speech recognition identifies spoken words; other systems may combine it with NLP." },
    },
    {
      title: "Learn from examples", minutes: 4,
      idea: "Machine learning uses examples or data to find patterns. A recommendation is a prediction, not proof of what someone will like.",
      scene: { title: "A tiny recommendation", kind: "path", nodes: ["🎬 Past choices", "🔍 Pattern", "✨ Suggestion"], caption: "This is a diagram of the idea, not a trained model." },
      steps: [
        { prompt: "A video service uses past viewing patterns to suggest a film. What is it doing?", options: ["Predicting a likely match", "Reading a person's mind", "Changing a network cable"], answer: 0, result: "The system predicts what might interest someone from patterns in data.", hint: "It uses examples to make a guess." },
        { prompt: "A suggestion looks wrong. What does that show?", options: ["The user must watch it", "Predictions can be mistaken", "All robots are broken"], answer: 1, result: "A model can make a poor prediction, so people should check its output.", hint: "A guess is not a guarantee." },
      ],
      check: { prompt: "Which example most clearly uses machine learning?", options: ["A wall clock showing time", "A program suggesting songs from listening patterns", "A keyboard with no software", "A fixed paper timetable"], answer: 1, explanation: "Recommendations can use patterns learned from listening data." },
    },
    {
      title: "Guide a robot", minutes: 3,
      idea: "A robot is a machine that acts in the physical world. Some follow fixed instructions; others use AI. Sensors, a controller and motors can work together.",
      scene: { title: "Robot pathway", kind: "path", nodes: ["👁️ Sensor", "⚙️ Controller", "🦾 Motor"], caption: "A robot can act with fixed rules; AI is optional." },
      steps: [
        { prompt: "What could tell a toy robot that an obstacle is nearby?", options: ["A sensor", "A slide theme", "A font"], answer: 0, result: "A sensor measures something about the robot's surroundings.", hint: "It must detect the obstacle." },
        { prompt: "What part makes the robot's wheels turn?", options: ["A search engine", "A motor", "A browser tab"], answer: 1, result: "A motor creates movement after the controller sends a command.", hint: "Think of a part that moves machinery." },
        { prompt: "A factory arm repeats the same programmed motion. Must it use AI?", options: ["Yes, every robot uses AI", "No, a fixed program can control a robot", "Only if it speaks"], answer: 1, result: "Robots do not automatically use AI. Fixed instructions can control a robot.", hint: "The task repeats the same preset action." },
      ],
      check: { prompt: "Which sequence best describes a simple sensing robot?", options: ["Motor → website → printer", "Sensor → controller → motor", "Browser → search → page", "Password → virus → worm"], answer: 1, explanation: "A sensor detects; a controller decides what command to send; a motor moves." },
    },
    {
      title: "People have different strengths", minutes: 4,
      idea: "The synopsis uses a multiple-intelligences framework to name human strengths. These are not types of computer AI.",
      scene: { title: "Human strengths", kind: "path", nodes: ["🎵 Music", "🌿 Nature", "🤝 People"], caption: "Other examples include movement, language and understanding oneself." },
      steps: [
        { prompt: "Recognising rhythms and melodies is an example of which human strength?", options: ["Musical", "Naturalistic", "Kinaesthetic"], answer: 0, result: "Musical intelligence is associated with patterns in sound and rhythm.", hint: "Think of music." },
        { prompt: "Recognising plants and animals is closest to which strength?", options: ["Verbal", "Naturalistic", "Interpersonal"], answer: 1, result: "Naturalistic intelligence concerns noticing patterns in nature.", hint: "Look at the natural world." },
        { prompt: "Understanding another person's feelings is closest to which strength?", options: ["Interpersonal", "Intrapersonal", "Musical"], answer: 0, result: "Interpersonal means understanding others; intrapersonal means understanding oneself.", hint: "Inter means between people." },
      ],
      check: { prompt: "Which word describes understanding your own thoughts and feelings?", options: ["Interpersonal", "Intrapersonal", "Naturalistic", "Computer vision"], answer: 1, explanation: "Intrapersonal concerns understanding oneself. It is a human-strength term, not an AI domain." },
    },
    {
      title: "Predict and check", minutes: 4,
      idea: "Predictive search offers possible completions as you type. An expert system uses stored knowledge and rules to make a recommendation.",
      scene: { title: "Two ways to suggest", kind: "path", nodes: ["⌨️ Partial query", "💡 Suggestion", "✅ You decide"], caption: "Suggestions may use different signals and do not know your exact intention." },
      steps: [
        { prompt: "You type 'planets in' and the search box suggests 'planets in our solar system'. What is that?", options: ["Predictive search", "A robot motor", "A computer virus"], answer: 0, result: "Predictive search offers a possible completion before you finish typing.", hint: "The suggestion predicts the rest of a query." },
        { prompt: "A plant-care expert program combines stored rules, including 'if soil is dry, suggest water'. What best describes that decision?", options: ["A rule-based expert system", "A speech recogniser", "A network topology"], answer: 0, result: "A rule-based expert system applies stored knowledge to a case; it need not learn from data.", hint: "The decision follows stored if–then rules." },
        { prompt: "Should you assume every search suggestion is exactly what you meant?", options: ["Yes, always", "No, read and choose for yourself", "Only when a robot types it"], answer: 1, result: "A suggestion is a prediction. Check it before selecting it.", hint: "A suggestion can be wrong.", wrongFeedback: { 0: "A suggested completion is only a guess, even when it looks confident.", 2: "The person typing should check suggestions; a robot does not make them automatically correct." } },
      ],
      check: { prompt: "Which statement is correct?", options: ["Predictive search reads minds", "An expert system may use stored rules", "A search suggestion is always right", "All robots learn from data"], answer: 1, explanation: "Expert systems can apply stored rules; suggestions and AI outputs still need checking." },
    },
  ],
  challenge: [
    { prompt: "Which task is most directly computer vision?", options: ["Finding a bicycle in a photo", "Turning on a fixed timer", "Playing a saved audio file", "Printing a document"], answer: 0, explanation: "Computer vision analyses visual data such as images." },
    { prompt: "Choose the correct statements. 1. Speech recognition can turn speech into text. 2. NLP works with human language.", options: ["Only 1", "Only 2", "Both 1 and 2", "Neither"], answer: 2, explanation: "Both are correct. Products often combine the two domains." },
    { prompt: "A system recommends songs using patterns in listening history. Which idea fits best?", options: ["Machine learning", "Bus topology", "Word formatting", "A robot motor"], answer: 0, explanation: "A recommender can learn patterns from examples and predict likely interests." },
    { prompt: "Which claim about robots is correct?", options: ["Every robot must use AI", "A robot can follow fixed programmed instructions", "Every AI system is a physical robot", "A robot cannot use sensors"], answer: 1, explanation: "A robot may use fixed rules or AI, depending on its design." },
    { prompt: "A child is good at understanding other people's feelings. Which human strength best fits?", options: ["Naturalistic", "Musical", "Interpersonal", "Computer vision"], answer: 2, explanation: "Interpersonal intelligence concerns understanding and working with other people." },
    { prompt: "Which statement about a search suggestion is safest?", options: ["It is always the only correct query", "It is a possible completion to check", "It proves the system knows your thoughts", "It is a computer virus"], answer: 1, explanation: "Predictive search offers possible completions; the user should check them." },
  ],
};
