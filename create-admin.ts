import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@subash.com' },
        update: { role: 'SUPER_ADMIN', password: hashedPassword },
        create: {
            email: 'admin@subash.com',
            name: 'Super Admin',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            authProvider: 'CREDENTIALS'
        }
    });
    console.log(`Admin user created/updated: ${user.email} (password: admin123)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
