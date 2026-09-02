import Modal from '../components/Modal.jsx';
import { apiDownload, apiRequest, apiUpload } from '../lib/api.js';
import { initials } from '../lib/format.js';

export default function SettingsModal({
  session,
  albums,
  onClose,
  onRefresh,
  reloadAlbums,
  notify,
  handleUnlock,
  logout,
}) {
  const saveAccount = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await apiRequest('/api/account', {
        method: 'PATCH',
        body: {
          name: form.name.value,
          currentPassword: form.currentPassword.value,
          newPassword: form.newPassword.value,
        },
      });
      form.currentPassword.value = '';
      form.newPassword.value = '';
      await onRefresh();
      notify('Account updated.');
    } catch (err) {
      notify(err.message);
    }
  };

  const saveAvatar = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.avatar.files?.[0]) return;
    try {
      const data = new FormData();
      data.append('avatar', form.avatar.files[0]);
      await apiUpload('/api/account/avatar', data);
      form.reset();
      await onRefresh();
      notify('Profile photo updated.');
    } catch (err) {
      notify(err.message);
    }
  };

  const saveCouple = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await apiRequest('/api/couple', {
        method: 'PATCH',
        body: { name: form.name.value, relationshipStart: form.relationshipStart.value },
      });
      await onRefresh();
      notify('Relationship settings saved.');
    } catch (err) {
      notify(err.message);
    }
  };

  const setPin = async (event) => {
    event.preventDefault();
    const pin = event.currentTarget.pin.value;
    try {
      await apiRequest('/api/couple/pin', { method: 'POST', body: { pin } });
      event.currentTarget.reset();
      await onRefresh();
      notify('Couple PIN saved.');
    } catch (err) {
      notify(err.message);
    }
  };

  const unlock = async (event) => {
    event.preventDefault();
    await handleUnlock(event.currentTarget.pin.value);
    event.currentTarget.reset();
  };

  const newAlbum = async () => {
    const name = window.prompt('Album name');
    if (!name) return;
    const description = window.prompt('Short description (optional)') || '';
    try {
      await apiRequest('/api/albums', { method: 'POST', body: { name, description } });
      await reloadAlbums();
      notify('Album created.');
    } catch (err) {
      notify(err.message);
    }
  };

  const editAlbum = async (album) => {
    const name = window.prompt('Album name', album.name);
    if (!name) return;
    const description = window.prompt('Description', album.description || '') ?? album.description;
    try {
      await apiRequest(`/api/albums/${album.id}`, { method: 'PATCH', body: { name, description } });
      await reloadAlbums();
      notify('Album updated.');
    } catch (err) {
      notify(err.message);
    }
  };

  const deleteAlbum = async (album) => {
    if (!window.confirm(`Delete “${album.name}”? Memories will stay in the gallery.`)) return;
    try {
      await apiRequest(`/api/albums/${album.id}`, { method: 'DELETE' });
      await reloadAlbums();
      notify('Album deleted.');
    } catch (err) {
      notify(err.message);
    }
  };

  const backup = async () => {
    try {
      notify('Preparing your archive…');
      await apiDownload('/api/export', `zawsze-backup-${new Date().toISOString().slice(0, 10)}.zip`);
      notify('Backup downloaded.');
    } catch (err) {
      notify(err.message);
    }
  };

  const lockNow = async () => {
    try {
      await apiRequest('/api/couple/lock', { method: 'POST' });
      await onRefresh();
      notify('Private memories locked.');
    } catch (err) {
      notify(err.message);
    }
  };

  const removePin = async () => {
    if (!window.confirm('Remove the couple PIN?')) return;
    try {
      await apiRequest('/api/couple/pin', { method: 'POST', body: { pin: '' } });
      await onRefresh();
      notify('PIN removed.');
    } catch (err) {
      notify(err.message);
    }
  };

  return (
    <Modal title="Settings & privacy" kicker="Zawsze" onClose={onClose} wide>
      <div className="settings-grid">
        <section>
          <h4>Your account</h4>
          <div className="profile-summary">
            {session.user.avatarUrl ? <img src={session.user.avatarUrl} alt={session.user.name} /> : <span>{initials(session.user.name)}</span>}
            <div><strong>{session.user.name}</strong><small>{session.user.email}</small></div>
          </div>
          <form className="mini-form avatar-form" onSubmit={saveAvatar}>
            <label><span>Profile photo</span><input name="avatar" type="file" accept="image/*" /></label>
            <button className="btn soft">Upload photo</button>
          </form>
          <form className="mini-form" onSubmit={saveAccount}>
            <label><span>Name</span><input name="name" defaultValue={session.user.name} maxLength="60" /></label>
            <label><span>Current password</span><input name="currentPassword" type="password" /></label>
            <label><span>New password</span><input name="newPassword" type="password" minLength="6" /></label>
            <button className="btn soft">Save account</button>
          </form>
        </section>

        <section>
          <h4>Ayen & Jonalyn</h4>
          <div className="member-list">
            {session.couple.members.map((member) => (
              <div className="member-row" key={member.id}>
                {member.avatarUrl ? <img src={member.avatarUrl} alt={member.name} /> : <span>{initials(member.name)}</span>}
                <div><strong>{member.name}</strong><small>{member.id === session.user.id ? 'You' : 'Your person'}</small></div>
              </div>
            ))}
          </div>
          <form className="mini-form" onSubmit={saveCouple}>
            <label><span>Space name</span><input name="name" defaultValue={session.couple.name} /></label>
            <label><span>Relationship start</span><input name="relationshipStart" type="date" defaultValue={session.couple.relationshipStart || ''} /></label>
            <button className="btn soft">Save relationship</button>
          </form>
        </section>

        <section>
          <h4>Private memories</h4>
          <p className="settings-copy">A 4–8 digit PIN protects any memory, note, or timeline item marked private.</p>
          <form className="inline-form" onSubmit={setPin}>
            <input name="pin" inputMode="numeric" pattern="[0-9]{4,8}" placeholder="Set new PIN" />
            <button className="btn soft">Set PIN</button>
          </form>
          {session.couple.hasPin && !session.couple.unlocked && (
            <form className="inline-form" onSubmit={unlock}>
              <input name="pin" inputMode="numeric" placeholder="Enter PIN" />
              <button className="btn soft">Unlock</button>
            </form>
          )}
          {session.couple.hasPin && session.couple.unlocked && <button className="text-action" onClick={lockNow}>Lock now</button>}
          {session.couple.hasPin && <button className="text-action danger" onClick={removePin}>Remove PIN</button>}
          <p className="lock-status">
            {!session.couple.hasPin ? 'No PIN is set.' : session.couple.unlocked ? 'Private memories are unlocked for 15 minutes.' : 'Private memories are locked.'}
          </p>
        </section>

        <section>
          <div className="settings-row"><h4>Albums</h4><button type="button" className="text-action" onClick={newAlbum}>+ New album</button></div>
          <div className="album-list">
            {albums.map((album) => (
              <div className="album-row" key={album.id}>
                <div><strong>{album.name}</strong><small>{album.memoryCount} memories</small></div>
                <div><button type="button" onClick={() => editAlbum(album)}>Edit</button><button type="button" onClick={() => deleteAlbum(album)}>Delete</button></div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h4>Backup</h4>
          <p className="settings-copy">Download photos, timeline images, notes, comments, dates, albums, and relationship data together.</p>
          <button className="btn soft" type="button" onClick={backup}>Download Zawsze archive</button>
        </section>

        <section>
          <h4>Session</h4>
          <p className="settings-copy">This website has no public registration. Only the two configured accounts can enter.</p>
          <button className="btn soft danger-outline" type="button" onClick={logout}>Sign out</button>
        </section>
      </div>
    </Modal>
  );
}
