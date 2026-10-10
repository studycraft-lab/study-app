export type LatestQuestion = { prompt: string; options: [string, string, string, string]; answer: number; explanation: string };
export type LatestCase = { clue: string; prompt: string; answer: number; explanation: string; wrong: Partial<Record<number, string>> };
export type LatestMission = {
  title: string; minutes: number; idea: string; note: string;
  bins: string[]; order: number[]; demo: { front: string; back: string }[];
  cases: LatestCase[]; check: LatestQuestion;
};

export const latestItMissions: LatestMission[] = [
  {
    title: "Read the operating-system map", minutes: 3,
    idea: "An operating system runs a device. A version number tells you which release it has; it does not mean every device can install it.",
    note: "Checked 10 October 2026: iOS 27 is available, Android 17 is available on supported devices, and Windows 11 version 26H2 is rolling out to eligible PCs. Availability varies.",
    bins: ["iOS · Apple", "Android · Google", "Windows · Microsoft"], order: [1, 0, 2],
    demo: [
      { front: "iPhone", back: "iOS 27 adds child-safety improvements and new AI features on eligible devices. Some AI features have age limits." },
      { front: "Android phone", back: "Android 17 brings privacy improvements and better app resizing on larger screens. Rollout varies." },
      { front: "Windows PC", back: "26H2 is an update version of Windows 11, not a new OS called Windows 26." },
    ],
    cases: [
      { clue: "iOS 27", prompt: "Which family does this phone update belong to?", answer: 0, explanation: "iOS is Apple's operating system for iPhone.", wrong: { 1: "Android is Google's mobile system; iOS is Apple's.", 2: "Windows runs PCs; iOS names Apple's phone system." } },
      { clue: "Android 17", prompt: "Which family does this tablet update belong to?", answer: 1, explanation: "Android is Google's mobile operating-system family.", wrong: { 0: "iOS belongs to Apple; Android belongs to Google.", 2: "Windows 11 is a PC operating system, not Android 17." } },
      { clue: "Windows 11 · 26H2", prompt: "Which family does this PC update belong to?", answer: 2, explanation: "26H2 is a release version of Windows 11.", wrong: { 0: "An iPhone may run iOS, but 26H2 labels a Windows 11 PC update.", 1: "Android 17 is a mobile OS release; 26H2 is a Windows 11 version." } },
    ],
    check: { prompt: "Which pair contains older Android release names, rather than an assistant and an OS?", options: ["Oreo and KitKat", "Siri and Alexa", "iOS and Copilot", "Windows and OneDrive"], answer: 0, explanation: "Oreo and KitKat were Android release names. Modern Android major releases are mainly shown by number." },
  },
  {
    title: "See how Office changes", minutes: 4,
    idea: "A version name, a one-time edition and a regularly updated subscription describe different ways software changes.",
    note: "The Olympiad still specifies MS-Office 2016 for its Office questions. Knowing later editions helps you interpret current IT news without replacing that exam scope.",
    bins: ["Office 2007 milestone", "Office 2024 edition", "Microsoft 365 subscription"], order: [2, 0, 1],
    demo: [
      { front: "Office 2007", back: "Introduced the Ribbon interface used in later Office apps." },
      { front: "Office 2024", back: "One-time purchase; security fixes continue, but new major features are not included." },
      { front: "Microsoft 365", back: "Subscription apps receive ongoing features, including Copilot AI in eligible plans." },
    ],
    cases: [
      { clue: "The Ribbon arrives", prompt: "Which milestone is this?", answer: 0, explanation: "Microsoft introduced the Ribbon with Office 2007.", wrong: { 1: "Office 2024 is much later; the Ribbon appeared in Office 2007.", 2: "Microsoft 365 updates regularly, but the Ribbon arrived in Office 2007." } },
      { clue: "Buy once for one computer", prompt: "Which current edition fits?", answer: 1, explanation: "Office 2024 is a one-time purchase edition.", wrong: { 0: "Office 2007 is a historical version, not the current one-time edition here.", 2: "Microsoft 365 is normally a subscription, not a one-time edition." } },
      { clue: "New features over time", prompt: "Which product model fits a subscription that keeps updating?", answer: 2, explanation: "Microsoft 365 subscription apps receive ongoing feature updates.", wrong: { 0: "Office 2007 marks the Ribbon's introduction, not a current subscription.", 1: "Office 2024 receives security updates but not the next major feature release as part of that purchase." } },
    ],
    check: { prompt: "Which statement is accurate?", options: ["Office 2024 and Microsoft 365 are the same purchase model", "Microsoft 365 receives feature updates; Office 2024 is a one-time edition", "Office 2016 is no longer in the ICSO syllabus", "The Ribbon first appeared in Windows 11"], answer: 1, explanation: "Microsoft distinguishes the subscription from the one-time edition. The SOF syllabus still names Office 2016 for exam questions." },
  },
  {
    title: "Meet the changing assistants", minutes: 4,
    idea: "Voice and AI assistants can set reminders or answer questions. Their names and features change, so connect each product to its maker and check important answers.",
    note: "Google has moved many mobile Assistant users toward Gemini. Microsoft's standalone Cortana for Windows was retired; Copilot is a newer Microsoft AI product. Availability depends on device, age and region.",
    bins: ["Apple", "Google", "Microsoft", "Amazon"], order: [2, 0, 3, 1],
    demo: [
      { front: "Siri", back: "Apple's assistant; newer AI features are limited to supported devices and accounts." },
      { front: "Gemini", back: "Google's AI assistant, replacing the classic Assistant experience on many phones." },
      { front: "Copilot", back: "Microsoft's AI assistant name across some products and plans." },
      { front: "Alexa", back: "Amazon's assistant on Echo and other devices." },
    ],
    cases: [
      { clue: "Siri", prompt: "Which company makes it?", answer: 0, explanation: "Siri is made by Apple.", wrong: { 1: "Google's newer mobile assistant is Gemini.", 2: "Microsoft's newer AI brand is Copilot.", 3: "Amazon makes Alexa." } },
      { clue: "Gemini", prompt: "Which company makes it?", answer: 1, explanation: "Gemini is Google's AI assistant.", wrong: { 0: "Apple makes Siri.", 2: "Microsoft uses the Copilot name.", 3: "Amazon makes Alexa." } },
      { clue: "Copilot", prompt: "Which company makes it?", answer: 2, explanation: "Copilot is Microsoft's AI assistant brand.", wrong: { 0: "Apple's assistant is Siri.", 1: "Google's assistant is Gemini.", 3: "Amazon's assistant is Alexa." } },
      { clue: "Alexa", prompt: "Which company makes it?", answer: 3, explanation: "Alexa is made by Amazon.", wrong: { 0: "Apple makes Siri.", 1: "Google makes Gemini.", 2: "Microsoft makes Copilot." } },
    ],
    check: { prompt: "Select the accurate pair of statements: (1) Gemini is from Google. (2) Cortana is still the default Windows 11 assistant.", options: ["Only (1)", "Only (2)", "Both", "Neither"], answer: 0, explanation: "Gemini is Google's assistant. Standalone Cortana in Windows was retired in 2023." },
  },
  {
    title: "Save, share, or show?", minutes: 4,
    idea: "Cloud storage keeps a file in an online account. Google Drive is from Google; OneDrive is from Microsoft. Mirroring shows a device's screen elsewhere.",
    note: "Mirroring a phone on a TV does not by itself save the phone's files to a cloud account. A USB drive holds a local copy. Cloud sharing permissions control whether others can view or edit.",
    bins: ["Cloud storage", "Screen mirroring", "Local copy"], order: [2, 0, 3, 1],
    demo: [
      { front: "OneDrive", back: "Microsoft's cloud service can save, sync and share files." },
      { front: "Google Drive", back: "Google's cloud service can save and share files; it is not made by Microsoft." },
      { front: "Mirror to TV", back: "Display a live phone screen on a larger screen." },
      { front: "USB drive", back: "Keep a physical copy of a file on removable storage." },
    ],
    cases: [
      { clue: "Class notes on OneDrive", prompt: "Which action saves the document to an online account?", answer: 0, explanation: "OneDrive is cloud storage and can sync files across devices.", wrong: { 1: "Mirroring displays a screen; it does not store the notes in OneDrive.", 2: "A USB drive is a local copy, not an online account." } },
      { clue: "Google Drive folder", prompt: "A pupil saves a file in Google's online Drive service. Which kind of action is this?", answer: 0, explanation: "Google Drive is Google's cloud storage service; OneDrive is Microsoft's.", wrong: { 1: "A Google Drive folder stores a file online; mirroring just displays a screen.", 2: "Google Drive is online storage, not a local USB copy." } },
      { clue: "Phone picture shown live on TV", prompt: "Which action displays the phone screen?", answer: 1, explanation: "Screen mirroring displays the phone's screen on a TV.", wrong: { 0: "Cloud storage saves files; it does not describe showing a live screen.", 2: "A local copy stores data; it does not display a live phone screen." } },
      { clue: "Essay copied to USB", prompt: "Which action leaves a file on a removable drive?", answer: 2, explanation: "The USB drive holds a local copy of the essay.", wrong: { 0: "A USB copy is on the removable drive; cloud storage is online.", 1: "Mirroring shows a screen, not a saved USB file." } },
    ],
    check: { prompt: "Which statement is correct? (1) Google Drive is provided by Microsoft. (2) Mirroring can show a phone screen on a TV.", options: ["Only (1)", "Only (2)", "Both", "Neither"], answer: 1, explanation: "Google Drive is from Google, not Microsoft. Mirroring can display a phone screen on a TV." },
  },
  {
    title: "Step inside or add to the room", minutes: 4,
    idea: "VR surrounds you with a computer-made world. AR adds digital objects to a view of the real world. Screen mirroring only copies what a display shows.",
    note: "The 2025 paper used an immersive computer-made world as the clue for VR. A headset can also support mixed experiences, so identify the experience being described.",
    bins: ["Virtual reality (VR)", "Augmented reality (AR)", "Screen mirroring"], order: [1, 0, 2],
    demo: [
      { front: "Virtual planetarium", back: "Headset surrounds the learner with a computer-made sky: VR." },
      { front: "Planet on desk", back: "A camera view adds a digital planet to a real desk: AR." },
      { front: "Phone on TV", back: "The TV shows the phone's ordinary screen: mirroring." },
    ],
    cases: [
      { clue: "Inside a digital museum", prompt: "A headset makes you feel present in a completely computer-made place. Which is it?", answer: 0, explanation: "That immersive virtual setting is VR.", wrong: { 1: "AR keeps the real world visible and adds digital objects to it.", 2: "Mirroring displays a screen elsewhere; it does not place you in a virtual world." } },
      { clue: "3D planet on a real desk", prompt: "A tablet camera shows the desk with a digital planet on top. Which is it?", answer: 1, explanation: "AR overlays a digital object on a live view of the real desk.", wrong: { 0: "VR replaces the setting with a computer-made world; the real desk is still visible here.", 2: "Mirroring copies a screen; it does not add a new 3D object to the camera view." } },
      { clue: "Phone screen on a TV", prompt: "The TV simply repeats the phone display. Which is it?", answer: 2, explanation: "That is screen mirroring.", wrong: { 0: "Seeing the same 2D phone screen on a TV is not VR immersion.", 1: "No digital object is added to a real-world camera view, so it is not AR." } },
    ],
    check: { prompt: "Which is the strongest clue for VR in an Olympiad question?", options: ["Feeling inside a computer-created world", "Saving an essay online", "Showing the same phone screen on a TV", "Adding a digital label over a real object"], answer: 0, explanation: "VR is an immersive computer-created environment. A digital overlay on the real world points to AR." },
  },
  {
    title: "Be a careful technology reporter", minutes: 4,
    idea: "New products roll out gradually. Check an official source and device support before repeating a 'latest' claim; verify important AI answers.",
    note: "Passkeys are a growing sign-in method that uses a device unlock such as a PIN, face or fingerprint. The site must support passkeys. This lesson is a safe simulation; never enter real account details here.",
    bins: ["Supported fact", "Check the device", "Verify before acting"], order: [2, 0, 1],
    demo: [
      { front: "Passkey", back: "A supported site can let you sign in with your device unlock instead of a typed password." },
      { front: "New OS update", back: "It may reach eligible devices in stages; check your device's official update screen." },
      { front: "AI answer", back: "It can help explain, but confirm dates and other important facts with the original source." },
    ],
    cases: [
      { clue: "Passkey uses device unlock", prompt: "A supported site offers a passkey using face, fingerprint or PIN. How should this claim be filed?", answer: 0, explanation: "That describes how passkey sign-in can work on supported services and devices.", wrong: { 1: "The claim already says the site supports passkeys; the device-unlock method is a documented fact.", 2: "You should still protect your device, but the passkey description itself is supported." } },
      { clue: "Will every phone get Android 17 today?", prompt: "A classmate assumes every Android phone gets a release on the same day. What should be checked?", answer: 1, explanation: "Updates vary by device maker, model and rollout; check that device's official update information.", wrong: { 0: "A release being available does not mean every phone can install it today.", 2: "There is a specific next step: check the device's support and rollout status." } },
      { clue: "AI says the exam moved", prompt: "An assistant gives a new exam date without an official source. What should happen?", answer: 2, explanation: "Confirm the date with the official exam or school notice before acting.", wrong: { 0: "An AI answer alone does not verify an important date.", 1: "The issue is evidence for the exam date, not device compatibility." } },
    ],
    check: { prompt: "Which response to a new technology claim is strongest?", options: ["Share the first AI answer immediately", "Treat every announced feature as available on every device", "Check its date, official source and device support", "Memorise a 'latest version' forever"], answer: 2, explanation: "Dates, official sources and device support keep a fast-changing topic accurate." },
  },
];

export const latestItChallenge: LatestQuestion[] = [
  { prompt: "As checked on 10 October 2026, which statement is accurate?", options: ["iOS 27 is Apple's major iPhone OS release; Android 17 is Google's mobile OS release", "Android 17 is Microsoft's Office edition", "Windows 26 is a separate operating system from Windows 11", "Every device already has every 2026 update"], answer: 0, explanation: "The names identify different OS families. Windows 11 version 26H2 is still Windows 11, and update availability varies." },
  { prompt: "Which option correctly compares two Microsoft Office products?", options: ["Office 2024 is a one-time edition; Microsoft 365 is a subscription with ongoing feature updates", "Office 2024 is Android software; Microsoft 365 is a phone", "Both names mean the same purchase model", "The 2026 ICSO syllabus has replaced all Office 2016 questions with Office 2024"], answer: 0, explanation: "The purchase models differ. SOF still specifies Office 2016 for its Office questions." },
  { prompt: "Match the assistants: (1) Siri—Apple. (2) Gemini—Google. (3) Copilot—Microsoft.", options: ["Only (1)", "Only (1) and (2)", "All three", "None"], answer: 2, explanation: "All three maker matches are correct. Product features may depend on device, account or location." },
  { prompt: "A pupil shows a phone screen on a TV, then saves a document in OneDrive. Which order names the actions?", options: ["Cloud storage, then screen mirroring", "Screen mirroring, then cloud storage", "VR, then AR", "Local USB copy, then VR"], answer: 1, explanation: "Mirroring displays the phone screen; OneDrive stores or syncs a document online." },
  { prompt: "Which scene is virtual reality rather than augmented reality?", options: ["A digital creature appears over a real desk in the camera view", "A headset surrounds you with a computer-created museum", "A TV repeats the phone screen", "A file appears in a shared folder"], answer: 1, explanation: "VR immerses the user in a virtual environment; AR adds digital objects to the real view." },
  { prompt: "Which pair of statements is sound? (1) A supported passkey can use device unlock. (2) An AI assistant's exam-date answer should be checked against an official notice.", options: ["Only (1)", "Only (2)", "Both (1) and (2)", "Neither"], answer: 2, explanation: "Passkeys can use device unlock, and important AI answers need verification." },
];
