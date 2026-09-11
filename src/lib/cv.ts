/** The CV PDF and the one way every surface downloads it. */
export const CV_URL = '/JoshuaHawksworthCV.pdf';
export const CV_FILENAME = 'JoshuaHawksworthCV.pdf';

/** Save the CV to the visitor's device (same-origin file, so `download` is honoured). */
export function downloadCv() {
  const a = document.createElement('a');
  a.href = CV_URL;
  a.download = CV_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Open the CV in a new tab (the dock / taskbar CV item). */
export function openCv() {
  window.open(CV_URL, '_blank');
}
