// Compact MD5 for Gravatar URL generation (browser-compatible)
function md5(str) {
  function add(a, b) { return (a + b) & 0xFFFFFFFF }
  function rol(n, c) { return (n << c) | (n >>> (32 - c)) }

  const bytes = []
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if (code < 128) bytes.push(code)
    else if (code < 2048) bytes.push((code >> 6) | 192, (code & 63) | 128)
    else bytes.push((code >> 12) | 224, ((code >> 6) & 63) | 128, (code & 63) | 128)
  }
  const len8 = bytes.length
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)
  const len64 = len8 * 8
  for (let i = 0; i < 8; i++) bytes.push((len64 / Math.pow(2, i * 8)) & 0xFF)

  let [a, b, c, d] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476]
  const T = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0)
  const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21]

  for (let i = 0; i < bytes.length; i += 64) {
    const w = Array.from({ length: 16 }, (_, j) =>
      bytes[i+j*4] | (bytes[i+j*4+1] << 8) | (bytes[i+j*4+2] << 16) | (bytes[i+j*4+3] << 24))
    let [aa, bb, cc, dd] = [a, b, c, d]
    for (let j = 0; j < 64; j++) {
      let f, g
      if (j < 16)      { f = (bb & cc) | (~bb & dd); g = j }
      else if (j < 32) { f = (dd & bb) | (~dd & cc); g = (5*j+1) % 16 }
      else if (j < 48) { f = bb ^ cc ^ dd;            g = (3*j+5) % 16 }
      else             { f = cc ^ (bb | ~dd);          g = (7*j) % 16 }
      f = add(add(add(f, aa), w[g] >>> 0), T[j])
      aa = dd; dd = cc; cc = bb
      bb = add(bb, rol(f, S[j]))
    }
    a = add(a, aa); b = add(b, bb); c = add(c, cc); d = add(d, dd)
  }

  return [a, b, c, d].map(n => {
    const hex = []
    for (let i = 0; i < 4; i++) hex.push(((n >> (i*8)) & 0xFF).toString(16).padStart(2, '0'))
    return hex.join('')
  }).join('')
}

export function gravatarUrl(email, size = 40) {
  const hash = md5((email || '').toLowerCase().trim())
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`
}
