/**
 * Outlook with the CMap Mail add-in side-loaded, the way it looked on an architect's
 * desk: folders, a message list, the reading pane, and the add-in's task pane that files
 * the open email into a project's SharePoint site. The filing is a mock — it shows the
 * flow, not a live SharePoint.
 */
import { useMemo, useState } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import styles from './OutlookApp.module.css';

interface Mail {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  body: string[];
  at: string;
  unread?: boolean;
  attachments?: string[];
  project?: string;
}

const PROJECTS = [
  { code: '2210', name: 'Oak Lane Primary School' },
  { code: '2305', name: 'Riverside Footbridge' },
  { code: '2318', name: 'Salford Quays Residential' },
  { code: '2402', name: 'Northern Quarter Rooftop' },
];

const DOC_TYPES = ['Correspondence', 'Drawings', 'RFIs', 'Site Instructions', 'Meeting Minutes'];

const INBOX: Mail[] = [
  {
    id: 'm1',
    from: 'Priya Shah',
    fromEmail: 'priya.shah@oaklane-council.gov.uk',
    subject: 'RE: 2210 – revised roof drawings for planning',
    preview:
      'Thanks Josh, the revised set looks good. Could you file the stamped copies before the audit…',
    body: [
      'Hi Josh,',
      'Thanks for turning the roof drawings around so quickly. The planning officer is happy with the revised eaves detail.',
      'Could you make sure the stamped copies are filed against the project before the audit next week? They asked specifically for the correspondence trail.',
      'Best,\nPriya',
    ],
    at: '09:42',
    unread: true,
    attachments: ['2210-A-201-RoofPlan-RevC.pdf', '2210-A-305-EavesDetail-RevB.pdf'],
  },
  {
    id: 'm2',
    from: 'Tom Ashworth',
    fromEmail: 'tom@ashworth-structures.co.uk',
    subject: 'RFI-014 – Riverside Footbridge bearing loads',
    preview: 'Raising RFI-014 on the bearing loads at pier 2. Drawing S-402 shows…',
    body: [
      'Josh,',
      'Raising RFI-014 on the bearing loads at pier 2. Drawing S-402 shows 480 kN but the schedule says 520 kN. Which governs?',
      'Need this closed out before the fabricator books the shop.',
      'Tom',
    ],
    at: '08:15',
    unread: true,
    attachments: ['RFI-014.pdf'],
  },
  {
    id: 'm3',
    from: 'CMap Mail',
    fromEmail: 'noreply@cmap.io',
    subject: 'Weekly filing summary – 38 emails filed to 4 projects',
    preview: 'Your team filed 38 emails this week. 2210 Oak Lane: 17, 2305 Riverside: 11…',
    body: [
      'Your team filed 38 emails to SharePoint this week.',
      '2210 Oak Lane Primary School — 17\n2305 Riverside Footbridge — 11\n2318 Salford Quays Residential — 7\n2402 Northern Quarter Rooftop — 3',
      'Everything is searchable in Discovery.',
    ],
    at: 'Yesterday',
    project: '—',
  },
  {
    id: 'm4',
    from: 'Hannah Lee',
    fromEmail: 'hannah.lee@salfordquays.dev',
    subject: 'Salford Quays – site instruction SI-07',
    preview: 'Please find attached SI-07 covering the balcony balustrade change…',
    body: [
      'Hi both,',
      'Please find attached SI-07 covering the balcony balustrade change on levels 4–9. Cost impact to follow from the QS.',
      'Hannah',
    ],
    at: 'Yesterday',
    attachments: ['SI-07-Balustrade.pdf'],
  },
  {
    id: 'm5',
    from: 'Recruiter Bot',
    fromEmail: 'hello@hawksworth.dev',
    subject: 'Welcome to Josh’s inbox',
    preview:
      'This is a working replica of Outlook with the CMap Mail add-in Josh built at CMap Software…',
    body: [
      'Welcome!',
      'This is a replica of Outlook with the CMap Mail add-in Josh built at CMap Software side-loaded. Open an email from an architect, press “File to project” in the ribbon, pick a project and a document type, and watch it land in SharePoint (well, a pretend one).',
      'The real add-in also read project metadata from SharePoint, suggested the project from the email thread, and kept everything searchable through the Discovery app. That part needs the real Microsoft 365 tenant.',
    ],
    at: 'Mon',
  },
];

type Folder = 'inbox' | 'sent' | 'drafts' | 'archive' | 'filed';

export default function OutlookApp() {
  const { openApp } = useDesktop();
  const [folder, setFolder] = useState<Folder>('inbox');
  const [selectedId, setSelectedId] = useState<string>(INBOX[0].id);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [filed, setFiled] = useState<Record<string, { project: string; docType: string }>>({});
  const [paneOpen, setPaneOpen] = useState(true);
  const [project, setProject] = useState(PROJECTS[0].code);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [search, setSearch] = useState('');
  const [filing, setFiling] = useState<'idle' | 'busy' | 'done'>('idle');

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base =
      folder === 'inbox' ? INBOX : folder === 'filed' ? INBOX.filter((m) => filed[m.id]) : [];
    return q
      ? base.filter((m) => `${m.from} ${m.subject} ${m.preview}`.toLowerCase().includes(q))
      : base;
  }, [folder, filed, search]);

  const mail = INBOX.find((m) => m.id === selectedId) ?? null;
  const mailFiled = mail ? filed[mail.id] : undefined;

  function select(m: Mail) {
    setSelectedId(m.id);
    setRead((prev) => new Set(prev).add(m.id));
    setFiling('idle');
    // The add-in guesses the project from the subject line, like the real one did.
    const guess = PROJECTS.find(
      (p) =>
        m.subject.includes(p.code) ||
        m.subject.toLowerCase().includes(p.name.split(' ')[0].toLowerCase())
    );
    if (guess) setProject(guess.code);
    if (/rfi/i.test(m.subject)) setDocType('RFIs');
    else if (/drawing/i.test(m.subject)) setDocType('Drawings');
    else if (/site instruction|SI-/i.test(m.subject)) setDocType('Site Instructions');
    else setDocType('Correspondence');
  }

  function fileEmail() {
    if (!mail || filing === 'busy') return;
    setFiling('busy');
    window.setTimeout(() => {
      setFiled((prev) => ({ ...prev, [mail.id]: { project, docType } }));
      setFiling('done');
    }, 1300);
  }

  const projectName = (code: string) => PROJECTS.find((p) => p.code === code)?.name ?? code;
  const unread = INBOX.filter((m) => m.unread && !read.has(m.id)).length;

  return (
    <div className={styles.root}>
      {/* Ribbon */}
      <div className={styles.ribbon}>
        <button type="button" className={styles.newMail} onClick={() => openApp('contact')}>
          <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M8 3v10M3 8h10" />
          </svg>
          New mail
        </button>
        <span className={styles.ribbonSep} />
        {['Delete', 'Archive', 'Report', 'Sweep', 'Move to'].map((x) => (
          <button key={x} type="button" className={styles.ribbonBtn} disabled>
            {x}
          </button>
        ))}
        <span className={styles.ribbonSep} />
        <button
          type="button"
          className={`${styles.ribbonBtn} ${styles.addinBtn} ${paneOpen ? styles.addinBtnOn : ''}`}
          onClick={() => setPaneOpen((o) => !o)}
          aria-pressed={paneOpen}
        >
          <span className={styles.addinGlyph} aria-hidden="true" />
          File to project
        </button>
        <span className={styles.ribbonFill} />
        <input
          className={styles.search}
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.body}>
        {/* Rail + folders */}
        <div className={styles.rail}>
          <button
            type="button"
            className={`${styles.railBtn} ${styles.railActive}`}
            aria-label="Mail"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 8l9 6 9-6" />
            </svg>
          </button>
          <button type="button" className={styles.railBtn} aria-label="Calendar" disabled>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
          </button>
          <button type="button" className={styles.railBtn} aria-label="People" disabled>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
            </svg>
          </button>
        </div>
        <div className={styles.folders}>
          <div className={styles.account}>josh@cmap.io</div>
          {(
            [
              ['inbox', 'Inbox', unread],
              ['drafts', 'Drafts', 0],
              ['sent', 'Sent Items', 0],
              ['archive', 'Archive', 0],
            ] as [Folder, string, number][]
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              className={`${styles.folder} ${folder === id ? styles.folderActive : ''}`}
              onClick={() => setFolder(id)}
            >
              <span>{label}</span>
              {count > 0 && <span className={styles.count}>{count}</span>}
            </button>
          ))}
          <div className={styles.folderGroup}>CMap Mail</div>
          <button
            type="button"
            className={`${styles.folder} ${folder === 'filed' ? styles.folderActive : ''}`}
            onClick={() => setFolder('filed')}
          >
            <span>Filed to SharePoint</span>
            {Object.keys(filed).length > 0 && (
              <span className={styles.count}>{Object.keys(filed).length}</span>
            )}
          </button>
        </div>

        {/* Message list */}
        <div className={styles.list}>
          <div className={styles.listHead}>
            <span>
              {folder === 'filed'
                ? 'Filed to SharePoint'
                : folder === 'inbox'
                  ? 'Focused'
                  : 'Empty'}
            </span>
          </div>
          {list.length === 0 ? (
            <div className={styles.listEmpty}>
              {folder === 'filed'
                ? 'Nothing filed yet. Open an email and press “File to project”.'
                : 'Nothing here.'}
            </div>
          ) : (
            list.map((m) => {
              const isUnread = m.unread && !read.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`${styles.row} ${m.id === selectedId ? styles.rowActive : ''} ${isUnread ? styles.rowUnread : ''}`}
                  onClick={() => select(m)}
                >
                  <span className={styles.rowAvatar}>
                    {m.from
                      .split(' ')
                      .map((s) => s[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <span className={styles.rowText}>
                    <span className={styles.rowTop}>
                      <span className={styles.rowFrom}>{m.from}</span>
                      <span className={styles.rowTime}>{m.at}</span>
                    </span>
                    <span className={styles.rowSubject}>{m.subject}</span>
                    <span className={styles.rowPreview}>{m.preview}</span>
                    {filed[m.id] && (
                      <span className={styles.filedTag}>
                        Filed · {filed[m.id].project} {projectName(filed[m.id].project)} ›{' '}
                        {filed[m.id].docType}
                      </span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Reading pane */}
        <div className={styles.reading}>
          {mail ? (
            <>
              <h2 className={styles.subject}>{mail.subject}</h2>
              <div className={styles.fromRow}>
                <span className={styles.rowAvatar}>
                  {mail.from
                    .split(' ')
                    .map((s) => s[0])
                    .join('')
                    .slice(0, 2)}
                </span>
                <div>
                  <div className={styles.fromName}>{mail.from}</div>
                  <div className={styles.fromEmail}>
                    {mail.fromEmail} · To: Josh Hawksworth · {mail.at}
                  </div>
                </div>
              </div>
              {mail.attachments && (
                <div className={styles.attachments}>
                  {mail.attachments.map((a) => (
                    <span key={a} className={styles.attachment}>
                      <span className={styles.attachmentIcon}>PDF</span>
                      {a}
                    </span>
                  ))}
                </div>
              )}
              {mailFiled && (
                <div className={styles.filedBanner}>
                  Filed to SharePoint · {mailFiled.project} {projectName(mailFiled.project)} ›{' '}
                  {mailFiled.docType}
                </div>
              )}
              <div className={styles.mailBody}>
                {mail.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.listEmpty}>Select an item to read</div>
          )}
        </div>

        {/* CMap Mail add-in task pane */}
        {paneOpen && (
          <aside className={styles.pane} aria-label="CMap Mail add-in">
            <div className={styles.paneHead}>
              <span className={styles.addinGlyph} aria-hidden="true" />
              <span className={styles.paneTitle}>CMap Mail</span>
              <button
                type="button"
                className={styles.paneClose}
                onClick={() => setPaneOpen(false)}
                aria-label="Close add-in"
              >
                ×
              </button>
            </div>
            {mail ? (
              <div className={styles.paneBody}>
                <div className={styles.paneSection}>File this email to a project</div>
                <label className={styles.paneLabel}>
                  Project
                  <select
                    className={styles.paneSelect}
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                  >
                    {PROJECTS.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.code} – {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.paneLabel}>
                  Document type
                  <select
                    className={styles.paneSelect}
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                  >
                    {DOC_TYPES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <div className={styles.paneMeta}>
                  <span>Destination</span>
                  <code>
                    /sites/{project}/Shared Documents/{docType}/
                  </code>
                </div>
                {mail.attachments && (
                  <label className={styles.paneCheck}>
                    <input type="checkbox" defaultChecked /> Include {mail.attachments.length}{' '}
                    attachment
                    {mail.attachments.length > 1 ? 's' : ''}
                  </label>
                )}
                <button
                  type="button"
                  className={styles.fileBtn}
                  onClick={fileEmail}
                  disabled={filing === 'busy'}
                >
                  {filing === 'busy' ? 'Filing…' : mailFiled ? 'File again' : 'File email'}
                </button>
                {filing === 'busy' && <div className={styles.progress} />}
                {filing === 'done' && (
                  <div className={styles.paneSuccess}>
                    Filed to <strong>{projectName(project)}</strong> › {docType}. It now shows in
                    Discovery with the project's other correspondence.
                  </div>
                )}
                <div className={styles.paneFoot}>
                  This is the flow Josh built at CMap Software as an Outlook add-in on the Microsoft
                  Graph API. The SharePoint side is pretend here — the real one is in the Experience
                  app.
                </div>
              </div>
            ) : (
              <div className={styles.paneBody}>Open an email to file it.</div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
