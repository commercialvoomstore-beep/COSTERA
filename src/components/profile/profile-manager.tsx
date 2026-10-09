'use client';

// COSTERA — Profil du chef : informations publiques, changement d'e-mail et
// de mot de passe, suppression de compte (double confirmation).
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, UploadCloud } from 'lucide-react';
import { mediaSrc } from '@/lib/media';
import type { ChefProfile, PlanLevel } from '@/lib/types';
import {
  changeEmailAction,
  changePasswordAction,
  deleteAccountAction,
  updateProfileAction,
  uploadProfileLogoAction,
} from '@/server/actions/profile';
import { PlanBadge } from '@/components/plan-ui';
import { useToast } from '@/components/toast';

export function ProfileManager({
  user,
  plan,
}: {
  user: { name: string; email: string; profile?: ChefProfile };
  plan: PlanLevel;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const p = user.profile ?? {};

  const [businessName, setBusinessName] = useState(p.businessName ?? '');
  const [displayNameMode, setDisplayNameMode] = useState<'personal' | 'business'>(p.displayNameMode ?? 'personal');
  const [bio, setBio] = useState(p.bio ?? '');
  const [specialties, setSpecialties] = useState((p.specialties ?? []).join(', '));
  const [city, setCity] = useState(p.city ?? '');
  const [phone, setPhone] = useState(p.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(p.whatsapp ?? '');
  const [website, setWebsite] = useState(p.website ?? '');
  const [facebook, setFacebook] = useState(p.facebook ?? '');
  const [instagram, setInstagram] = useState(p.instagram ?? '');
  const [address, setAddress] = useState(p.address ?? '');
  const [hours, setHours] = useState(p.hours ?? '');
  const [certifications, setCertifications] = useState((p.certifications ?? []).join(', '));
  const [logo, setLogo] = useState<string | undefined>(p.logoFileId);
  const [busy, setBusy] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);

  // Sécurité
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [emailPwd, setEmailPwd] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Suppression
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [delPwd, setDelPwd] = useState('');
  const [delConfirmText, setDelConfirmText] = useState('');

  const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

  async function saveProfile() {
    setBusy(true);
    const res = await updateProfileAction({
      businessName: businessName.trim() || undefined,
      displayNameMode,
      bio: bio.trim() || undefined,
      specialties: splitList(specialties),
      city: city.trim() || undefined,
      phone: phone.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      website: website.trim() || undefined,
      facebook: facebook.trim() || undefined,
      instagram: instagram.trim() || undefined,
      address: address.trim() || undefined,
      hours: hours.trim() || undefined,
      certifications: splitList(certifications),
    });
    setBusy(false);
    if (res.ok) toast('Profil enregistré.', 'success');
    else toast(res.error ?? 'Enregistrement impossible.', 'error');
  }

  async function uploadLogo(f: File) {
    const fd = new FormData();
    fd.set('logo', f);
    const res = await uploadProfileLogoAction(fd);
    if (res.ok && res.fileId) {
      setLogo(res.fileId);
      toast('Logo mis à jour.', 'success');
    } else toast(res.error ?? 'Téléversement impossible.', 'error');
  }

  async function doChangePassword() {
    setBusy(true);
    const res = await changePasswordAction(curPwd, newPwd);
    setBusy(false);
    if (res.ok) {
      toast('Mot de passe modifié.', 'success');
      setCurPwd('');
      setNewPwd('');
    } else toast(res.error ?? 'Modification impossible.', 'error');
  }

  async function doChangeEmail() {
    setBusy(true);
    const res = await changeEmailAction(newEmail, emailPwd);
    setBusy(false);
    if (res.ok) {
      toast('E-mail mis à jour.', 'success');
      setNewEmail('');
      setEmailPwd('');
      router.refresh();
    } else toast(res.error ?? 'Changement impossible.', 'error');
  }

  async function doDelete() {
    if (delConfirmText !== 'SUPPRIMER') {
      toast('Tapez SUPPRIMER pour confirmer.', 'error');
      return;
    }
    setBusy(true);
    const res = await deleteAccountAction(delPwd);
    setBusy(false);
    if (res.ok) {
      toast('Votre compte a été supprimé.', 'info');
      router.push('/login');
    } else toast(res.error ?? 'Suppression impossible.', 'error');
  }

  const inputCls = 'input';
  return (
    <div className="space-y-6">
      {/* Profil public */}
      <div className="card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-royal-900">Profil public</h2>
          <PlanBadge plan={plan} size="lg" />
        </div>

        <div className="flex items-center gap-4">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaSrc(logo)} alt="Logo" className="h-20 w-20 rounded-2xl object-cover ring-1 ring-linec" />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-2xl bg-royal-50 text-royal-300"><UploadCloud className="h-6 w-6" /></span>
          )}
          <div>
            <button type="button" onClick={() => logoInput.current?.click()} className="btn-ghost"><UploadCloud className="h-4 w-4" /> Photo / logo</button>
            <p className="mt-1 text-xs text-body/45">JPG, PNG ou WebP · 4 Mo max</p>
            <input ref={logoInput} type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="p-biz" className="label">Nom de l'entreprise / établissement</label>
            <input id="p-biz" className={inputCls} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="label">Affichage sur les cartes</label>
            <select className={inputCls} value={displayNameMode} onChange={(e) => setDisplayNameMode(e.target.value as 'personal' | 'business')}>
              <option value="personal">Nom personnel ({user.name})</option>
              <option value="business">Nom d'entreprise</option>
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="p-bio" className="label">Biographie</label>
            <textarea id="p-bio" rows={3} className={inputCls} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-spec" className="label">Spécialités (séparées par des virgules)</label>
            <input id="p-spec" className={inputCls} value={specialties} onChange={(e) => setSpecialties(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-city" className="label">Ville</label>
            <input id="p-city" className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-phone" className="label">Téléphone</label>
            <input id="p-phone" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-wa" className="label">WhatsApp</label>
            <input id="p-wa" className={inputCls} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-web" className="label">Site web</label>
            <input id="p-web" className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-fb" className="label">Facebook</label>
            <input id="p-fb" className={inputCls} value={facebook} onChange={(e) => setFacebook(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-ig" className="label">Instagram</label>
            <input id="p-ig" className={inputCls} value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-addr" className="label">Adresse de l'établissement</label>
            <input id="p-addr" className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-hours" className="label">Horaires</label>
            <input id="p-hours" className={inputCls} value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="p-cert" className="label">Certifications (séparées par des virgules)</label>
            <input id="p-cert" className={inputCls} value={certifications} onChange={(e) => setCertifications(e.target.value)} />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={saveProfile} disabled={busy} className="btn-primary"><Save className="h-4 w-4" /> {busy ? 'Enregistrement…' : 'Enregistrer le profil'}</button>
        </div>
      </div>

      {/* Sécurité */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-royal-900">Changer le mot de passe</h2>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <label htmlFor="s-cur" className="label">Ancien mot de passe *</label>
              <input id="s-cur" type="password" className={inputCls} value={curPwd} onChange={(e) => setCurPwd(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label htmlFor="s-new" className="label">Nouveau mot de passe *</label>
              <input id="s-new" type="password" className={inputCls} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
            </div>
            <button type="button" onClick={doChangePassword} disabled={busy || !curPwd || !newPwd} className="btn-primary w-full justify-center disabled:opacity-50">Modifier le mot de passe</button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-royal-900">Changer l'e-mail</h2>
          <p className="mt-1 text-xs text-body/50">E-mail actuel : <strong>{user.email}</strong></p>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <label htmlFor="e-new" className="label">Nouvel e-mail *</label>
              <input id="e-new" type="email" className={inputCls} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label htmlFor="e-pwd" className="label">Mot de passe (confirmation) *</label>
              <input id="e-pwd" type="password" className={inputCls} value={emailPwd} onChange={(e) => setEmailPwd(e.target.value)} />
            </div>
            <button type="button" onClick={doChangeEmail} disabled={busy || !newEmail || !emailPwd} className="btn-primary w-full justify-center disabled:opacity-50">Changer l'e-mail</button>
          </div>
        </div>
      </div>

      {/* Zone dangereuse */}
      <div className="card border-red-200 p-6">
        <h2 className="font-display text-lg font-bold text-red-700">Zone dangereuse</h2>
        <p className="mt-1 text-sm text-body/60">La suppression de votre compte est définitive : cartes, plats et notifications seront effacés.</p>
        {!confirmOpen ? (
          <button type="button" onClick={() => setConfirmOpen(true)} className="btn-ghost mt-4 text-red-600">Supprimer mon compte</button>
        ) : (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/50 p-4">
            <p className="text-sm font-semibold text-red-800">Confirmation requise</p>
            <p className="mt-1 text-xs text-red-700">Tapez <strong>SUPPRIMER</strong> et saisissez votre mot de passe pour confirmer.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input className={inputCls} placeholder="SUPPRIMER" value={delConfirmText} onChange={(e) => setDelConfirmText(e.target.value)} />
              <input type="password" className={inputCls} placeholder="Mot de passe" value={delPwd} onChange={(e) => setDelPwd(e.target.value)} />
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={doDelete} disabled={busy} className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50">{busy ? 'Suppression…' : 'Supprimer définitivement'}</button>
              <button type="button" onClick={() => { setConfirmOpen(false); setDelConfirmText(''); setDelPwd(''); }} className="btn-ghost">Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
