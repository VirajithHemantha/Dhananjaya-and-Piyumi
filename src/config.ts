export const GROOM_NAME = 'Dananjaya';
export const BRIDE_NAME = 'Piyumi';

// Google Apps Script Web App URL (writes RSVPs and wishes to the wedding Google Sheet)
export const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzSdtjL2wKztguVXIK8z4ZrZYzQztaTdbRRSoB6c8UUbqwZqKt2DmvFk7Bo2iBLuBJ8BA/exec';

export const postToSheet = async (sheet: 'RSVP' | 'Wishes', fields: Record<string, string>) => {
  await fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: new URLSearchParams({ sheet, ...fields }),
  });
};

export const PREFIXES = ['Mr.', 'Mrs.', 'Miss', 'Mr. & Mrs.', 'Family', 'Dear'] as const;

// "Dear" is a greeting style, not part of the name, so it is never added to the display name.
export const buildDisplayName = (prefix: string, guestName: string) => {
  const name = guestName.trim().replace(/\s+/g, ' ');
  if (!name) return '';
  if (prefix === 'Family') return `${name} and Family`;
  if (prefix === 'Dear' || !prefix) return name;
  return `${prefix} ${name}`;
};

// Personalized links look like {baseURL}/{encoded display name}; older ?prefix=&name= links still work.
export const getGuestDisplayName = () => {
  const params = new URLSearchParams(window.location.search);
  const legacyName = params.get('name');
  if (legacyName) return buildDisplayName(params.get('prefix') || '', legacyName);

  const segment = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!segment || segment.toLowerCase() === 'admin') return '';
  try {
    return decodeURIComponent(segment).trim();
  } catch {
    return '';
  }
};
