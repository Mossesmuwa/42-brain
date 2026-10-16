/* Small product-quality features that preserve the existing offline-first app. */
'use strict';
(function () {
  const $ = id => document.getElementById(id);
  function notice(message) {
    let node = $('productNotice');
    if (!node) {
      node = document.createElement('div');
      node.id = 'productNotice';
      node.className = 'product-notice';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      node.innerHTML = '<span data-notice-copy></span><button type="button" aria-label="Dismiss notification">Dismiss</button>';
      node.querySelector('button').addEventListener('click', () => { node.hidden = true; });
      document.body.appendChild(node);
    }
    node.querySelector('[data-notice-copy]').textContent = message;
    node.hidden = false;
  }
  function addBackupTools() {
    const page = document.querySelector('[data-workspace-page="settings"]');
    if (!page || $('productBackup')) return;
    const panel = document.createElement('section');
    panel.id = 'productBackup';
    panel.className = 'product-backup';
    panel.innerHTML = '<h3>Protect your progress</h3><p>Your scores and settings are stored on this device. Export a backup before clearing browser data or changing devices. Importing a backup replaces the matching local progress.</p><div class="product-backup-actions"><button class="cta-btn" type="button" id="backupExport">Export backup</button><button class="sec-btn" type="button" id="backupImport">Import backup</button><input id="backupFile" type="file" accept="application/json,.json"></div>';
    page.appendChild(panel);
    $('backupExport').addEventListener('click', () => {
      if (!window.Store) return notice('Backup tools are unavailable right now.');
      Store.exportData();
      notice('Backup export started. Keep the JSON file somewhere safe.');
    });
    $('backupImport').addEventListener('click', () => $('backupFile').click());
    $('backupFile').addEventListener('change', async event => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error('This backup is larger than 5 MB.');
        const payload = JSON.parse(await file.text());
        if (!window.Store || !Store.validateImport(payload)) throw new Error('This file is not a valid 42 Brain backup.');
        if (!window.confirm('Import this backup? Existing matching progress on this device will be replaced. A safety backup is created first.')) return;
        Store.importData(payload);
        notice('Backup restored. Reloading your saved settings and progress.');
        window.setTimeout(() => window.location.reload(), 500);
      } catch (error) {
        notice(error instanceof Error ? error.message : 'Could not import this backup.');
      } finally {
        event.target.value = '';
      }
    });
  }
  document.addEventListener('DOMContentLoaded', () => {
    addBackupTools();
    // Inject into the settings page when the workspace is first opened.
    document.querySelectorAll('[data-page="settings"]').forEach(button => button.addEventListener('click', addBackupTools));
  });
})();
