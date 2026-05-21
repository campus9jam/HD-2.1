import https from 'https';

https.get('https://www.youtube.com/@HouseofDaraja', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const match = data.match(/"channelId":"([^"]+)"/);
    if (match) {
      console.log('CHANNEL_ID=' + match[1]);
    } else {
      console.log('No match found');
      // maybe look for <link rel="alternate" type="application/rss+xml" title="RSS" href="https://www.youtube.com/feeds/videos.xml?channel_id=UCXYZ">
      const match2 = data.match(/channel_id=([^"]+)"/);
      if (match2) console.log('CHANNEL_ID_2=' + match2[1]);
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
