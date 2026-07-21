const express = require('express');
const path = require('path');
const { create, all } = require('mathjs');

const app = express();
const port = process.env.PORT || 3000;
const math = create(all, {});

const getMask = (bits) => (1n << BigInt(bits)) - 1n;

math.import({
  bitNand: (a, b) => math.bitNot(math.bitAnd(a, b)),
  bitNor: (a, b) => math.bitNot(math.bitOr(a, b)),
  bitRol: (val, count, wordSize = 64) => {
    const ws = BigInt(wordSize);
    const mask = getMask(ws);
    const v = BigInt(val) & mask;
    const c = BigInt(count) % ws;
    const res = ((v << c) | (v >> (ws - c))) & mask;
    return Number(BigInt.asIntN(Number(wordSize), res));
  },
  bitRor: (val, count, wordSize = 64) => {
    const ws = BigInt(wordSize);
    const mask = getMask(ws);
    const v = BigInt(val) & mask;
    const c = BigInt(count) % ws;
    const res = ((v >> c) | (v << (ws - c))) & mask;
    return Number(BigInt.asIntN(Number(wordSize), res));
  },
  bitRcl: (val, count, wordSize = 64, carry = 0) => {
    const ws = BigInt(wordSize);
    const totalBits = ws + 1n;
    const mask = getMask(totalBits);
    const v = (BigInt(val) & getMask(ws)) | (BigInt(carry) << ws);
    const c = BigInt(count) % totalBits;
    const res = ((v << c) | (v >> (totalBits - c))) & mask;
    return Number(BigInt.asIntN(Number(wordSize), res & getMask(ws)));
  },
  bitRcr: (val, count, wordSize = 64, carry = 0) => {
    const ws = BigInt(wordSize);
    const totalBits = ws + 1n;
    const mask = getMask(totalBits);
    const v = (BigInt(val) & getMask(ws)) | (BigInt(carry) << ws);
    const c = BigInt(count) % totalBits;
    const res = ((v >> c) | (v << (totalBits - c))) & mask;
    return Number(BigInt.asIntN(Number(wordSize), res & getMask(ws)));
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.post('/api/evaluate', (req, res) => {
  const expression = String(req.body?.expression ?? '').trim();

  if (!expression) {
    return res.status(400).json({ error: 'Expression is required.' });
  }

  try {
    const result = math.evaluate(expression);

    if (typeof result === 'number' && !Number.isFinite(result)) {
      return res.status(400).json({ error: 'Calculation produced an invalid result.' });
    }

    return res.json({ result: String(result) });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to evaluate expression.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(port, () => {
  console.log(`Calculator server running on http://localhost:${port}`);
});
