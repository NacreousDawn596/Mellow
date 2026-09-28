#!/usr/bin/env python3
"""Generate the Mellow PWA app icons (PNG) using only the Python standard
library. Produces a gothic purple rounded-square icon with a crescent moon
and pink sparkles."""

import math
import os
import struct
import zlib


def clamp(v):
    return max(0, min(255, int(v)))


def lerp(a, b, t):
    return a + (b - a) * t


def rounded_rect_alpha(x, y, size, radius):
    cx = cy = size / 2.0
    hw = size / 2.0 - radius
    qx = abs(x - cx) - hw
    qy = abs(y - cy) - hw
    if qx <= 0 and qy <= 0:
        return 1.0
    qx = max(qx, 0.0)
    qy = max(qy, 0.0)
    d = math.hypot(qx, qy)
    return max(0.0, 1.0 - (d - radius))


def in_circle(x, y, cx, cy, r):
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def make_icon(size, path):
    rows = []
    cx = cy = size / 2.0
    radius = size * 0.205

    # moon geometry (normalized to size)
    moon_c = (size * 0.50, size * 0.46)
    moon_r = size * 0.185
    cut_c = (size * 0.435, size * 0.41)
    cut_r = size * 0.175

    # sparkle centers (diamond, l1 radius)
    sparks = [(size * 0.70, size * 0.28, size * 0.075), (size * 0.34, size * 0.72, size * 0.05)]

    for y in range(size):
        row = bytearray()
        for x in range(size):
            mask = rounded_rect_alpha(x + 0.5, y + 0.5, size, radius)
            if mask <= 0:
                row += b"\x00\x00\x00\x00"
                continue

            # background radial-ish gradient: dark purple
            dx = (x - cx) / (size / 2.0)
            dy = (y - cy) / (size / 2.0)
            d = math.hypot(dx, dy)
            t = min(d, 1.0)
            # top-left lighter violet to dark
            br = clamp(lerp(42, 9, t))
            bg = clamp(lerp(20, 7, t))
            bb = clamp(lerp(85, 13, t))

            r, g, b = br, bg, bb

            # soft purple glow near top-center
            gd = math.hypot((x - size * 0.5) / size, (y - size * 0.35) / size)
            glow = max(0.0, 1.0 - gd / 0.6)
            r = clamp(r + 90 * glow * 0.5)
            g = clamp(g + 60 * glow * 0.5)
            b = clamp(b + 150 * glow * 0.5)

            # crescent moon (lavender)
            if in_circle(x + 0.5, y + 0.5, *moon_c, moon_r) and not in_circle(
                x + 0.5, y + 0.5, *cut_c, cut_r
            ):
                r, g, b = 196, 181, 253
            else:
                # sparkles (pink diamonds)
                for sx, sy, sr in sparks:
                    if abs(x - sx) + abs(y - sy) <= sr:
                        r, g, b = 232, 121, 249

            row += bytes((r, g, b, clamp(255 * mask)))
        rows.append(bytes(row))

    raw = b"".join(rows)

    def chunk(typ, data):
        c = struct.pack(">I", len(data)) + typ + data
        c += struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
        return c

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(raw, 9)
    png = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")

    with open(path, "wb") as f:
        f.write(png)
    print(f"wrote {path} ({size}x{size})")


if __name__ == "__main__":
    out_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "frontend",
        "public",
        "icons",
    )
    os.makedirs(out_dir, exist_ok=True)
    make_icon(512, os.path.join(out_dir, "icon-512.png"))
    make_icon(192, os.path.join(out_dir, "icon-192.png"))
