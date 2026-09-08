import { useDesktop } from '../../context/DesktopContext';
import { ROOT_IDS } from '../../data/fileSystemSeed';
import { NodeIcon, nodeKind } from '../icons/NodeIcon';
import { PlatformBinIcon } from '../icons/PlatformFileIcons';
import { useOs } from '../../context/SettingsContext';
import { appTitleFor } from '../../theme/platform';
import { openTargetFor } from '../../lib/openNode';
import styles from './TrashApp.module.css';

function whereLabel(fs: ReturnType<typeof useDesktop>['fs'], from?: string): string {
  const node = from ? fs[from] : undefined;
  return node ? node.name : 'Desktop';
}

export default function TrashApp() {
  const { fs, childrenOf, emptyTrash, restoreNodes, openApp } = useDesktop();
  const os = useOs();
  const binName = appTitleFor('trash', 'Trash', os);
  const items = childrenOf(ROOT_IDS.trash).sort(
    (a, b) => (b.trashedAt ?? b.createdAt) - (a.trashedAt ?? a.createdAt)
  );

  function open(id: string) {
    const target = openTargetFor(fs[id]);
    if (target.kind === 'url') window.open(target.url, '_blank');
    else if (target.kind === 'app') openApp(target.appId, target.props);
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.count}>
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
        <div className={styles.headerActions}>
          <button
            className={styles.emptyBtn}
            onClick={() => restoreNodes(items.map((i) => i.id))}
            disabled={items.length === 0}
          >
            Put Back All
          </button>
          <button className={styles.emptyBtn} onClick={emptyTrash} disabled={items.length === 0}>
            Empty {binName}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <PlatformBinIcon os={os} size={64} style={{ opacity: 0.45 }} />
          <p className={styles.emptyLabel}>{binName} is empty</p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {items.map((item) => (
              <div key={item.id} className={styles.item} onDoubleClick={() => open(item.id)}>
                <span className={styles.fileIcon}>
                  <NodeIcon node={item} size={28} />
                </span>
                <div className={styles.info}>
                  <span className={styles.name}>{item.name}</span>
                  <span className={styles.meta}>
                    {nodeKind(item)} ·{' '}
                    {item.isJoke
                      ? `deleted ${new Date(item.trashedAt ?? item.createdAt).getFullYear()}`
                      : `from ${whereLabel(fs, item.trashedFrom)}, ${new Date(item.trashedAt ?? item.createdAt).toLocaleDateString('en-GB')}`}
                  </span>
                </div>
                <button
                  className={styles.restoreBtn}
                  onClick={() => restoreNodes([item.id])}
                  title={`Put back in ${whereLabel(fs, item.trashedFrom)}`}
                >
                  ↩ Put Back
                </button>
              </div>
            ))}
          </div>
          <p className={styles.note}>
            Put Back returns an item to the folder it came from. Empty {binName} deletes everything
            permanently.
          </p>
        </>
      )}
    </div>
  );
}
