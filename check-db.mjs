import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('\n📊 Checking database...\n');

  // Check SOAP reports
  const soapReports = await prisma.sOAPReport.findMany({
    select: {
      id: true,
      sessionId: true,
      patientId: true,
      reviewStatus: true,
      department: true,
      priority: true,
      assignedDoctorId: true,
      createdAt: true,
    },
  });
  console.log('SOAP Reports:', JSON.stringify(soapReports, null, 2));

  // Check clinical sessions
  const sessions = await prisma.clinicalSession.findMany({
    select: {
      id: true,
      patientId: true,
      status: true,
      createdAt: true,
    },
  });
  console.log('\nClinical Sessions:', JSON.stringify(sessions, null, 2));

  // Check users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      role: true,
    },
  });
  console.log('\nUsers:', JSON.stringify(users, null, 2));

  // Check doctor profiles
  const doctors = await prisma.doctorProfile.findMany({
    select: {
      doctorId: true,
      fullName: true,
      department: true,
      isComplete: true,
    },
  });
  console.log('\nDoctor Profiles:', JSON.stringify(doctors, null, 2));

  await pool.end();
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
