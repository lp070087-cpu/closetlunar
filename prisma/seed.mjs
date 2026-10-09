/**
 * O SEED — os dados iniciais que permitem TESTAR o sistema.
 *
 * ================== NAO DESPEJA AS FIXTURES ==================
 *
 * O comando e explicito: *"o objetivo nao e despejar todas as fixtures no
 * banco"*. O que entra aqui e o MINIMO para validar os fluxos: um usuario de cada
 * papel (para provar que o login separa admin de cliente), as categorias e
 * produtos que o site precisa para ter catalogo, um cupom (para a regra do
 * checkout), uma secao de conteudo (para o site refletir o admin) e os beneficios.
 *
 * Dado de demonstracao que NAO serve a um teste fica de fora — `DEMO_*` continua
 * no codigo como o piso do `ler()`, e nao precisa estar no banco.
 *
 * ================== A SENHA DO SEED ==================
 *
 * O seed cria um admin e um cliente com senha CONHECIDA, e IMPRIME o aviso de
 * que ela existe. Isso e necessario para poder testar o login, e e o unico lugar
 * do sistema onde uma senha e legivel — porque ela nao esta GRAVADA, esta
 * derivada: o banco recebe o HASH, e o texto abaixo e so o que a pessoa digita.
 *
 * **Antes de publicar, estas duas contas TEM que ser removidas ou ter a senha
 * trocada.** O `README` do seed diz isso, e o aviso sai no console a cada run.
 *
 * ================== COMO RODAR ==================
 *
 *     node prisma/seed.mjs
 *
 * Ele EXIGE `DATABASE_URL`. Sem ela, sai com a mensagem de bloqueio — e nao
 * inventa um banco, nem escreve em lugar nenhum.
 */

import { createRequire } from 'node:module';
import { randomBytes, scryptSync } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, '..');
const require = createRequire(join(raiz, 'package.json'));

/* ------------------------------- a credencial ------------------------------- */

function lerEnv() {
  // Le o `.env` sem dependencia: o `dotenv` nao esta no projeto.
  for (const nome of ['.env', '.env.local']) {
    const caminho = join(raiz, nome);
    if (!existsSync(caminho)) continue;
    for (const linha of readFileSync(caminho, 'utf8').split('\n')) {
      const m = linha.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

lerEnv();

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('ep-xxxx')) {
  console.error(
    [
      '',
      '  NEON EXECUTION: BLOQUEADO POR DATABASE_URL',
      '',
      '  O seed precisa de uma conexao real. Ver `.env.example` e preencha:',
      '    DATABASE_URL   (com pooler)',
      '    DIRECT_URL     (para migrations)',
      '',
      '  Nada foi escrito. Nenhuma credencial foi inventada.',
      '',
    ].join('\n'),
  );
  process.exit(2);
}

/* --------------------------------- o hash ---------------------------------- */

/*
  A MESMA implementacao de `lib/auth/senha.ts` (scrypt + salt + parametros na
  string). Repetida aqui porque o seed roda em Node puro, fora do bundler — e a
  duplicacao e pequena e conferivel: a bancada compara as duas.
*/
function hashSenha(senha) {
  const N = 16384, R = 8, P = 1, TAM = 64;
  const salt = randomBytes(16);
  const chave = scryptSync(senha, salt, TAM, { N, r: R, p: P });
  return ['scrypt', N, R, P, salt.toString('base64'), chave.toString('base64')].join('$');
}

const SENHA_DE_TESTE = 'closet123';

/* ------------------------------ os dados ---------------------------------- */

const CATEGORIAS = [
  { name: 'Tops', slug: 'tops', sortOrder: 1 },
  { name: 'Macaquinhos', slug: 'macaquinhos', sortOrder: 2 },
  { name: 'Conjuntos', slug: 'conjuntos', sortOrder: 3 },
  { name: 'Shorts', slug: 'shorts', sortOrder: 4 },
  { name: 'Leggings', slug: 'leggings', sortOrder: 6 },
];

/**
 * Os produtos sao os do catalogo que os prints mostram. As imagens ficam VAZIAS
 * de proposito: **STORAGE A DEFINIR** — nao ha provider, e gravar `data:` de
 * imagem no Postgres e o improviso que o comando proibe explicitamente.
 *
 * O site ja sabe desenhar produto sem foto (a capa bege), e o admin ja tem o
 * campo. Quando o storage for escolhido, as URLs entram por ele.
 */
const PRODUTOS = [
  { name: 'top', slug: 'top', categorySlug: 'tops', price: 179, costPrice: 90, stock: 8, sizes: ['P', 'M', 'G'], featured: true },
  { name: 'Top Essential Sustentação', slug: 'top-essential-sustentacao', categorySlug: 'tops', price: 89.9, costPrice: 45, stock: 35, sizes: ['PP', 'P', 'M', 'G'], featured: true },
  { name: 'Kit Nike', slug: 'kitnike', categorySlug: 'conjuntos', price: 139.9, costPrice: 70, stock: 1, sizes: ['P', 'M', 'G'] },
  { name: 'Conjunto Glow Nude', slug: 'conjunto-glow-nude', categorySlug: 'conjuntos', price: 209.9, costPrice: 105, stock: 12, sizes: ['P', 'M', 'G'], featured: true },
  { name: 'Legging Modeladora Premium', slug: 'legging-modeladora-premium', categorySlug: 'leggings', price: 129.9, costPrice: 65, stock: 40, sizes: ['P', 'M', 'G', 'GG'], featured: true },
  { name: 'Jaqueta Corta Vento Fit', slug: 'jaqueta-corta-vento', categorySlug: 'conjuntos', price: 179.9, costPrice: 90, stock: 22, sizes: ['P', 'M', 'G', 'GG'] },
];

/* --------------------------------- o main --------------------------------- */

async function main() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  console.log('\n  Seed do Closet Lunna\n');

  try {
    // --- os dois usuarios -------------------------------------------------
    //
    // Um de cada papel. Sem os dois nao da para provar a separacao de acesso,
    // que e uma das regras centrais da fase.
    const admin = await prisma.user.upsert({
      where: { email: 'admin@closetlunnar.com' },
      update: {},
      create: {
        email: 'admin@closetlunnar.com',
        name: 'Administradora',
        passwordHash: hashSenha(SENHA_DE_TESTE),
        role: 'admin',
        isActive: true,
      },
    });

    const cliente = await prisma.user.upsert({
      where: { email: 'cliente@exemplo.com' },
      update: {},
      create: {
        email: 'cliente@exemplo.com',
        name: 'Cliente de Teste',
        passwordHash: hashSenha(SENHA_DE_TESTE),
        role: 'cliente',
        isActive: true,
      },
    });

    console.log(`  ok  usuarios        admin=${admin.email}  cliente=${cliente.email}`);

    // --- categorias -------------------------------------------------------
    const idsCategoria = {};
    for (const c of CATEGORIAS) {
      const cat = await prisma.category.upsert({
        where: { slug: c.slug },
        update: { name: c.name, sortOrder: c.sortOrder },
        create: { ...c, isActive: true },
      });
      idsCategoria[c.slug] = cat.id;
    }
    console.log(`  ok  categorias      ${CATEGORIAS.length}`);

    // --- produtos ---------------------------------------------------------
    for (const p of PRODUTOS) {
      const { categorySlug, ...resto } = p;
      await prisma.product.upsert({
        where: { slug: p.slug },
        update: { price: p.price, stock: p.stock },
        create: {
          ...resto,
          categoryId: idsCategoria[categorySlug] ?? null,
          description: '',
          promoPrice: null,
          compareAtPrice: null,
          status: 'active',
          featured: p.featured ?? false,
        },
      });
    }
    console.log(`  ok  produtos        ${PRODUTOS.length}  (SEM imagem — STORAGE A DEFINIR)`);

    // --- cupom ------------------------------------------------------------
    //
    // `is_active` e o unico filtro da lista de cupons do painel — a decisao da
    // Fase 2. O seed nao grava validade para "fazer o cupom valer": o cupom vale
    // por estar ativo, e a validade e um campo separado.
    await prisma.coupon.upsert({
      where: { code: 'PRIMEIRA10' },
      update: {},
      create: {
        code: 'PRIMEIRA10',
        name: 'Primeira compra',
        kind: 'percent',
        value: 10,
        minSubtotal: 0,
        maxUses: null,
        startsAt: null,
        expiresAt: null,
        isActive: true,
        usageLimitPerUser: 1,
        applyTo: 'all',
        applicableIds: [],
        description: '',
        usesCount: 0,
      },
    });
    console.log('  ok  cupom           PRIMEIRA10 (10%)');

    // --- conteudo ---------------------------------------------------------
    const jaTemHero = await prisma.heroSlide.count();
    if (jaTemHero === 0) {
      await prisma.heroSlide.create({
        data: {
          title: 'Nova coleção fitness',
          eyebrow: 'Closet Lunar',
          subtitle: 'Conforto, estilo e performance em peças pensadas para o seu movimento.',
          linkUrl: '/categoria/novidades',
          ctaText: 'Ver coleção',
          imageDesktopUrl: null,
          imageMobileUrl: null,
          sortOrder: 1,
          isActive: true,
        },
      });
    }

    const jaTemBeneficios = await prisma.benefit.count();
    if (jaTemBeneficios === 0) {
      const beneficios = [
        { iconName: 'Truck', title: 'Frete grátis', description: 'acima de R$299', sortOrder: 1 },
        { iconName: 'CreditCard', title: 'Pague em até 6x', description: 'sem juros', sortOrder: 2 },
        { iconName: 'ShieldCheck', title: 'Compra segura', description: 'dados protegidos', sortOrder: 3 },
        { iconName: 'RefreshCw', title: 'Primeira troca grátis', description: 'em até 7 dias', sortOrder: 4 },
        { iconName: 'MessageCircle', title: 'Atendimento', description: 'via WhatsApp', sortOrder: 5 },
      ];
      for (const b of beneficios) await prisma.benefit.create({ data: { ...b, isActive: true } });
    }
    console.log('  ok  conteudo        hero + 5 beneficios');

    // --- configuracao -----------------------------------------------------
    await prisma.setting.upsert({
      where: { key: 'instagram' },
      update: {},
      create: { key: 'instagram', value: { url: 'https://instagram.com/closetlunar', showOnHome: true } },
    });
    await prisma.setting.upsert({
      where: { key: 'footer' },
      update: {},
      create: {
        key: 'footer',
        value: { whatsapp: '5581998871397', instagram: '@closetlunnar', email: '', address: '', policies: [], links: [] },
      },
    });
    console.log('  ok  settings        instagram + footer');

    console.log(
      [
        '',
        '  ================== ATENCAO ==================',
        `  Duas contas de teste foram criadas com a senha  ${SENHA_DE_TESTE}`,
        '    admin@closetlunnar.com   (papel: admin)',
        '    cliente@exemplo.com      (papel: cliente)',
        '',
        '  Isso existe para PODER TESTAR o login. O banco guarda o HASH,',
        '  e nao a senha. ANTES DE PUBLICAR: troque a senha das duas ou',
        '  remova as contas.',
        '  ============================================',
        '',
      ].join('\n'),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('\n  Seed falhou:', e instanceof Error ? e.message : e);
  process.exit(1);
});
