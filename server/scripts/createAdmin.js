import 'dotenv/config';
import '../models/index.js';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';

const parseArgs = () => {
  const args = { name: '', email: '', password: '' };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--name=')) args.name = arg.slice(7);
    else if (arg.startsWith('--email=')) args.email = arg.slice(8);
    else if (arg.startsWith('--password=')) args.password = arg.slice(11);
    else if (!arg.startsWith('--') && !args.email) args.email = arg;
    else if (!arg.startsWith('--') && args.email && !args.password) args.password = arg;
  }
  return args;
};

const run = async () => {
  const { name, email, password } = parseArgs();

  if (!email || !password) {
    console.log(`
Create an admin account for School ERP

Usage:
  npm run create-admin -- --email=admin@school.com --password=YourPassword123 --name="Admin User"

Or:
  node scripts/createAdmin.js admin@school.com YourPassword123 "Admin User"
`);
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Admin already exists: ${email}`);
    } else {
      console.error(`Email ${email} is already used by a ${existing.role} account.`);
      process.exit(1);
    }
    await mongoose.disconnect();
    return;
  }

  const admin = await User.create({
    name: name || 'Administrator',
    email: email.toLowerCase(),
    password,
    role: 'admin',
    status: 'active',
  });

  console.log('\nAdmin account created successfully!');
  console.log(`  Name:  ${admin.name}`);
  console.log(`  Email: ${admin.email}`);
  console.log(`  Role:  ${admin.role}`);
  console.log('\nYou can now sign in at http://localhost:5173/login\n');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});
