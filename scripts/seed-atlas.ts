/* eslint-disable no-console */
import bcrypt from 'bcrypt';
import readline from 'readline';
import { connectMongo, disconnectMongo } from '../src/shared/infrastructure/mongo/connect';
import { UserModel } from '../src/modules/identity/infrastructure/UserModel';
import { TaskModel } from '../src/modules/task/infrastructure/TaskModel';
import { User } from '../src/modules/identity/domain/User';
import { Role } from '../src/modules/identity/domain/Role';
import { Task } from '../src/modules/task/domain/Task';
import { TaskStatus } from '../src/modules/task/domain/TaskStatus';
import { TaskPriority } from '../src/modules/task/domain/TaskPriority';

interface CommitteeMember {
  name: string;
  role: string;
}

const MASA_COMMITTEE: CommitteeMember[] = [
  { name: 'Parsa Aghajani', role: 'President' },
  { name: 'Helen Le', role: 'Vice-President' },
  { name: 'Jin Yang Tay', role: 'Treasurer' },
  { name: 'Alicia Tran', role: 'Secretary' },
  { name: 'Tanissh Khanna', role: 'Sponsorships Director' },
  { name: 'Finlay Townsend', role: 'Events Director' },
  { name: 'Laura Browne', role: 'Events Officer' },
  { name: 'Natasha Lee', role: 'Marketing Director' },
  { name: 'Cassidy Ching', role: 'Marketing Officer' },
  { name: 'Ben Zhao', role: 'IT Director' },
  { name: 'Chloe Chen', role: 'IT Officer' },
  { name: 'Bonnie Liu', role: 'Publications Director' },
  { name: 'Raymond Lam', role: 'HR Director' },
  { name: 'Chavella Tanubrata', role: 'HR Director' },
];

const SAS_COMMITTEE: CommitteeMember[] = [
  { name: 'Eliza Burnes', role: 'President' },
  { name: 'Noah Caruso', role: 'Vice President' },
  { name: 'Campbell Lester', role: 'Treasurer' },
  { name: 'Nicky De Leon', role: 'Secretary' },
  { name: 'Portia Giles', role: 'Social Director' },
  { name: 'Sian Kinsella', role: 'Academic Director' },
  { name: 'Anika Moller', role: 'Camp Coordinator' },
  { name: 'Siobhan O\'Donnell', role: 'Ball Coordinator' },
  { name: 'Bailey Hunter', role: 'Graphic Designer' },
  { name: 'Phoebe Valiotis', role: 'Marketing Officer' },
  { name: 'Will Thurston', role: 'Sponsorships Officer' },
  { name: 'Diya Sachdeva', role: 'Publications Officer' },
];

const MEMBER_PASSWORD = 'Member1234!';
const ADMIN_PASSWORD = 'Admin1234!';
const EMAIL_DOMAIN = 'monashclubs.org';

function slugifyEmail(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s.-]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join('.');
}

interface SeededUser {
  user: User;
  clubId: string;
  role: string;
}

function buildMembers(
  members: CommitteeMember[],
  clubId: string,
  hash: string,
): SeededUser[] {
  return members.map(m => {
    const email = `${slugifyEmail(m.name)}@${EMAIL_DOMAIN}`;
    const user = new User({
      email,
      name: m.name,
      passwordHash: hash,
      role: Role.MEMBER,
      isActive: true,
    });
    return { user, clubId, role: m.role };
  });
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function pickByRoleKeyword(pool: SeededUser[], keywords: string[]): SeededUser {
  const matches = pool.filter(p =>
    keywords.some(k => p.role.toLowerCase().includes(k.toLowerCase())),
  );
  return matches.length > 0 ? pick(matches) : pick(pool);
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

interface TaskBlueprint {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueInDays?: number;
  clubId: 'masa' | 'sas';
  assigneeKeywords: string[];
  tags: string[];
}

const TASK_BLUEPRINTS: TaskBlueprint[] = [
  // MASA tasks
  {
    title: 'Book venue for MASA Networking Night',
    description: 'Confirm Caulfield campus venue and AV equipment for the Big 4 networking evening.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    dueInDays: 10,
    clubId: 'masa',
    assigneeKeywords: ['Events'],
    tags: ['event', 'venue'],
  },
  {
    title: 'Draft sponsorship proposal for Big 4 firms',
    description: 'Prepare a pitch deck covering audience reach, past event metrics, and tier-based sponsorship packages.',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    dueInDays: 7,
    clubId: 'masa',
    assigneeKeywords: ['Sponsorship'],
    tags: ['sponsorship', 'finance'],
  },
  {
    title: 'Design social media post for Accounting Careers Expo',
    description: 'Instagram + LinkedIn carousel announcing the expo speaker line-up.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    dueInDays: 5,
    clubId: 'masa',
    assigneeKeywords: ['Marketing'],
    tags: ['marketing', 'design'],
  },
  {
    title: 'Update MASA website with 2026 committee photos',
    description: 'Replace placeholder profile images, verify all role titles, push to production.',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueInDays: 14,
    clubId: 'masa',
    assigneeKeywords: ['IT'],
    tags: ['it', 'admin'],
  },
  {
    title: 'Prepare Q1 2026 treasurer report',
    description: 'Reconcile bank statements, summarise income and outgoings for the committee meeting.',
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    dueInDays: -3,
    clubId: 'masa',
    assigneeKeywords: ['Treasurer'],
    tags: ['finance', 'admin'],
  },
  {
    title: 'Print first edition of MASA Magazine',
    description: 'Liaise with the print shop, finalise quantities and pickup date.',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueInDays: 21,
    clubId: 'masa',
    assigneeKeywords: ['Publications'],
    tags: ['publications', 'print'],
  },
  {
    title: 'Recruit MASA subcommittee for semester 2',
    description: 'Draft role descriptions, open applications, screen candidates.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    dueInDays: 18,
    clubId: 'masa',
    assigneeKeywords: ['HR'],
    tags: ['hr', 'admin'],
  },
  {
    title: 'Confirm catering quotes for MASA End-of-Year Dinner',
    description: 'Compare three vendors, dietary options, and lock in deposit.',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueInDays: 28,
    clubId: 'masa',
    assigneeKeywords: ['Events'],
    tags: ['event', 'catering'],
  },
  {
    title: 'Run member feedback survey',
    description: 'Send Google Form to 2025 participants and summarise top three improvement themes.',
    status: TaskStatus.DONE,
    priority: TaskPriority.LOW,
    dueInDays: -7,
    clubId: 'masa',
    assigneeKeywords: ['HR'],
    tags: ['admin', 'hr'],
  },
  {
    title: 'Refresh MASA Discord welcome flow',
    description: 'Update welcome embed, role-assignment reactions, and pinned event calendar.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.LOW,
    dueInDays: 12,
    clubId: 'masa',
    assigneeKeywords: ['IT'],
    tags: ['it', 'communication'],
  },
  {
    title: 'Pitch MASA at O-Week stall',
    description: 'Staff the Caulfield stall, hand out merch, capture new-member sign-ups.',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    dueInDays: 25,
    clubId: 'masa',
    assigneeKeywords: ['President', 'Vice'],
    tags: ['event', 'recruitment'],
  },
  {
    title: 'Order MASA merchandise reprint',
    description: 'Tote bags and stickers ran out at the last event — reorder 200 of each.',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    dueInDays: 20,
    clubId: 'masa',
    assigneeKeywords: ['Marketing'],
    tags: ['merchandise', 'marketing'],
  },
  // SAS tasks
  {
    title: 'Organise SAS Annual Ball catering quotes',
    description: 'Reach out to three venues, compare per-head pricing, share recommendation with exec.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    dueInDays: 9,
    clubId: 'sas',
    assigneeKeywords: ['Ball'],
    tags: ['event', 'catering'],
  },
  {
    title: 'Confirm SAS Camp bus charter',
    description: 'Book two coaches for Lake Mountain, confirm pickup points and insurance certificate.',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    dueInDays: 14,
    clubId: 'sas',
    assigneeKeywords: ['Camp'],
    tags: ['event', 'logistics'],
  },
  {
    title: 'Design SAS Camp launch poster',
    description: 'A2 print + Instagram square. Pull from this year\'s brand palette.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    dueInDays: 6,
    clubId: 'sas',
    assigneeKeywords: ['Graphic', 'Designer'],
    tags: ['design', 'marketing'],
  },
  {
    title: 'Schedule Q1 academic peer-mentoring sessions',
    description: 'Match 30 first-years with mentors, send the kickoff calendar invite.',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueInDays: 11,
    clubId: 'sas',
    assigneeKeywords: ['Academic', 'Mentor'],
    tags: ['academic', 'mentoring'],
  },
  {
    title: 'Publish SAS newsletter — issue 1',
    description: 'Compile committee updates, event recap, member spotlight; ship via Mailchimp.',
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    dueInDays: -2,
    clubId: 'sas',
    assigneeKeywords: ['Publications'],
    tags: ['publications', 'communication'],
  },
  {
    title: 'Lock in DJ for SAS Ball',
    description: 'Negotiate fee, confirm playlist requirements, get signed contract.',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    dueInDays: 13,
    clubId: 'sas',
    assigneeKeywords: ['Ball', 'Social'],
    tags: ['event', 'entertainment'],
  },
  {
    title: 'Draft SAS sponsorship one-pager',
    description: 'Audience demographics, past sponsor logos, and three pricing tiers.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    dueInDays: 8,
    clubId: 'sas',
    assigneeKeywords: ['Sponsorship'],
    tags: ['sponsorship', 'finance'],
  },
  {
    title: 'Reconcile SAS Camp deposits',
    description: 'Match 60 member transfers against signup list, follow up missing payments.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    dueInDays: 5,
    clubId: 'sas',
    assigneeKeywords: ['Treasurer'],
    tags: ['finance', 'admin'],
  },
  {
    title: 'Update SAS website with 2026 committee bios',
    description: 'Collect short bios, headshots, push the new team page live.',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    dueInDays: 17,
    clubId: 'sas',
    assigneeKeywords: ['Marketing', 'Secretary'],
    tags: ['marketing', 'admin'],
  },
  {
    title: 'Run SAS welcome trivia night',
    description: 'Book the Wholefoods bar, write 4 rounds of questions, prep prizes.',
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    dueInDays: -10,
    clubId: 'sas',
    assigneeKeywords: ['Social'],
    tags: ['event', 'social'],
  },
  {
    title: 'Submit SAS event grant application',
    description: 'MSA grant deadline. Fill in form, attach budget, get exec sign-off.',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    dueInDays: 4,
    clubId: 'sas',
    assigneeKeywords: ['President', 'Secretary'],
    tags: ['grant', 'admin'],
  },
  {
    title: 'Photo shoot for SAS Ball promotional content',
    description: 'Book photographer, scout location, coordinate committee outfits.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.LOW,
    dueInDays: 19,
    clubId: 'sas',
    assigneeKeywords: ['Marketing', 'Social'],
    tags: ['marketing', 'event'],
  },
  {
    title: 'Plan SAS exam-period care packages',
    description: 'Source snacks and stationery, organise pickup table during SWOTVAC.',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    dueInDays: 30,
    clubId: 'sas',
    assigneeKeywords: ['General'],
    tags: ['welfare', 'event'],
  },
];

async function confirm(prompt: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set. Export it before running this script.');
    process.exit(1);
  }

  console.log('Target database: <redacted, read from MONGODB_URI>');
  console.log('This script will:');
  console.log('  1. Drop all documents from the "users" and "tasks" collections');
  console.log('  2. Insert 2 admin users');
  console.log(`  3. Insert ${MASA_COMMITTEE.length + SAS_COMMITTEE.length} member users from MASA + SAS rosters`);
  console.log(`  4. Insert ${TASK_BLUEPRINTS.length} club tasks across TODO / IN_PROGRESS / DONE`);
  console.log('');

  const proceed = await confirm('This will clear all existing data in the database. Continue? (y/n) ');
  if (!proceed) {
    console.log('Aborted.');
    return;
  }

  await connectMongo(uri);
  console.log('Connected to MongoDB.');

  await UserModel.deleteMany({});
  await TaskModel.deleteMany({});
  console.log('Existing users + tasks cleared.');

  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const memberHash = await bcrypt.hash(MEMBER_PASSWORD, 10);

  const admins: User[] = [
    new User({
      email: 'admin@monashclubs.org',
      name: 'Club Admin',
      passwordHash: adminHash,
      role: Role.ADMIN,
      isActive: true,
    }),
    new User({
      email: 'thanh@monashclubs.org',
      name: 'Thanh Tung Le',
      passwordHash: adminHash,
      role: Role.ADMIN,
      isActive: true,
    }),
  ];

  const masaMembers = buildMembers(MASA_COMMITTEE, 'masa', memberHash);
  const sasMembers = buildMembers(SAS_COMMITTEE, 'sas', memberHash);
  const allMembers = [...masaMembers, ...sasMembers];

  await UserModel.insertMany(
    [...admins, ...allMembers.map(m => m.user)].map(u => ({
      _id: u.id,
      email: u.email,
      name: u.name,
      passwordHash: u.passwordHash,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })),
  );

  const tasks: Task[] = TASK_BLUEPRINTS.map(bp => {
    const pool = bp.clubId === 'masa' ? masaMembers : sasMembers;
    const assignee = pickByRoleKeyword(pool, bp.assigneeKeywords);
    return new Task({
      title: bp.title,
      description: bp.description,
      status: bp.status,
      priority: bp.priority,
      assigneeId: assignee.user.id,
      dueDate: bp.dueInDays !== undefined ? daysFromNow(bp.dueInDays) : undefined,
      createdBy: admins[0].id,
      clubId: bp.clubId,
      tags: bp.tags,
    });
  });

  await TaskModel.insertMany(
    tasks.map(t => ({
      _id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assigneeId: t.assigneeId,
      dueDate: t.dueDate,
      createdBy: t.createdBy,
      clubId: t.clubId,
      tags: t.tags.map(tag => tag.value),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  );

  const userCount = await UserModel.countDocuments();
  const taskCount = await TaskModel.countDocuments();
  const todoCount = await TaskModel.countDocuments({ status: TaskStatus.TODO });
  const inProgressCount = await TaskModel.countDocuments({ status: TaskStatus.IN_PROGRESS });
  const doneCount = await TaskModel.countDocuments({ status: TaskStatus.DONE });

  console.log('');
  console.log('======== SEED SUMMARY ========');
  console.log(`Users:  ${userCount}  (admins: 2, members: ${userCount - 2})`);
  console.log(`Tasks:  ${taskCount}  (TODO: ${todoCount}, IN_PROGRESS: ${inProgressCount}, DONE: ${doneCount})`);
  console.log('');
  console.log('Admin logins (capstone demo only):');
  console.log(`  admin@monashclubs.org / ${ADMIN_PASSWORD}`);
  console.log(`  thanh@monashclubs.org / ${ADMIN_PASSWORD}`);
  console.log(`Member password (all members): ${MEMBER_PASSWORD}`);
  console.log('==============================');

  await disconnectMongo();
}

main().catch(async err => {
  console.error('Seed failed:', err);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
