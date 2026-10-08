export type FoundationQuestion = { prompt: string; options: [string, string, string, string]; answer: number; explanation: string };
export type FoundationCase = { item: string; prompt: string; answer: number; explanation: string; wrong?: Partial<Record<number, string>> };
export type FoundationMission = {
  title: string; idea: string; minutes: number; bins: [string, string, string];
  cases: [FoundationCase, FoundationCase, FoundationCase]; check: FoundationQuestion;
  demo?: "power" | "access" | "timeline"; note?: string;
};
export type FoundationLesson = {
  title: string; subtitle: string; theme: "fundamentals" | "memory" | "history"; sourceNote: string;
  missions: FoundationMission[];
  challenge: FoundationQuestion[];
};

export const fundamentalsLesson: FoundationLesson = {
  title: "Computer Fundamentals Workshop",
  subtitle: "Sort devices, software and code by what they really do.",
  theme: "fundamentals",
  sourceNote: "Original practice based on the saved Grade 6 ICSO synopsis and recent paper patterns.",
  missions: [
    {
      title: "Follow the information", minutes: 3,
      idea: "Input brings data in, the CPU processes instructions, and output presents a result.",
      bins: ["Input", "Process", "Output"],
      cases: [
        { item: "🎤 Microphone", prompt: "A pupil speaks into it. Where does this device fit?", answer: 0, explanation: "A microphone supplies sound data to the computer.", wrong: { 2: "Speakers play sound out; a microphone captures sound coming in." } },
        { item: "⚙️ CPU", prompt: "This follows instructions and works on the data. Where does it fit?", answer: 1, explanation: "The CPU processes instructions and data." },
        { item: "🔊 Speakers", prompt: "These play the computer's finished sound. Where do they fit?", answer: 2, explanation: "Speakers produce sound output." },
      ],
      check: { prompt: "A webcam sends a picture into a computer. It is mainly a/an…", options: ["output device", "input device", "storage device", "operating system"], answer: 1, explanation: "A webcam captures visual input." },
    },
    {
      title: "Touch it or run it?", minutes: 4,
      idea: "Hardware is physical equipment. Software is programs and instructions. Data is the information they work with.",
      bins: ["Hardware", "Software", "Data"],
      cases: [
        { item: "⌨️ Keyboard", prompt: "You can physically touch this input device. Sort it.", answer: 0, explanation: "The keyboard is hardware." },
        { item: "📝 Word program", prompt: "This program tells the computer how to edit a document. Sort it.", answer: 1, explanation: "An application program is software." },
        { item: "📄 Essay text", prompt: "These are the words saved in the document. Sort them.", answer: 2, explanation: "The words are data, handled by software and stored on hardware." },
      ],
      check: { prompt: "Which pair correctly matches a physical part and a program?", options: ["Keyboard — hardware; browser — software", "Keyboard — software; browser — hardware", "Both are hardware", "Both are operating systems"], answer: 0, explanation: "A keyboard is physical hardware; a browser is software." },
    },
    {
      title: "Give software its job", minutes: 4,
      idea: "An operating system manages the computer; an application helps with a task; a utility maintains or protects it.",
      bins: ["Operating system", "Application", "Utility"],
      cases: [
        { item: "🪟 Windows", prompt: "This manages devices, files and other programs. Sort it.", answer: 0, explanation: "Windows is an operating system, a kind of system software." },
        { item: "🎨 Paint", prompt: "A pupil uses this to draw. Sort it.", answer: 1, explanation: "Paint is application software for a user task." },
        { item: "🛡️ Antivirus", prompt: "This scans for harmful software. Sort it.", answer: 2, explanation: "Antivirus is utility software." },
      ],
      check: { prompt: "Which is an operating system's job?", options: ["Only draw pictures", "Manage hardware and run applications", "Print without a printer", "Replace every utility"], answer: 1, explanation: "The operating system manages resources and supports applications." },
    },
    {
      title: "Choose the program type", minutes: 4,
      idea: "General applications serve common tasks; special-purpose applications serve a narrower field; programming tools help create software.",
      bins: ["General app", "Special-purpose app", "Programming tool"],
      cases: [
        { item: "📄 Word processor", prompt: "Many people use this for everyday documents. Sort it.", answer: 0, explanation: "A word processor is a general-purpose application." },
        { item: "📐 CAD program", prompt: "Engineers use this to design technical drawings. Sort it.", answer: 1, explanation: "CAD is a specialised application for design work." },
        { item: "🧰 Compiler", prompt: "A developer uses this when building a program. Sort it.", answer: 2, explanation: "A compiler is a programming tool." },
      ],
      check: { prompt: "Which program is a utility rather than a document application?", options: ["Word processor", "Web browser", "Backup software", "Presentation editor"], answer: 2, explanation: "Backup software helps protect data and is commonly classed as a utility." },
    },
    {
      title: "Read three kinds of code", minutes: 4,
      idea: "Machine code uses binary instructions; assembly uses short symbolic codes; high-level code is easier for people to read.",
      bins: ["Machine code", "Assembly", "High-level"],
      cases: [
        { item: "10100110 00001011", prompt: "Which level is this binary-looking instruction?", answer: 0, explanation: "Machine instructions are represented as binary bits." },
        { item: "MOV A, 5", prompt: "Which level uses a short mnemonic such as MOV?", answer: 1, explanation: "Assembly language uses mnemonics for low-level instructions." },
        { item: "print('Hello')", prompt: "Which level uses a readable statement like this?", answer: 2, explanation: "This is high-level Python code." },
      ],
      check: { prompt: "Which statement is safest?", options: ["Every high-level program runs without translation", "Assembly uses only English paragraphs", "High-level code is usually easier for people to read", "Machine code is written with a paint tool"], answer: 2, explanation: "High-level languages are designed to be more readable; they still need a way to run on a computer." },
    },
    {
      title: "Meet the translators", minutes: 4,
      idea: "Assemblers translate assembly. Compilers translate a program before it runs; interpreters execute instructions through another program. Actual implementations vary.",
      bins: ["Assembler", "Compiler", "Interpreter"],
      cases: [
        { item: "MOV → machine code", prompt: "Which tool handles assembly mnemonics?", answer: 0, explanation: "An assembler translates assembly instructions." },
        { item: "Translate program", prompt: "Which tool commonly translates a whole source program before execution?", answer: 1, explanation: "A compiler translates source code ahead of execution in this simplified model." },
        { item: "Execute through program", prompt: "Which tool executes instructions through an interpreter?", answer: 2, explanation: "An interpreter runs instructions through another program; implementations can include intermediate bytecode." },
      ],
      check: { prompt: "Which tool is most directly paired with assembly language?", options: ["Web browser", "Assembler", "Antivirus", "Printer driver"], answer: 1, explanation: "An assembler translates assembly-language instructions." },
    },
  ],
  challenge: [
    { prompt: "A child speaks a question and hears the answer. Which order best describes the hardware roles?", options: ["Speaker input → CPU → microphone output", "Microphone input → CPU → speaker output", "CPU input → microphone → speaker storage", "Microphone output → CPU → speaker input"], answer: 1, explanation: "The microphone captures input, the CPU processes, and speakers give output." },
    { prompt: "Which statement about software is correct?", options: ["It must be a part you can touch", "It gives instructions that hardware can follow", "It is always the same as a saved document", "It needs no hardware to run"], answer: 1, explanation: "Software is programs and instructions; a document's content is data." },
    { prompt: "A tool scans for malware. How is it usually classified?", options: ["Operating system", "Utility software", "Input device", "Machine language"], answer: 1, explanation: "Antivirus scanning is a utility task." },
    { prompt: "Choose the correct pair: 1. A browser is application software. 2. An operating system manages hardware.", options: ["Only 1", "Only 2", "Both 1 and 2", "Neither"], answer: 2, explanation: "Both statements describe their usual roles." },
    { prompt: "What does the mnemonic MOV most strongly suggest?", options: ["Assembly language", "A photograph file", "Only machine-language bits", "A speaker"], answer: 0, explanation: "Assembly language often uses short instruction names such as MOV." },
    { prompt: "A programmer writes readable source code. What is still needed for the computer to run it?", options: ["Only a monitor", "A way to translate or execute it", "A printer cartridge", "Nothing in any language"], answer: 1, explanation: "High-level code needs an implementation such as a compiler or interpreter." },
  ],
};

export const memoryLesson: FoundationLesson = {
  title: "Memory & Storage Lab",
  subtitle: "Switch the power, sort storage, and make sense of sizes.",
  theme: "memory",
  sourceNote: "Original practice based on the saved Grade 6 ICSO synopsis and recent paper patterns.",
  missions: [
    {
      title: "What survives power-off?", minutes: 3,
      idea: "Typical RAM is volatile: unsaved working data disappears without power. ROM and saved files on a drive persist.",
      bins: ["RAM · working", "ROM · startup", "Drive · saved"], demo: "power",
      cases: [
        { item: "📝 Unsaved edit", prompt: "Where is a program's current unsaved working data typically held?", answer: 0, explanation: "RAM holds working data while the computer is on." },
        { item: "🚀 Startup firmware", prompt: "Which kind of memory keeps basic startup instructions?", answer: 1, explanation: "The synopsis calls this ROM; many modern devices use reprogrammable flash firmware." },
        { item: "📷 Saved photo", prompt: "A saved photo must survive shutdown. Where does it belong?", answer: 2, explanation: "The photo is saved on persistent storage such as an SSD." },
      ],
      check: { prompt: "You shut down before saving an edit. Which item is most at risk?", options: ["The unsaved edit in RAM", "Startup firmware", "A previously saved photo on SSD", "The computer case"], answer: 0, explanation: "Typical RAM loses its contents without power; a saved drive file persists." },
    },
    {
      title: "Choose the memory role", minutes: 4,
      idea: "DRAM commonly supplies main RAM; SRAM is often used for cache; ROM is non-volatile startup memory in the textbook model.",
      bins: ["DRAM · main RAM", "SRAM · cache", "ROM · startup"],
      cases: [
        { item: "Open app workspace", prompt: "Which is commonly used for main working memory?", answer: 0, explanation: "Most computer main memory uses DRAM." },
        { item: "Fast small cache", prompt: "Which RAM type is often used in cache?", answer: 1, explanation: "SRAM is often used for small, fast caches." },
        { item: "Firmware kept off", prompt: "Which textbook memory category keeps startup code without power?", answer: 2, explanation: "ROM is non-volatile; modern firmware may use flash memory." },
      ],
      check: { prompt: "Which pair is correct?", options: ["SRAM — cache; DRAM — main memory", "SRAM — optical disc; DRAM — printer", "ROM — volatile work area; DRAM — DVD", "DRAM — magnetic tape; SRAM — CD"], answer: 0, explanation: "SRAM often serves cache; DRAM commonly serves main memory." },
    },
    {
      title: "Find the storage technology", minutes: 4,
      idea: "HDDs and tape use magnetism, discs such as DVDs use optical lasers, and SSDs/USB drives use flash chips.",
      bins: ["Magnetic", "Optical", "Flash"],
      cases: [
        { item: "🧲 HDD platter", prompt: "A spinning disk with a magnetic surface belongs where?", answer: 0, explanation: "An HDD stores data magnetically on platters." },
        { item: "💿 DVD", prompt: "A laser reads this disc. Sort it.", answer: 1, explanation: "DVDs are optical storage." },
        { item: "⚡ USB drive", prompt: "Chips hold files without moving parts. Sort it.", answer: 2, explanation: "A USB flash drive uses flash memory." },
      ],
      check: { prompt: "Which device has no spinning platter and commonly uses flash memory?", options: ["HDD", "Magnetic tape", "SSD", "DVD"], answer: 2, explanation: "An SSD stores data in solid-state flash chips." },
    },
    {
      title: "Find a file on tape", minutes: 4,
      idea: "Tape must pass earlier positions to reach a later one. A disk or SSD can address a location directly.",
      bins: ["Sequential tape", "Direct-access drive", "Not storage"], demo: "access",
      cases: [
        { item: "📼 Tape backup", prompt: "To reach item 4, this medium passes items 1–3. Sort it.", answer: 0, explanation: "Magnetic tape is sequential-access storage." },
        { item: "💽 SSD", prompt: "This can address a chosen location without winding through earlier items. Sort it.", answer: 1, explanation: "An SSD supports direct/random access." },
        { item: "🖥️ Monitor", prompt: "This displays a file but does not store it. Sort it.", answer: 2, explanation: "A monitor is an output device, not storage." },
      ],
      check: { prompt: "Which medium best illustrates sequential access?", options: ["Magnetic tape", "SSD", "RAM", "USB flash drive"], answer: 0, explanation: "Tape moves through earlier positions to reach later data." },
    },
    {
      title: "Climb the size ladder", minutes: 4,
      idea: "A byte has 8 bits. ICSO papers often use 1024-based KB, MB and GB calculations; formal binary names are KiB, MiB and GiB.",
      bins: ["8 bits", "1024 bytes", "1024 MB"],
      cases: [
        { item: "1 byte", prompt: "In bits, what is this equal to?", answer: 0, explanation: "One byte contains eight bits." },
        { item: "1 KB · exam convention", prompt: "For the paper's 1024-based convention, how many bytes?", answer: 1, explanation: "The paper uses 1 KB = 1024 bytes; formally that quantity is 1 KiB." },
        { item: "1 GB · exam convention", prompt: "For the paper's 1024-based convention, how many MB?", answer: 2, explanation: "The paper uses 1 GB = 1024 MB; formal binary units are GiB and MiB." },
      ],
      check: { prompt: "Using the ICSO paper's 1024-based convention, a 4 GB pen drive is how many MB?", options: ["400 MB", "1024 MB", "4096 MB", "8192 MB"], answer: 2, explanation: "4 × 1024 = 4096 MB in the exam convention. Manufacturers may label capacity using decimal units." },
    },
    {
      title: "Choose the right place", minutes: 4,
      idea: "Match a need to working memory, a persistent everyday drive, or a sequential backup medium.",
      bins: ["RAM", "SSD", "Tape"],
      cases: [
        { item: "App running now", prompt: "Where should its active working data be available quickly?", answer: 0, explanation: "RAM is the computer's active workspace." },
        { item: "Save laptop photos", prompt: "Which device keeps files after shutdown and has no moving parts?", answer: 1, explanation: "An SSD is persistent flash storage." },
        { item: "Long backup archive", prompt: "Which medium is commonly read sequentially?", answer: 2, explanation: "Magnetic tape is used for some backup archives and is sequential." },
      ],
      check: { prompt: "Which statement correctly compares RAM and SSD?", options: ["Both normally lose data when power is off", "RAM is working memory; SSD keeps saved files", "SSD is only an output device", "RAM reads a disc with a laser"], answer: 1, explanation: "Typical RAM is volatile; an SSD keeps saved data without power." },
    },
  ],
  challenge: [
    { prompt: "Which storage is volatile in the usual classroom example?", options: ["RAM", "ROM", "SSD", "DVD"], answer: 0, explanation: "Typical RAM loses its contents when power is removed." },
    { prompt: "Choose the correct pair: 1. SRAM is often used for cache. 2. DRAM is common main memory.", options: ["Only 1", "Only 2", "Both 1 and 2", "Neither"], answer: 2, explanation: "Both statements describe common uses of these RAM types." },
    { prompt: "Which match is correct?", options: ["HDD — optical", "DVD — flash", "SSD — flash", "USB drive — magnetic tape"], answer: 2, explanation: "An SSD commonly uses flash chips; HDDs are magnetic and DVDs are optical." },
    { prompt: "An archive medium must wind past earlier records to reach a later record. Which is it?", options: ["Magnetic tape", "SSD", "USB flash drive", "RAM"], answer: 0, explanation: "This is sequential access, illustrated by magnetic tape." },
    { prompt: "Using the paper's 1024-based convention, which statement is correct?", options: ["1 byte = 4 bits", "1 KB = 1024 bytes", "1 GB = 1024 TB", "1 MB = 8 bits"], answer: 1, explanation: "The paper uses 1024 bytes per KB; formal binary notation would write KiB." },
    { prompt: "A photo is saved, then the laptop is shut down. Where can it remain?", options: ["Only in volatile RAM", "On a persistent drive such as SSD", "Only on the screen", "Inside the keyboard"], answer: 1, explanation: "A saved file on persistent storage remains after shutdown." },
  ],
};
