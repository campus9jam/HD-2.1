export function extractAtelierDataFromText(text: string) {
  const result: any = {
    outfitName: '',
    fabric: '',
    price: '',
    measurements: {
      bustChest: '',
      waist: '',
      hips: '',
      length: '',
      shoulder: '',
      sleeve: '',
      armhole: '',
      neck: '',
      thigh: '',
      knee: '',
      cuff: '',
      additional: ''
    }
  };

  // Basic regex extractions
  const outfitMatch = text.match(/(outfit|design|style):\s*([^\n,]+)/i);
  if (outfitMatch) result.outfitName = outfitMatch[2].trim();

  const fabricMatch = text.match(/(fabric|material):\s*([^\n,]+)/i);
  if (fabricMatch) result.fabric = fabricMatch[2].trim();

  const priceMatch = text.match(/(price|cost|amount):\s*(?:₦)?\s*([\d,]+)/i);
  if (priceMatch) result.price = priceMatch[2].replace(/,/g, '');

  // Measurement mappings (common tailor shorthand)
  const mPatterns: Record<string, RegExp[]> = {
    bustChest: [/bust:\s*([\d.]+)/i, /chest:\s*([\d.]+)/i, /b:\s*([\d.]+)/i, /c:\s*([\d.]+)/i],
    waist: [/waist:\s*([\d.]+)/i, /w:\s*([\d.]+)/i],
    hips: [/hips?:\s*([\d.]+)/i, /h:\s*([\d.]+)/i],
    length: [/length:\s*([\d.]+)/i, /l:\s*([\d.]+)/i],
    shoulder: [/shoulder:\s*([\d.]+)/i, /sh:\s*([\d.]+)/i],
    sleeve: [/sleeve:\s*([\d.]+)/i, /sl:\s*([\d.]+)/i],
    armhole: [/armhole:\s*([\d.]+)/i, /ah:\s*([\d.]+)/i],
    neck: [/neck:\s*([\d.]+)/i, /n:\s*([\d.]+)/i],
    thigh: [/thigh:\s*([\d.]+)/i, /t:\s*([\d.]+)/i],
    knee: [/knee:\s*([\d.]+)/i, /k:\s*([\d.]+)/i],
    cuff: [/cuff:\s*([\d.]+)/i, /cf:\s*([\d.]+)/i]
  };

  Object.entries(mPatterns).forEach(([key, patterns]) => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        result.measurements[key] = match[1].trim();
        break;
      }
    }
  });

  return result;
}

export function generateOrderReceiptHTML(order: any, client: any) {
  const date = new Date(order.createdAt).toLocaleDateString();
  const deposit = order.price * 0.6;
  const balance = order.price * 0.4;

  return `
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
          body { font-family: sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: bold; font-style: italic; color: #d4af37; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .label { font-weight: bold; text-transform: uppercase; font-size: 10px; color: #666; margin-bottom: 4px; letter-spacing: 1px; }
          .val { font-size: 14px; margin-bottom: 12px; }
          .measurements { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 30px; background: #fafafa; padding: 20px; border-radius: 12px; border: 1px solid #eee; }
          .m-item { border-bottom: 1px solid #eee; padding: 5px 0; }
          .payment-summary { margin-top: 30px; border-top: 2px dashed #eee; padding-top: 20px; }
          .p-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .total { font-size: 18px; font-weight: bold; color: #1a1a1a; margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; }
          .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 9px; font-weight: bold; text-transform: uppercase; margin-left: 10px; }
          .badge-paid { background: #d4af37; color: #ffffff; }
          .badge-unpaid { background: #eee; color: #999; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">House of Daraja Atelier</div>
          <p>Order Receipt // Protocol_${order.id || 'N/A'}</p>
        </div>
        
        <div class="grid">
          <div>
            <div class="label">Noble Customer</div>
            <div class="val">${client?.clientName || order.clientUsername}</div>
            <div class="label">Identity Node</div>
            <div class="val">${order.clientUsername}</div>
          </div>
          <div style="text-align: right;">
            <div class="label">Order Ref</div>
            <div class="val">#${order.id || 'TEMP'}</div>
            <div class="label">Phase / Deadline</div>
            <div class="val">${order.status} // ${order.deadline || 'TBD'}</div>
          </div>
        </div>

        <div style="margin-top: 30px;">
          <div class="label">Outfit Manifest</div>
          <div class="val" style="font-size: 18px; font-weight: bold; color: #d4af37;">${order.outfitName} (${order.outfitType})</div>
          <div class="label">Fabric Artifact</div>
          <div class="val">${order.fabric} ${order.serialNumber ? `[${order.serialNumber}]` : ''}</div>
        </div>

        <div class="payment-summary">
          <div class="label">Financial Synchronization</div>
          <div class="p-row">
            <span>60% Deposit Protocol ${order.depositPaid ? '<span class="badge badge-paid">PAID</span>' : '<span class="badge badge-unpaid">NOT PAID</span>'}</span>
            <span>₦${deposit.toLocaleString()}</span>
          </div>
          <div class="p-row">
            <span>40% Final Balance ${order.balancePaid ? '<span class="badge badge-paid">PAID</span>' : '<span class="badge badge-unpaid">NOT PAID</span>'}</span>
            <span>₦${balance.toLocaleString()}</span>
          </div>
          <div class="p-row total">
            <span>Master Investment</span>
            <span>₦${order.price.toLocaleString()}</span>
          </div>
        </div>

        <div class="measurements">
          ${Object.entries(order.measurements).map(([k, v]) => v ? `<div class="m-item"><div class="label">${k.replace(/([A-Z])/g, ' $1')}</div><div>${v}</div></div>` : '').join('')}
        </div>

        <div class="footer">
          <p>Crafted with precision & excellence</p>
          <p>Kano // Lagos // Zaria // London</p>
          <p style="margin-top: 10px; font-style: italic;">All fabrication is subject to House of Daraja Terms of Excellence.</p>
        </div>
      </body>
    </html>
  `;
}
