#!/usr/bin/env node
/**
 * Regenerates every derived brand asset from the supplied brand kit in logo/.
 *
 *   node scripts/brand-assets.mjs
 *
 * The kit ships three families, each pre-rendered at many sizes. Only the
 * largest export of each is read here; every size the app needs is resampled
 * from it, so all output stays on one master rather than mixing exports.
 *
 *   Horizontal  mark and wordmark side by side, ~3.8:1 — headers and footers
 *   Small       the bare CH mark, square — icons, favicons, avatars
 *   Large       mark with the wordmark set across it — unused, kept for reference
 *
 * Circle and Square icon variants differ only in safe-area padding. Square is
 * the one taken: it fills more of the frame, and the slots that want a circle
 * or a rounded rect (iOS, avatars) apply their own mask.
 *
 * Outputs:
 *
 *   frontend/public/logo.png              trimmed, transparent mark
 *   frontend/public/long-logo.png         trimmed, transparent horizontal lockup
 *   frontend/public/logo-mark.png         square mark, 512px, transparent
 *   frontend/src/app/icon.png             favicon        (Next file convention)
 *   frontend/src/app/apple-icon.png       touch icon on white
 *   frontend/src/app/opengraph-image.png  1200x630 social card
 *   frontend/src/app/twitter-image.png    same card
 *
 * Every kit file is exported on an opaque white background, so the shared step
 * is `unmatte`: it recovers an alpha channel by treating white as empty and
 * un-premultiplying the soft edges, which lets the marks sit on any surface --
 * without it the logo is a white box in dark mode.
 *
 * PNG encode/decode is written out longhand rather than pulled from npm -- the
 * repo root deliberately has no dependencies (see docs/implementation-plan.md,
 * decision D2), and this runs rarely enough not to need the speed.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
function decode(file) {
  const b = fs.readFileSync(file);
  let o = 8, w = 0, h = 0, ct = 6, idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), t = b.toString('ascii', o + 4, o + 8);
    if (t === 'IHDR') { w = b.readUInt32BE(o + 8); h = b.readUInt32BE(o + 12); ct = b[o + 17]; }
    if (t === 'IDAT') idat.push(b.subarray(o + 8, o + 8 + len));
    o += len + 12;
  }
  const ch = ct === 6 ? 4 : ct === 2 ? 3 : ct === 4 ? 2 : 1;
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * ch, out = Buffer.alloc(h * stride);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[p++], line = raw.subarray(p, p + stride); p += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? out[y * stride + x - ch] : 0, bb = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = (x >= ch && y > 0) ? out[(y - 1) * stride + x - ch] : 0;
      let v = line[x];
      if (ft === 1) v += a; else if (ft === 2) v += bb; else if (ft === 3) v += (a + bb) >> 1;
      else if (ft === 4) { const pp = a + bb - c, pa = Math.abs(pp - a), pb = Math.abs(pp - bb), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? bb : c); }
      out[y * stride + x] = v & 255;
    }
  }
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0, n = w * h; i < n; i++) {
    const s = i * ch, d = i * 4;
    if (ch >= 3) { rgba[d] = out[s]; rgba[d + 1] = out[s + 1]; rgba[d + 2] = out[s + 2]; rgba[d + 3] = ch === 4 ? out[s + 3] : 255; }
    else { rgba[d] = rgba[d + 1] = rgba[d + 2] = out[s]; rgba[d + 3] = ch === 2 ? out[s + 1] : 255; }
  }
  return { w, h, data: rgba };
}

const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc32(buf) { let c = -1; for (const byte of buf) c = CRC[(c ^ byte) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encode({ w, h, data }, path) {
  const stride = w * 4, raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(path, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
  return path;
}

const blank = (w, h, [r, g, b, a] = [0, 0, 0, 0]) => {
  const data = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) { data[i * 4] = r; data[i * 4 + 1] = g; data[i * 4 + 2] = b; data[i * 4 + 3] = a; }
  return { w, h, data };
};

function crop(img, x0, y0, cw, chh) {
  const out = blank(cw, chh);
  for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) {
    const s = ((y0 + y) * img.w + (x0 + x)) * 4, d = (y * cw + x) * 4;
    img.data.copy(out.data, d, s, s + 4);
  }
  return out;
}

/** Bilinear resample. */
function resize(img, nw, nh) {
  const out = blank(nw, nh);
  for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
    const sx = Math.min(img.w - 1.001, (x + 0.5) * img.w / nw - 0.5), sy = Math.min(img.h - 1.001, (y + 0.5) * img.h / nh - 0.5);
    const x0 = Math.max(0, Math.floor(sx)), y0 = Math.max(0, Math.floor(sy));
    const fx = sx - x0, fy = sy - y0, x1 = Math.min(img.w - 1, x0 + 1), y1 = Math.min(img.h - 1, y0 + 1);
    const d = (y * nw + x) * 4;
    for (let c = 0; c < 4; c++) {
      const p = (yy, xx) => img.data[(yy * img.w + xx) * 4 + c];
      out.data[d + c] = Math.round(
        p(y0, x0) * (1 - fx) * (1 - fy) + p(y0, x1) * fx * (1 - fy) + p(y1, x0) * (1 - fx) * fy + p(y1, x1) * fx * fy);
    }
  }
  return out;
}

/** Source-over composite of `src` onto `dst` at (dx, dy). */
function paste(dst, src, dx, dy) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const ty = dy + y, tx = dx + x;
    if (ty < 0 || tx < 0 || ty >= dst.h || tx >= dst.w) continue;
    const s = (y * src.w + x) * 4, d = (ty * dst.w + tx) * 4;
    const sa = src.data[s + 3] / 255;
    if (sa === 0) continue;
    const da = dst.data[d + 3] / 255, oa = sa + da * (1 - sa);
    for (let c = 0; c < 3; c++) dst.data[d + c] = Math.round((src.data[s + c] * sa + dst.data[d + c] * da * (1 - sa)) / oa);
    dst.data[d + 3] = Math.round(oa * 255);
  }
  return dst;
}

/** Drop a near-white background to transparent, keeping antialiased edges. */
function unmatte(img, threshold = 246) {
  const out = { w: img.w, h: img.h, data: Buffer.from(img.data) };
  for (let i = 0; i < img.w * img.h; i++) {
    const d = i * 4, r = out.data[d], g = out.data[d + 1], b = out.data[d + 2];
    const mn = Math.min(r, g, b);
    if (mn >= threshold) { out.data[d + 3] = 0; continue; }
    // Un-premultiply against white so soft edges keep their colour.
    const alpha = 255 - mn;
    // Scanning haze in the source art lands here; below ~10% it is noise, not an edge.
    if (alpha < 26) { out.data[d + 3] = 0; continue; }
    if (alpha < 250) {
      const a = alpha / 255;
      for (let c = 0; c < 3; c++) out.data[d + c] = Math.max(0, Math.min(255, Math.round((out.data[d + c] - 255 * (1 - a)) / a)));
      out.data[d + 3] = Math.round(alpha * (img.data[d + 3] / 255));
    }
  }
  return out;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(ROOT, "frontend", "public");
const APP = path.join(ROOT, "frontend", "src", "app");

/** Tight bounding box of everything that is not near-white. */
function contentBox(img, threshold = 232) {
  let minX = img.w, minY = img.h, maxX = -1, maxY = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const d = (y * img.w + x) * 4;
    if (img.data[d + 3] < 24) continue;
    if (Math.min(img.data[d], img.data[d + 1], img.data[d + 2]) >= threshold) continue;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Scale to fit inside (bw x bh), preserving aspect ratio. */
function fit(img, bw, bh) {
  const s = Math.min(bw / img.w, bh / img.h);
  return resize(img, Math.max(1, Math.round(img.w * s)), Math.max(1, Math.round(img.h * s)));
}

const KIT = path.join(ROOT, "logo");
const HORIZONTAL = path.join(KIT, "Horizontal", "1024x354 - HorizontalWordmark_CeonHubLogo.png");
const MARK = path.join(KIT, "Small", "1024x1024 - SmallIconSquare_CeonHubLogo.png");

for (const f of [HORIZONTAL, MARK]) {
  if (!fs.existsSync(f)) {
    console.error(`missing brand kit file: ${path.relative(ROOT, f)}`);
    process.exit(1);
  }
}

/** Decode, trim to the artwork, and drop the white matte. */
function clean(file) {
  const img = decode(file);
  const box = contentBox(img);
  return unmatte(crop(img, box.x, box.y, box.w, box.h));
}

const long = clean(HORIZONTAL);
encode(long, path.join(PUB, "long-logo.png"));

const mark = clean(MARK);
encode(mark, path.join(PUB, "logo.png"));

/** The mark centred on a padded square -- the shape every icon slot wants. */
function square(size, padRatio, bg) {
  const canvas = blank(size, size, bg);
  const inner = Math.round(size * (1 - padRatio * 2));
  const scaled = fit(mark, inner, inner);
  return paste(canvas, scaled, Math.round((size - scaled.w) / 2), Math.round((size - scaled.h) / 2));
}

encode(square(512, 0.08, [0, 0, 0, 0]), path.join(PUB, "logo-mark.png"));
encode(square(512, 0.08, [0, 0, 0, 0]), path.join(APP, "icon.png"));
// iOS masks its own rounded corners and renders transparency as black.
encode(square(180, 0.16, [255, 255, 255, 255]), path.join(APP, "apple-icon.png"));

// Social card: the horizontal lockup on white, over a rule in the logo gradient.
const OG_W = 1200, OG_H = 630;
const GREEN = [0x23, 0xe8, 0x37], ORANGE = [0xff, 0x91, 0x00];
const og = blank(OG_W, OG_H, [255, 255, 255, 255]);
for (let y = OG_H - 14; y < OG_H; y++) for (let x = 0; x < OG_W; x++) {
  const t = x / (OG_W - 1), d = (y * OG_W + x) * 4;
  for (let c = 0; c < 3; c++) og.data[d + c] = Math.round(GREEN[c] + (ORANGE[c] - GREEN[c]) * t);
  og.data[d + 3] = 255;
}
const lockup = fit(long, Math.round(OG_W * 0.62), Math.round(OG_H * 0.42));
paste(og, lockup, Math.round((OG_W - lockup.w) / 2), Math.round((OG_H - lockup.h) / 2) - 8);
encode(og, path.join(APP, "opengraph-image.png"));
encode(og, path.join(APP, "twitter-image.png"));

console.log(`brand assets written from ${path.relative(ROOT, KIT)}/
  ${path.relative(ROOT, PUB)}/long-logo.png   ${long.w}x${long.h}
  ${path.relative(ROOT, PUB)}/logo.png        ${mark.w}x${mark.h}
  ${path.relative(ROOT, PUB)}/logo-mark.png   512x512
  ${path.relative(ROOT, APP)}/icon.png        512x512
  ${path.relative(ROOT, APP)}/apple-icon.png  180x180
  ${path.relative(ROOT, APP)}/opengraph-image.png + twitter-image.png  ${OG_W}x${OG_H}`);
