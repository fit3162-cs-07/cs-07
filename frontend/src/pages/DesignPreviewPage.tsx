import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Field } from '../components/ui/Field';
import { Card, CardHeader, CardTitle, CardSubtitle } from '../components/ui/Card';
import { Badge, StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Dropdown } from '../components/ui/Dropdown';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';

const swatches = [
  { name: 'primary', token: 'bg-primary', hex: '#006CAB' },
  { name: 'primary-hover', token: 'bg-primary-hover', hex: '#005A8F' },
  { name: 'primary-pressed', token: 'bg-primary-pressed', hex: '#004875' },
  { name: 'primary-subtle', token: 'bg-primary-subtle', hex: '#E6F2F8' },
  { name: 'surface', token: 'bg-surface border border-border-default', hex: '#FFFFFF' },
  { name: 'surface-muted', token: 'bg-surface-muted', hex: '#F8FAFC' },
  { name: 'border-default', token: 'bg-border-default', hex: '#E2E8F0' },
  { name: 'border-strong', token: 'bg-border-strong', hex: '#CBD5E1' },
  { name: 'text-primary', token: 'bg-text-primary', hex: '#0F172A' },
  { name: 'text-secondary', token: 'bg-text-secondary', hex: '#475569' },
  { name: 'text-tertiary', token: 'bg-text-tertiary', hex: '#94A3B8' },
  { name: 'success', token: 'bg-success', hex: '#059669' },
  { name: 'success-subtle', token: 'bg-success-subtle', hex: '#D1FAE5' },
  { name: 'warning', token: 'bg-warning', hex: '#D97706' },
  { name: 'warning-subtle', token: 'bg-warning-subtle', hex: '#FEF3C7' },
  { name: 'danger', token: 'bg-danger', hex: '#DC2626' },
  { name: 'danger-subtle', token: 'bg-danger-subtle', hex: '#FEE2E2' },
];

const typeSamples = [
  { class: 'text-display font-semibold', label: 'Display 30 / 600 / -0.02em' },
  { class: 'text-h1 font-semibold', label: 'Heading 1 24 / 600 / -0.01em' },
  { class: 'text-h2 font-semibold', label: 'Heading 2 20 / 600' },
  { class: 'text-h3 font-semibold', label: 'Heading 3 16 / 600' },
  { class: 'text-lg', label: 'Body large 16 / 400' },
  { class: 'text-base', label: 'Body 14 / 400' },
  { class: 'text-sm', label: 'Small UI 13 / 400' },
  { class: 'text-xs', label: 'Caption 12 / 400 / 0.01em' },
];

export function DesignPreviewPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-muted py-8">
      <div className="max-w-5xl mx-auto px-6 space-y-12">
        <PageHeader
          title="Design system"
          description="Monash Blue tokens, typography, and primitives. Use this page as the reference for any redesign work."
        />

        <Section title="Color tokens">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {swatches.map(s => (
              <div
                key={s.name}
                className="border border-border-default rounded-md overflow-hidden bg-surface"
              >
                <div className={`h-16 ${s.token}`} />
                <div className="p-3">
                  <div className="text-sm font-medium text-text-primary">{s.name}</div>
                  <div className="text-xs text-text-secondary font-mono">{s.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography">
          <div className="space-y-4 bg-surface border border-border-default rounded-lg p-6">
            {typeSamples.map(t => (
              <div key={t.label}>
                <div className={t.class + ' text-text-primary'}>The quick brown fox</div>
                <div className="text-xs text-text-tertiary mt-1 font-mono">{t.label}</div>
              </div>
            ))}
            <div className="pt-4 border-t border-border-default">
              <div className="font-mono text-sm text-text-primary">JetBrains Mono — code()</div>
              <div className="text-xs text-text-tertiary mt-1 font-mono">Mono 14 / 400</div>
            </div>
          </div>
        </Section>

        <Section title="Buttons">
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="primary" size="sm">Primary sm</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" loading>Loading</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </Card>
        </Section>

        <Section title="Form controls">
          <Card>
            <div className="grid sm:grid-cols-2 gap-6">
              <Field label="Email" required hint="Use your Monash address">
                <Input type="email" placeholder="you@monash.edu" />
              </Field>
              <Field label="Role">
                <Select defaultValue="member">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </Select>
              </Field>
              <Field
                label="Description"
                error="Description is required"
                className="sm:col-span-2"
              >
                <Textarea rows={3} placeholder="Short description of the task" invalid />
              </Field>
            </div>
          </Card>
        </Section>

        <Section title="Badges">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Neutral</Badge>
              <Badge tone="primary">Primary</Badge>
              <Badge tone="success">Success</Badge>
              <Badge tone="warning">Warning</Badge>
              <Badge tone="danger">Danger</Badge>
              <Badge tone="soft">Soft</Badge>
              <span className="mx-2 h-4 w-px bg-border-default" />
              <StatusBadge status="TODO" />
              <StatusBadge status="IN_PROGRESS" />
              <StatusBadge status="DONE" />
              <span className="mx-2 h-4 w-px bg-border-default" />
              <PriorityBadge priority="LOW" />
              <PriorityBadge priority="MEDIUM" />
              <PriorityBadge priority="HIGH" />
            </div>
          </Card>
        </Section>

        <Section title="Cards">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Standard card</CardTitle>
                  <CardSubtitle>1px slate border, no shadow at rest.</CardSubtitle>
                </div>
              </CardHeader>
              <p className="text-base text-text-secondary">
                Cards rely on borders for separation. Shadows only appear on overlays.
              </p>
            </Card>
            <Card interactive>
              <CardHeader>
                <div>
                  <CardTitle>Interactive card</CardTitle>
                  <CardSubtitle>Subtle lift on hover only.</CardSubtitle>
                </div>
              </CardHeader>
              <p className="text-base text-text-secondary">
                Hover this card to see the border darken and a small shadow appear.
              </p>
            </Card>
          </div>
        </Section>

        <Section title="Overlays">
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => setModalOpen(true)}>Open modal</Button>
              <Dropdown
                trigger={<Button variant="secondary">Open dropdown</Button>}
                items={[
                  { label: 'Edit', onClick: () => undefined },
                  { label: 'Duplicate', onClick: () => undefined },
                  { label: 'Delete', destructive: true, onClick: () => undefined },
                ]}
              />
            </div>
          </Card>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Design preview modal"
            description="Modal uses 12px radius and a soft shadow on a 1px border."
            footer={
              <>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setModalOpen(false)}>Confirm</Button>
              </>
            }
          >
            <p className="text-base text-text-secondary">
              This is a sample modal showing the redesigned overlay treatment.
            </p>
          </Modal>
        </Section>

        <Section title="Empty state and skeletons">
          <div className="grid lg:grid-cols-2 gap-4">
            <EmptyState
              title="No tasks yet"
              description="Create your first task to see it appear here."
              action={<Button>New task</Button>}
            />
            <Card>
              <div className="flex items-center gap-3">
                <Skeleton shape="circle" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton shape="text" width="60%" />
                  <Skeleton shape="text" width="40%" />
                </div>
              </div>
              <div className="mt-6">
                <SkeletonText lines={3} />
              </div>
            </Card>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-h2 font-semibold text-text-primary mb-4">{title}</h2>
      {children}
    </section>
  );
}
