'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ExternalLink,
  Phone,
  PhoneCall,
  Mail,
  UserPlus,
  StickyNote,
  Clock,
} from 'lucide-react';
import type {
  LeadStatus,
  LeadCallStatus,
  LeadDeliveryStatus,
  LeadOrderStatus,
} from '@prisma/client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SuperadminLeadRow, StaffOption } from '@/data/superadmin';
import {
  superadminUpdateLead,
  superadminLogLeadCall,
  superadminAddLeadNote,
  superadminConvertLead,
} from '@/actions/superadmin';

// ---- Label maps (French) ----------------------------------------------------

export const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: 'Nouveau',
  ORDERED: 'A commandé',
  CONTACTED: 'Contacté',
  CONVERTED: 'Converti',
  CLOSED: 'Fermé',
};

const CALL_LABEL: Record<LeadCallStatus, string> = {
  NOT_CALLED: 'Pas appelé',
  CALLED: 'Appelé',
  CALLED_TWICE: 'Appelé 2×',
  NO_ANSWER: 'Pas de réponse',
  CALLBACK: 'À rappeler',
  WRONG_NUMBER: 'Mauvais numéro',
};

const DELIVERY_LABEL: Record<LeadDeliveryStatus, string> = {
  NONE: 'Aucune',
  PENDING: 'À préparer',
  PREPARING: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
};

const ORDER_LABEL: Record<LeadOrderStatus, string> = {
  NONE: 'Aucune',
  PLACED: 'Passée',
  CONFIRMED: 'Confirmée',
  PAID: 'Payée',
  CANCELLED: 'Annulée',
};

const STATUS_ORDER: LeadStatus[] = [
  'NEW',
  'ORDERED',
  'CONTACTED',
  'CONVERTED',
  'CLOSED',
];
const CALL_ORDER: LeadCallStatus[] = [
  'NOT_CALLED',
  'CALLED',
  'CALLED_TWICE',
  'NO_ANSWER',
  'CALLBACK',
  'WRONG_NUMBER',
];
const DELIVERY_ORDER: LeadDeliveryStatus[] = [
  'NONE',
  'PENDING',
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
];
const ORDER_STATUS_ORDER: LeadOrderStatus[] = [
  'NONE',
  'PLACED',
  'CONFIRMED',
  'PAID',
  'CANCELLED',
];

const UNASSIGNED = '__none__';

function fmt(value: Date | string | null): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Full CRM follow-up panel for a single lead (#10/#12). Staff can:
 *  - log call attempts (auto-increments the counter),
 *  - set pipeline / call / delivery / order sub-statuses,
 *  - assign the lead to a staff member,
 *  - keep running follow-up notes and a timeline,
 *  - convert the lead into a real account + materialized menu.
 */
export function LeadCrmDialog({
  lead,
  staff,
  trigger,
}: {
  lead: SuperadminLeadRow;
  staff: StaffOption[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Follow-up field state (seeded from the row).
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [callStatus, setCallStatus] = useState<LeadCallStatus>(lead.callStatus);
  const [deliveryStatus, setDeliveryStatus] = useState<LeadDeliveryStatus>(
    lead.deliveryStatus
  );
  const [orderStatus, setOrderStatus] = useState<LeadOrderStatus>(
    lead.orderStatus
  );
  const [assignedToId, setAssignedToId] = useState<string>(
    lead.assignedToId ?? UNASSIGNED
  );
  const [followUpNotes, setFollowUpNotes] = useState(lead.followUpNotes ?? '');

  // Call logging + note inputs.
  const [callResult, setCallResult] = useState<LeadCallStatus>('CALLED');
  const [callNote, setCallNote] = useState('');
  const [note, setNote] = useState('');

  // Conversion form.
  const [convertName, setConvertName] = useState(
    lead.contactName ?? lead.restaurantName
  );
  const [convertEmail, setConvertEmail] = useState(lead.contactEmail ?? '');
  const [convertPassword, setConvertPassword] = useState('');
  const [showConvert, setShowConvert] = useState(false);

  const refresh = () => router.refresh();

  const saveFields = () => {
    startTransition(async () => {
      const res = await superadminUpdateLead({
        id: lead.id,
        status,
        callStatus,
        deliveryStatus,
        orderStatus,
        assignedToId: assignedToId === UNASSIGNED ? null : assignedToId,
        followUpNotes,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Mis à jour.');
      refresh();
    });
  };

  const logCall = () => {
    startTransition(async () => {
      const res = await superadminLogLeadCall({
        id: lead.id,
        callStatus: callResult as Exclude<LeadCallStatus, 'NOT_CALLED'>,
        note: callNote,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Appel enregistré.');
      setCallNote('');
      refresh();
    });
  };

  const addNote = () => {
    if (!note.trim()) return;
    startTransition(async () => {
      const res = await superadminAddLeadNote({ id: lead.id, body: note });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Note ajoutée.');
      setNote('');
      refresh();
    });
  };

  const convert = () => {
    startTransition(async () => {
      const res = await superadminConvertLead({
        id: lead.id,
        name: convertName,
        email: convertEmail,
        password: convertPassword,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Converti.');
      setShowConvert(false);
      setOpen(false);
      refresh();
    });
  };

  const alreadyConverted = Boolean(lead.convertedUserId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif-display text-xl font-medium">
            {lead.restaurantName}
          </DialogTitle>
        </DialogHeader>

        {/* Contact + quick actions */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <span className="font-medium">{lead.contactName ?? 'Sans nom'}</span>
          {lead.contactPhone && (
            <a
              href={`tel:${lead.contactPhone}`}
              className="inline-flex items-center gap-1 text-yellow-600 hover:underline dark:text-yellow-500"
            >
              <Phone className="h-3.5 w-3.5" /> {lead.contactPhone}
            </a>
          )}
          {lead.contactEmail && (
            <a
              href={`mailto:${lead.contactEmail}`}
              className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
            >
              <Mail className="h-3.5 w-3.5" /> {lead.contactEmail}
            </a>
          )}
          <a
            href={`/m/${lead.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Voir le menu
          </a>
        </div>

        {/* Follow-up fields */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Statut">
            <SelectBox value={status} onChange={(v) => setStatus(v as LeadStatus)}>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectBox>
          </Field>
          <Field label={`Appels (${lead.callAttempts})`}>
            <SelectBox
              value={callStatus}
              onChange={(v) => setCallStatus(v as LeadCallStatus)}
            >
              {CALL_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {CALL_LABEL[s]}
                </SelectItem>
              ))}
            </SelectBox>
          </Field>
          <Field label="Livraison">
            <SelectBox
              value={deliveryStatus}
              onChange={(v) => setDeliveryStatus(v as LeadDeliveryStatus)}
            >
              {DELIVERY_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {DELIVERY_LABEL[s]}
                </SelectItem>
              ))}
            </SelectBox>
          </Field>
          <Field label="Commande">
            <SelectBox
              value={orderStatus}
              onChange={(v) => setOrderStatus(v as LeadOrderStatus)}
            >
              {ORDER_STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {ORDER_LABEL[s]}
                </SelectItem>
              ))}
            </SelectBox>
          </Field>
          <Field label="Assigné à">
            <SelectBox value={assignedToId} onChange={setAssignedToId}>
              <SelectItem value={UNASSIGNED}>Non assigné</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name ?? s.email ?? s.id}
                </SelectItem>
              ))}
            </SelectBox>
          </Field>
        </div>

        <Field label="Notes de suivi">
          <Textarea
            value={followUpNotes}
            onChange={(e) => setFollowUpNotes(e.target.value)}
            placeholder="Contexte, préférences, prochaine action…"
            rows={2}
          />
        </Field>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={saveFields}
            disabled={isPending}
            className="bg-yellow-400 text-black hover:bg-yellow-400/90"
          >
            Enregistrer le suivi
          </Button>
        </div>

        {/* Log a call */}
        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <PhoneCall className="h-3.5 w-3.5" /> Journaliser un appel
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[150px] flex-1">
              <SelectBox
                value={callResult}
                onChange={(v) => setCallResult(v as LeadCallStatus)}
              >
                {CALL_ORDER.filter((s) => s !== 'NOT_CALLED').map((s) => (
                  <SelectItem key={s} value={s}>
                    {CALL_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectBox>
            </div>
            <Input
              value={callNote}
              onChange={(e) => setCallNote(e.target.value)}
              placeholder="Détail (optionnel)"
              className="min-w-[160px] flex-1"
            />
            <Button size="sm" variant="outline" onClick={logCall} disabled={isPending}>
              Enregistrer l&apos;appel
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Historique
          </p>
          {lead.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune activité.</p>
          ) : (
            <ul className="space-y-2">
              {[...lead.activities].reverse().map((a) => (
                <li key={a.id} className="flex gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />
                  <div>
                    <p className="text-foreground">{a.body}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {a.authorName ?? 'Système'} · {fmt(a.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex items-end gap-2">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ajouter une note…"
            />
            <Button size="sm" variant="outline" onClick={addNote} disabled={isPending}>
              <StickyNote className="mr-1 h-3.5 w-3.5" /> Noter
            </Button>
          </div>
        </div>

        {/* Conversion */}
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-500">
            <UserPlus className="h-3.5 w-3.5" /> Convertir en compte
          </p>
          {alreadyConverted ? (
            <p className="text-sm text-muted-foreground">
              Déjà converti le {fmt(lead.convertedAt)}.
            </p>
          ) : !showConvert ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConvert(true)}
              className="border-emerald-500/40"
            >
              Créer le compte et son menu
            </Button>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="sm:col-span-2 text-xs text-muted-foreground">
                Le restaurant, le menu, les catégories et les plats du lead
                seront créés et rattachés à ce nouveau compte. Le compte démarre
                en essai gratuit (30 jours) — sans forfait payant.
              </div>
              <Input
                value={convertName}
                onChange={(e) => setConvertName(e.target.value)}
                placeholder="Nom du propriétaire"
              />
              <Input
                type="email"
                value={convertEmail}
                onChange={(e) => setConvertEmail(e.target.value)}
                placeholder="Email"
              />
              <Input
                type="text"
                value={convertPassword}
                onChange={(e) => setConvertPassword(e.target.value)}
                placeholder="Mot de passe (min. 6)"
                className="sm:col-span-2"
              />
              <div className="flex gap-2 sm:col-span-2">
                <Button
                  size="sm"
                  onClick={convert}
                  disabled={isPending}
                  className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                >
                  Convertir
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowConvert(false)}
                  disabled={isPending}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SelectBox({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}
