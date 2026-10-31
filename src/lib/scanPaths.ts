/** Where the pretend malware lands: the Malwarebytes scan walks these and the installer 'infects' them. */
export const MAC_PATHS = [
  '/Library/LaunchAgents',
  '/Library/LaunchDaemons',
  '~/Library/Application Support',
  '~/Library/Preferences',
  '/Applications/Brave Browser.app',
  '/usr/local/bin',
  '~/Downloads',
  '~/Desktop',
  '/System/Library/Extensions',
  '~/Library/Caches',
];
export const WIN_PATHS = [
  'C:\\Windows\\System32',
  'C:\\Windows\\System32\\drivers',
  'C:\\Program Files\\Brave Software',
  'C:\\Users\\Josh\\AppData\\Local\\Temp',
  'C:\\Users\\Josh\\AppData\\Roaming',
  'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
  'C:\\Users\\Josh\\Downloads',
  'C:\\Users\\Josh\\Desktop',
  'C:\\ProgramData',
  'C:\\Windows\\Prefetch',
];
