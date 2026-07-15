// Vercel Serverless Function: /api/send-push
// 특정 유저(targetId)에게 저장된 구독 정보로 실제 웹 푸시를 발송합니다.
const webpush = require('web-push');

const SUPA_URL = 'https://hjsubxsbswombxjehrml.supabase.co';
const SUPA_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqc3VieHNic3dvbWJ4amVocm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjUzOTAsImV4cCI6MjA5NzgwMTM5MH0.OkqQTRbNTNPOkNL-OIhtNyvgh3JJcCBQllT3ChkMGZ4';

webpush.setVapidDetails(
  'mailto:admin@ewhaenglish.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }
  try {
    const { targetId, title, body, url } = req.body;
    if (!targetId) return res.status(400).json({ error: 'targetId required' });

    const resp = await fetch(
      SUPA_URL + '/rest/v1/push_subscriptions?user_id=eq.' + targetId + '&select=subscription',
      {
        headers: {
          'apikey': SUPA_ANON_KEY,
          'Authorization': 'Bearer ' + SUPA_ANON_KEY
        }
      }
    );
    const rows = await resp.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(200).json({ sent: 0, message: 'no subscription found' });
    }

    const payload = JSON.stringify({
      title: title || '이화영어',
      body: body || '',
      url: url || '/'
    });

    let sent = 0, failed = 0;
    for (const row of rows) {
      try {
        await webpush.sendNotification(row.subscription, payload);
        sent++;
      } catch (err) {
        failed++;
      }
    }
    return res.status(200).json({ sent: sent, failed: failed });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
