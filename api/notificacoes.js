// api/notificacoes.js
// Cron job diário às 00h30 — envia email com resumo do dia

export default async function handler(req, res) {
  // Segurança: só aceita chamadas do Vercel Cron
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date(new Date().toLocaleString('en', { timeZone: 'Europe/Lisbon' }));
  const d = now.getDate();
  const m = now.getMonth() + 1;
  const year = now.getFullYear();

  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const DIAS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
  const dataFormatada = `${DIAS[now.getDay()]}, ${d} de ${MESES[m-1]} de ${year}`;

  // ── Feriados e Pontes ────────────────────────────────────────────────────────
  const FERIADOS_NOMES = {
    '1-1':'Ano Novo','1-2':'Ponte (Ano Novo)',
    '2-16':'Ponte (Carnaval)','2-17':'Carnaval',
    '4-3':'Sexta-feira Santa','4-5':'Páscoa','4-25':'Dia da Liberdade',
    '5-1':'Dia do Trabalhador',
    '6-4':'Corpo de Deus','6-10':'Dia de Portugal','6-24':'S. João',
    '8-15':'Assunção de N.Sra.',
    '10-5':'Implantação da República',
    '11-1':'Todos os Santos','11-30':'Ponte (Restauração)',
    '12-1':'Restauração da Independência',
    '12-8':'Imaculada Conceição','12-25':'Natal'
  };
  const PONTES = new Set(['1-2','2-16','11-30']);
  const key = `${m}-${d}`;
  const feriadoNome = FERIADOS_NOMES[key];
  const isPonte = PONTES.has(key);

  // ── Férias ───────────────────────────────────────────────────────────────────
  const FERIAS = {};
  function add(k, p) { if (!FERIAS[k]) FERIAS[k] = []; if (!FERIAS[k].includes(p)) FERIAS[k].push(p); }

  [3,4,18,19,20].forEach(d=>add(`2-${d}`,'CLF'));
  [6,7,8,9,10].forEach(d=>add(`4-${d}`,'CLF'));
  [24,25,26,27,28,29,30,31].forEach(d=>add(`8-${d}`,'CLF'));
  [1,2,3,4].forEach(d=>add(`9-${d}`,'CLF'));
  [21,22,23,24].forEach(d=>add(`12-${d}`,'CLF'));
  [9,10].forEach(d=>add(`4-${d}`,'PS'));
  [5,8,9,22,23].forEach(d=>add(`6-${d}`,'PS'));
  add('8-31','PS');
  [1,2,3,4,5,6,7,8,9,10,11].forEach(d=>add(`9-${d}`,'PS'));
  add('12-7','PS');
  [13,14,15,16,17,20].forEach(d=>add(`3-${d}`,'TBF'));
  add('4-24','TBF');
  [20,21,22].forEach(d=>add(`5-${d}`,'TBF'));
  [5,22,23,25,26].forEach(d=>add(`6-${d}`,'TBF'));
  add('12-7','TBF');
  [28,29,30,31].forEach(d=>add(`12-${d}`,'TBF'));
  [11,12].forEach(d=>add(`6-${d}`,'TF'));
  [10,11,12,13,14,17,18,19,20,21].forEach(d=>add(`8-${d}`,'TF'));
  [28,29,30,31].forEach(d=>add(`12-${d}`,'TF'));
  [11,12].forEach(d=>add(`6-${d}`,'SF'));
  [10,11,12,13,14,17,18,19,20,21].forEach(d=>add(`8-${d}`,'SF'));
  [28,29,30,31].forEach(d=>add(`12-${d}`,'SF'));
  [7,8,9,10,11,12,13,14].forEach(d=>add(`8-${d}`,'JPP'));

  const feriasHoje = FERIAS[key] || [];

  // ── Aniversários ─────────────────────────────────────────────────────────────
  const ANIVERSARIOS = {
    '2-14':'Clarice (CL)','2-15':'Carlos (CF)','3-14':'Pedro (PS)',
    '3-26':'Laurentino (LA)','4-9':'Devesas (DE)','4-16':'Sara (SA)',
    '4-30':'Matheus (MS)','5-20':'Tânia (TF)','6-24':'Padrão (JP)',
    '11-8':'Hector (HE)','12-4':'Tiago (TG)'
  };
  const anivHoje = ANIVERSARIOS[key];

  // ── Verificar se há algo para reportar ───────────────────────────────────────
  const temEventos = feriadoNome || feriasHoje.length > 0 || anivHoje;
  if (!temEventos) {
    return res.status(200).json({ message: 'Sem eventos hoje, email não enviado.' });
  }

  // ── Construir HTML do email ───────────────────────────────────────────────────
  let secoes = '';

  if (feriadoNome) {
    const icon = isPonte ? '🌉' : '🔴';
    const tipo = isPonte ? 'Ponte' : 'Feriado Nacional';
    secoes += `
      <div style="background:#1a2e4a;border-left:4px solid ${isPonte?'#4080ff':'#e03030'};border-radius:8px;padding:14px 18px;margin-bottom:12px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8899bb;margin-bottom:4px;">${icon} ${tipo}</div>
        <div style="font-size:16px;color:#ffffff;font-weight:600;">${feriadoNome}</div>
      </div>`;
  }

  if (anivHoje) {
    secoes += `
      <div style="background:#1a2e4a;border-left:4px solid #f0a040;border-radius:8px;padding:14px 18px;margin-bottom:12px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8899bb;margin-bottom:4px;">🎂 Aniversário</div>
        <div style="font-size:16px;color:#ffffff;font-weight:600;">${anivHoje}</div>
        <div style="font-size:13px;color:#aabbcc;margin-top:4px;">Não te esqueças de dar os parabéns! 🎉</div>
      </div>`;
  }

  if (feriasHoje.length > 0) {
    secoes += `
      <div style="background:#1a2e4a;border-left:4px solid #30c060;border-radius:8px;padding:14px 18px;margin-bottom:12px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8899bb;margin-bottom:4px;">🌴 De Férias Hoje</div>
        <div style="font-size:16px;color:#ffffff;font-weight:600;">${feriasHoje.join(', ')}</div>
      </div>`;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0d1b35;font-family:Calibri,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="display:flex;align-items:center;margin-bottom:24px;">
      <div style="background:#1a3a6b;border-radius:10px;padding:10px 16px;display:inline-block;">
        <span style="font-size:18px;font-weight:700;color:white;letter-spacing:1px;">⚡ Aceitar Hub</span>
        <div style="font-size:11px;color:#8899bb;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">Notificação Diária</div>
      </div>
    </div>

    <!-- Data -->
    <div style="font-size:13px;color:#8899bb;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #1a3a6b;">
      📅 ${dataFormatada}
    </div>

    <!-- Eventos -->
    ${secoes}

    <!-- Footer -->
    <div style="margin-top:28px;padding-top:16px;border-top:1px solid #1a3a6b;font-size:11px;color:#556677;text-align:center;">
      Aceitar Hub · hub.aceitar.pt<br>
      Esta notificação foi enviada automaticamente às 00h30.
    </div>
  </div>
</body>
</html>`;

  // ── Enviar via Resend ─────────────────────────────────────────────────────────
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Aceitar Hub <hub@send.aceitar.pt>',
        to: ['carlos.ferreira@aceitar.pt'],
        subject: `📅 ${dataFormatada} — Resumo do Dia`,
        html
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));

    return res.status(200).json({ success: true, id: result.id });
  } catch (err) {
    console.error('Erro ao enviar email:', err);
    return res.status(500).json({ error: err.message });
  }
}
