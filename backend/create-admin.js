const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const senha = 'debtadmintracker123321';
    const senhaHash = await bcrypt.hash(senha, 10);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@gmail.com' },
      update: {
        senha: senhaHash,
        role: 'ADMIN',
        isActive: true,
      },
      create: {
        nome: 'Admin',
        email: 'admin@gmail.com',
        senha: senhaHash,
        telefone: '258840000000',
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('\n✅ Admin criado/atualizado com sucesso!');
    console.log('Email:', admin.email);
    console.log('Senha: debtadmintracker123321');
    console.log('Role:', admin.role);
    console.log('\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createAdmin();
