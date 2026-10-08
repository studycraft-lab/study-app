export type WindowsQuestion = { prompt: string; options: [string, string, string, string]; answer: number; explanation: string };
export type WindowsStep = { action: string; label: string; result: string };
export type WindowsMission = { title: string; idea: string; minutes: number; steps: WindowsStep[]; check: WindowsQuestion };

export const windowsMissions: WindowsMission[] = [
  {
    title: "Find an app from Start", minutes: 3,
    idea: "The Start button opens pinned apps and search. Taskbar icons are centered by default, but the user can move their alignment left.",
    steps: [
      { action: "taskbar:start", label: "Open Start on the taskbar", result: "Start shows pinned apps and a way to search." },
      { action: "start:search", label: "Choose Search apps and files", result: "Windows Search can find apps, files and settings." },
      { action: "search:explorer", label: "Open File Explorer from results", result: "File Explorer opens folders and files." },
    ],
    check: { prompt: "Where do Windows 11 taskbar icons normally appear before customization?", options: ["Centered along the bottom", "Only at the top", "Inside every folder", "They cannot be moved"], answer: 0, explanation: "Windows 11 centers taskbar icons by default; alignment can be changed." },
  },
  {
    title: "Snap two windows", minutes: 4,
    idea: "Snap Layouts arrange windows. Hover over a window's maximize button, or press Win + Z, to show the layout flyout.",
    steps: [
      { action: "window:maximize", label: "Open the Snap flyout at Maximize", result: "The flyout offers layouts; this model shows two examples." },
      { action: "layout:two", label: "Choose the two-column layout", result: "The first window fills one side and Snap Assist offers another window." },
      { action: "assist:notes", label: "Choose Notes for the other side", result: "Both windows are now side by side as a Snap group." },
    ],
    check: { prompt: "Which Windows 11 feature arranges open windows into a preset grid?", options: ["Widgets", "Snap Layouts", "Control Panel", "File Explorer"], answer: 1, explanation: "Snap Layouts offer preset window arrangements." },
  },
  {
    title: "Open Widgets", minutes: 4,
    idea: "Widgets give at-a-glance information. The Widgets button or Win + W can open the board when the feature is available.",
    steps: [
      { action: "taskbar:widgets", label: "Open Widgets from the taskbar", result: "The Widgets board opens with information cards." },
      { action: "widget:weather", label: "Choose the Weather card", result: "A weather card is an example of at-a-glance information." },
    ],
    check: { prompt: "Which shortcut opens Widgets on a Windows 11 PC where Widgets is available?", options: ["Win + W", "Win + E", "Win + L", "Alt + F4"], answer: 0, explanation: "Win + W opens Widgets." },
  },
  {
    title: "Make a study desktop", minutes: 4,
    idea: "Task View shows open windows and desktops. From there you can create another desktop for a separate workspace.",
    steps: [
      { action: "taskbar:taskview", label: "Open Task View", result: "Task View shows the current desktop and a New desktop control." },
      { action: "desktop:new", label: "Choose New desktop", result: "Desktop 2 has been created." },
      { action: "desktop:two", label: "Switch to Desktop 2", result: "You are on a separate workspace; Desktop 1 still exists." },
    ],
    check: { prompt: "Which path creates another desktop?", options: ["Task View → New desktop", "Widgets → Weather", "Maximize → Close", "File Explorer → Print"], answer: 0, explanation: "Use Task View (or Win + Tab), then New desktop." },
  },
  {
    title: "Personalize the background", minutes: 4,
    idea: "Right-click the desktop → Personalize opens Settings. Choose Personalization → Background to select a picture, solid color or slideshow.",
    steps: [
      { action: "desktop:rightclick", label: "Open the desktop context menu", result: "The context menu includes Personalize." },
      { action: "menu:personalize", label: "Choose Personalize", result: "Settings opens to Personalization." },
      { action: "settings:background", label: "Choose Background", result: "Background offers picture, solid color, slideshow and Spotlight options." },
      { action: "background:solid", label: "Choose Solid color", result: "A solid color is now shown in this practice desktop." },
    ],
    check: { prompt: "Which Settings path changes the desktop background?", options: ["Personalization → Background", "System → Storage only", "Apps → Installed apps", "Widgets → Weather"], answer: 0, explanation: "Background is under Personalization in Windows Settings." },
  },
  {
    title: "Try useful shortcuts", minutes: 4,
    idea: "Win + E opens File Explorer, Win + I opens Settings, Win + D shows or hides the desktop, and Win + L locks the PC.",
    steps: [
      { action: "shortcut:e", label: "Simulate Win + E", result: "File Explorer opened." },
      { action: "shortcut:i", label: "Simulate Win + I", result: "Settings opened." },
      { action: "shortcut:d", label: "Simulate Win + D", result: "Open windows are hidden to show the desktop." },
    ],
    check: { prompt: "Which shortcut locks a Windows PC?", options: ["Win + E", "Win + I", "Win + L", "Win + W"], answer: 2, explanation: "Win + L locks the computer." },
  },
];

export const windowsChallenge: WindowsQuestion[] = [
  { prompt: "A pupil wants to find an installed app. Which Windows 11 control is a good starting point?", options: ["Start or Search", "Only the clock", "Snap Assist", "A speaker"], answer: 0, explanation: "Start and Search can find apps, files and settings." },
  { prompt: "Which sequence places two apps side by side?", options: ["Widgets → Weather → Calendar", "Maximize button → two-column Snap Layout → choose second app", "Task View → New desktop → close both apps", "Settings → Lock screen → Widgets"], answer: 1, explanation: "The Snap flyout lets you choose a layout, then Snap Assist fills the remaining space." },
  { prompt: "Choose the correct pair: 1. Win + W opens Widgets. 2. Win + Tab opens Task View.", options: ["Only 1", "Only 2", "Both 1 and 2", "Neither"], answer: 2, explanation: "Both shortcuts are standard Windows 11 shortcuts." },
  { prompt: "What does a new virtual desktop give you?", options: ["A second physical monitor", "A separate workspace for windows and tasks", "More RAM chips", "Another user account automatically"], answer: 1, explanation: "A virtual desktop organizes open work without adding a physical monitor." },
  { prompt: "Where would you change a desktop background?", options: ["Settings → Personalization → Background", "File Explorer → This PC", "Widgets → Weather", "Snap Layouts → Grid"], answer: 0, explanation: "Background settings are under Personalization." },
  { prompt: "Which statement is correct?", options: ["Control Panel no longer exists in Windows 11", "Edge is Microsoft's browser; other browsers can be chosen", "Win + E locks the PC", "Windows 11 has a separate manual Tablet Mode switch"], answer: 1, explanation: "Edge is Microsoft's included browser, and users can choose another default. Control Panel still exists; Win + E opens File Explorer." },
];
