import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { AppUpdatePlatform, AppUpdatePolicyRow, AppVersionRow } from '../../lib/admin';
import { adminErrorMessage, uploadAdminCampaignImage } from '../../lib/admin';
import {
  APP_UPDATE_MESSAGE_MAX,
  appUpdateImageUrl,
  countUsersBelowVersion,
  isAppUpdateVersion,
} from '../../lib/appUpdatePolicy';
import { useAppUpdatePolicies, useAppVersions, useUpsertAppUpdatePolicy } from '../../hooks/useAdmin';
import AdminSection from './AdminSection';
import { formatNumber, formatWhen } from './format';

type Target = 'ios' | 'android' | 'both';

type Draft = {
  target: Target;
  minVersion: string;
  androidMinVersion: string;
  splitVersions: boolean;
  isBlocking: boolean;
  message: string;
  imageUrl: string;
  enabled: boolean;
};

const EMPTY_DRAFT: Draft = {
  target: 'both',
  minVersion: '',
  androidMinVersion: '',
  splitVersions: false,
  isBlocking: false,
  message: '',
  imageUrl: '',
  enabled: false,
};

function draftFromRows(rows: AppUpdatePolicyRow[]): Draft {
  const ios = rows.find((row) => row.platform === 'ios');
  const android = rows.find((row) => row.platform === 'android');
  const flagsMatch = Boolean(
    ios && android
    && ios.is_blocking === android.is_blocking
    && (ios.message ?? '') === (android.message ?? '')
    && (ios.image_url ?? '') === (android.image_url ?? '')
    && ios.enabled === android.enabled,
  );

  if (ios && android && flagsMatch) {
    const sameVersion = (ios.min_version ?? '') === (android.min_version ?? '');
    return {
      target: 'both',
      minVersion: ios.min_version ?? '',
      androidMinVersion: android.min_version ?? '',
      splitVersions: !sameVersion,
      isBlocking: ios.is_blocking,
      message: ios.message ?? '',
      imageUrl: ios.image_url ?? '',
      enabled: ios.enabled,
    };
  }

  const primary = ios?.enabled && !android?.enabled
    ? ios
    : android?.enabled && !ios?.enabled
      ? android
      : ios ?? android;

  return {
    target: primary?.platform ?? 'both',
    minVersion: primary?.min_version ?? '',
    androidMinVersion: android?.min_version ?? '',
    splitVersions: false,
    isBlocking: primary?.is_blocking ?? false,
    message: primary?.message ?? '',
    imageUrl: primary?.image_url ?? '',
    enabled: primary?.enabled ?? false,
  };
}

function targetsFor(draft: Draft): AppUpdatePlatform[] {
  return draft.target === 'both' ? ['ios', 'android'] : [draft.target];
}

function typedVersion(draft: Draft, platform: AppUpdatePlatform): string {
  if (draft.target === 'both' && draft.splitVersions && platform === 'android') {
    return draft.androidMinVersion.trim();
  }
  return draft.minVersion.trim();
}

function imageError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 2000) return 'Image URL must be 2000 characters or fewer.';
  if (!appUpdateImageUrl(trimmed)) return 'Image URL must start with https://.';
  return null;
}

function versionError(version: string, required: boolean): string | null {
  if (!version) return required ? 'Enter a minimum version.' : null;
  if (!isAppUpdateVersion(version)) return 'Use major.minor.patch, like 4.6.0.';
  return null;
}

export default function AdminAppUpdate() {
  const policyQuery = useAppUpdatePolicies();
  const versionsQuery = useAppVersions();
  const upsert = useUpsertAppUpdatePolicy();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const rows = policyQuery.data ?? [];

  useEffect(() => {
    if (!policyQuery.data || hydrated) return;
    setDraft(draftFromRows(policyQuery.data));
    setHydrated(true);
  }, [policyQuery.data, hydrated]);

  const versions = versionsQuery.data ?? [];
  const targets = targetsFor(draft);
  const message = draft.message.trim();
  const messageTooLong = message.length > APP_UPDATE_MESSAGE_MAX;

  const fieldErrors = targets.flatMap((platform) => {
    const error = versionError(typedVersion(draft, platform), draft.enabled);
    return error ? [`${platform === 'ios' ? 'iOS' : 'Android'}: ${error}`] : [];
  });
  if (messageTooLong) {
    fieldErrors.push(`Message must be ${APP_UPDATE_MESSAGE_MAX} characters or fewer.`);
  }
  const imageProblem = imageError(draft.imageUrl);
  if (imageProblem) fieldErrors.push(imageProblem);

  const affected = useMemo(
    () => targets.map((platform) => {
      const version = typedVersion(draft, platform);
      const count = countUsersBelowVersion(
        versions.map((row) => ({ version: row.version, userCount: Number(row.user_count) || 0 })),
        version,
      );
      return { platform, version, count };
    }).filter((row, index, list) => (
      row.count != null
      && list.findIndex((other) => other.version === row.version) === index
    )),
    [draft, targets, versions],
  );

  const loadError = policyQuery.error
    ? adminErrorMessage(policyQuery.error, 'Could not load the update policy.')
    : null;

  const save = async (enabled: boolean) => {
    setFormError(null);
    const nextTargets = targetsFor(draft);
    const errors = nextTargets.flatMap((platform) => {
      const typed = typedVersion(draft, platform);
      const stored = rows.find((row) => row.platform === platform)?.min_version ?? '';
      const version = typed || (!enabled ? stored : '');
      const error = versionError(version, enabled);
      return error ? [`${platform === 'ios' ? 'iOS' : 'Android'}: ${error}`] : [];
    });
    if (message.length > APP_UPDATE_MESSAGE_MAX) {
      errors.push(`Message must be ${APP_UPDATE_MESSAGE_MAX} characters or fewer.`);
    }
    const imageProblem = imageError(draft.imageUrl);
    if (imageProblem) errors.push(imageProblem);
    if (errors.length > 0) {
      setFormError(errors.join(' '));
      return;
    }

    try {
      await Promise.all(nextTargets.map((platform) => {
        const typed = typedVersion(draft, platform);
        const stored = rows.find((row) => row.platform === platform)?.min_version ?? null;
        const minVersion = typed || (!enabled ? stored : null);
        return upsert.mutateAsync({
          platform,
          minVersion: minVersion || null,
          isBlocking: draft.isBlocking,
          message: message || null,
          imageUrl: draft.imageUrl.trim() || null,
          enabled,
        });
      }));
      setDraft((prev) => ({ ...prev, enabled }));
    } catch (err) {
      setFormError(adminErrorMessage(err, 'Could not save the update policy.'));
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void save(draft.enabled);
  };

  return (
    <AdminSection
      lead="Show an update prompt when the installed app is below a minimum version. Turn this on only after that build is live in the store."
      error={loadError}
    >
      {rows.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Minimum</th>
                <th>Prompt</th>
                <th>Image</th>
                <th>Enabled</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.platform}>
                  <td>{row.platform === 'ios' ? 'iOS' : 'Android'}</td>
                  <td>{row.min_version ? `v${row.min_version}` : '—'}</td>
                  <td>{row.is_blocking ? 'Blocking modal' : 'Banner'}</td>
                  <td>
                    {row.image_url ? (
                      <img src={row.image_url} alt="" className="admin-campaign-thumb" />
                    ) : '—'}
                  </td>
                  <td>{row.enabled ? 'On' : 'Off'}</td>
                  <td>{row.updated_at ? formatWhen(row.updated_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <form className="admin-form" onSubmit={onSubmit}>
        <label className="admin-field">
          <span className="admin-label">Platform</span>
          <select
            className="admin-input admin-input-select"
            value={draft.target}
            onChange={(event) => setDraft((prev) => ({
              ...prev,
              target: event.target.value as Target,
            }))}
          >
            <option value="ios">iOS</option>
            <option value="android">Android</option>
            <option value="both">iOS and Android</option>
          </select>
        </label>

        <label className="admin-field">
          <span className="admin-label">
            {draft.target === 'both' && draft.splitVersions ? 'iOS minimum' : 'Minimum version'}
          </span>
          <input
            className="admin-input"
            inputMode="decimal"
            placeholder="4.6.0"
            value={draft.minVersion}
            onChange={(event) => setDraft((prev) => ({ ...prev, minVersion: event.target.value }))}
          />
        </label>

        {draft.target === 'both' ? (
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={draft.splitVersions}
              onChange={(event) => setDraft((prev) => ({
                ...prev,
                splitVersions: event.target.checked,
                androidMinVersion: event.target.checked
                  ? (prev.androidMinVersion || prev.minVersion)
                  : prev.androidMinVersion,
              }))}
            />
            <span>Different Android minimum</span>
          </label>
        ) : null}

        {draft.target === 'both' && draft.splitVersions ? (
          <label className="admin-field">
            <span className="admin-label">Android minimum</span>
            <input
              className="admin-input"
              inputMode="decimal"
              placeholder="4.6.0"
              value={draft.androidMinVersion}
              onChange={(event) => setDraft((prev) => ({
                ...prev,
                androidMinVersion: event.target.value,
              }))}
            />
          </label>
        ) : null}

        <label className="admin-checkbox-label">
          <input
            type="checkbox"
            checked={draft.isBlocking}
            onChange={(event) => setDraft((prev) => ({ ...prev, isBlocking: event.target.checked }))}
          />
          <span>Blocking — modal on startup that cannot be dismissed</span>
        </label>

        <label className="admin-field">
          <span className="admin-label">Message</span>
          <textarea
            className="admin-input"
            rows={3}
            maxLength={APP_UPDATE_MESSAGE_MAX}
            placeholder="A new version of Slumber is out. Update to keep using the app."
            value={draft.message}
            onChange={(event) => setDraft((prev) => ({ ...prev, message: event.target.value }))}
          />
          <p className="admin-field-hint">
            Optional. Leave blank for the default copy. {message.length}/{APP_UPDATE_MESSAGE_MAX}
          </p>
        </label>

        <label className="admin-field">
          <span className="admin-label">Image</span>
          <input
            className="admin-input"
            value={draft.imageUrl}
            onChange={(event) => setDraft((prev) => ({ ...prev, imageUrl: event.target.value }))}
            placeholder="https://… or upload below"
          />
          <p className="admin-field-hint">Optional. Shown on the banner and the blocking popup.</p>
        </label>
        <div className="admin-form-actions">
          <label className="admin-button admin-button-ghost">
            {uploadingImage ? 'Uploading…' : 'Upload image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              disabled={uploadingImage}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                setUploadingImage(true);
                setFormError(null);
                void uploadAdminCampaignImage(file)
                  .then((url) => setDraft((prev) => ({ ...prev, imageUrl: url })))
                  .catch((err: unknown) => {
                    const uploadMessage = adminErrorMessage(err, 'Could not upload image.');
                    setFormError(
                      uploadMessage.includes('image_too_large')
                        ? 'Image must be 5 MB or smaller.'
                        : uploadMessage,
                    );
                  })
                  .finally(() => setUploadingImage(false));
              }}
            />
          </label>
          {draft.imageUrl ? (
            <button
              type="button"
              className="admin-button admin-button-ghost"
              onClick={() => setDraft((prev) => ({ ...prev, imageUrl: '' }))}
            >
              Remove image
            </button>
          ) : null}
        </div>
        {draft.imageUrl ? (
          <img
            src={draft.imageUrl}
            alt=""
            style={{ maxWidth: 280, maxHeight: 160, objectFit: 'cover', borderRadius: 8 }}
          />
        ) : null}

        <label className="admin-checkbox-label">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(event) => setDraft((prev) => ({ ...prev, enabled: event.target.checked }))}
          />
          <span>Enabled</span>
        </label>

        {affected.length > 0 ? (
          <div>
            {affected.map((row) => (
              <p key={`${row.platform}:${row.version}`} className="admin-field-hint">
                {formatNumber(row.count ?? 0)} signed-in users reported a version below v{row.version}
                {affected.length > 1
                  ? ` (${row.platform === 'ios' ? 'iOS' : 'Android'} cutoff)`
                  : ''}
                .
                {' '}This count is not split by store, and it misses people who have not opened the app since version reporting shipped.
              </p>
            ))}
          </div>
        ) : null}

        {fieldErrors.length > 0 ? (
          <p className="admin-error">{fieldErrors.join(' ')}</p>
        ) : null}
        {formError ? <p className="admin-error">{formError}</p> : null}

        <div className="admin-form-actions">
          <button
            className="admin-button"
            type="submit"
            disabled={upsert.isPending || uploadingImage || (policyQuery.isLoading && !hydrated)}
          >
            {upsert.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="admin-button admin-button-ghost"
            disabled={upsert.isPending || uploadingImage || (policyQuery.isLoading && !hydrated)}
            onClick={() => { void save(false); }}
          >
            Turn off
          </button>
        </div>
      </form>

      <ReportedVersions versions={versions} loading={versionsQuery.isLoading} />
    </AdminSection>
  );
}

function ReportedVersions({
  versions,
  loading,
}: {
  versions: AppVersionRow[];
  loading: boolean;
}) {
  if (loading && versions.length === 0) {
    return <p className="admin-muted">Loading reported versions…</p>;
  }
  if (versions.length === 0) {
    return <p className="admin-muted">No reported app versions yet.</p>;
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Reported version</th>
            <th>Users</th>
            <th>Last seen</th>
          </tr>
        </thead>
        <tbody>
          {versions.map((row) => (
            <tr key={row.version}>
              <td>v{row.version}</td>
              <td>{formatNumber(Number(row.user_count) || 0)}</td>
              <td>{row.last_seen ? formatWhen(row.last_seen) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
