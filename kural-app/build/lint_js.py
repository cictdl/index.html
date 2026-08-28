# -*- coding: utf-8 -*-
"""lint_js.py — a small structural check for app.js / sw.js.

There is no Node on this machine, so a real parser is not available. This walks the
source with a mode stack (code ⇄ template literal ⇄ `${` expression) that understands
line and block comments, quoted strings, nested template literals and regex literals,
and reports:

  • a quoted string that runs into a newline — exactly what an unescaped apostrophe
    inside a translated UI string produces ("your device's own voices"), the one real
    syntax break this project has hit;
  • an unterminated template literal, comment or string;
  • brackets that do not balance outside of strings.

Run:  py build/lint_js.py [file ...]      (defaults to app.js and sw.js)
Exit code 1 on any finding, so builds can gate on it.
"""
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[1]

NL = "\n"
BS = "\\"
QUOTES = "'" + '"'

# A '/' starts a regex when the previous significant character cannot end an expression.
def _regex_allowed(prev):
    if not prev:
        return True
    if prev in ")]}":
        return False
    if prev.isalnum() or prev in "_$":
        return False
    return True


def scan(src, name):
    errs = []
    i, n = 0, len(src)
    line = 1
    prev_sig = ""
    mode = "code"
    stack = []          # ('(' | '[' | '{' | '`' | '${', line)
    KEYWORD_END = ("return", "typeof", "case", "in", "of", "delete", "void",
                   "instanceof", "new", "do", "else", "yield", "await")

    def pos(ln):
        return name + ":" + str(ln)

    while i < n:
        c = src[i]

        # ── inside a template literal: only ` and ${ are structural ──────────
        if mode == "tmpl":
            if c == BS:
                if src[i + 1:i + 2] == NL:
                    line += 1
                i += 2
                continue
            if c == NL:
                line += 1; i += 1; continue
            if c == "`":
                if stack and stack[-1][0] == "`":
                    stack.pop()
                mode = "code"; prev_sig = "`"; i += 1
                continue
            if c == "$" and src[i + 1:i + 2] == "{":
                stack.append(("${", line)); mode = "code"; prev_sig = "{"; i += 2
                continue
            i += 1
            continue

        # ── code ─────────────────────────────────────────────────────────────
        if c == NL:
            line += 1; i += 1; continue

        if c == "/" and src[i + 1:i + 2] == "/":
            j = src.find(NL, i)
            i = n if j < 0 else j
            continue

        if c == "/" and src[i + 1:i + 2] == "*":
            j = src.find("*/", i + 2)
            if j < 0:
                errs.append(pos(line) + ": unterminated block comment")
                break
            line += src.count(NL, i, j)
            i = j + 2
            continue

        if c in QUOTES:
            q, start_line, j, closed = c, line, i + 1, False
            hit_nl = False
            while j < n:
                d = src[j]
                if d == BS:
                    j += 2; continue
                if d == NL:
                    hit_nl = True; break
                if d == q:
                    closed = True; break
                j += 1
            if hit_nl:
                errs.append(pos(start_line) + ": string opened with " + q +
                            " runs into a newline — an unescaped " + q + " inside the text?")
                i = j
                continue
            if not closed:
                errs.append(pos(start_line) + ": unterminated string")
                break
            i = j + 1; prev_sig = "'"
            continue

        if c == "`":
            stack.append(("`", line)); mode = "tmpl"; i += 1
            continue

        if c == "/":
            k = i - 1
            while k >= 0 and src[k] in " \t":
                k -= 1
            word = ""
            if k >= 0 and (src[k].isalnum() or src[k] in "_$"):
                w = k
                while w >= 0 and (src[w].isalnum() or src[w] in "_$"):
                    w -= 1
                word = src[w + 1:k + 1]
            if _regex_allowed(prev_sig) or word in KEYWORD_END:
                j, in_class, closed = i + 1, False, False
                while j < n:
                    d = src[j]
                    if d == BS:
                        j += 2; continue
                    if d == NL:
                        break
                    if d == "[":
                        in_class = True
                    elif d == "]":
                        in_class = False
                    elif d == "/" and not in_class:
                        closed = True; break
                    j += 1
                if closed:
                    i = j + 1; prev_sig = "/"
                    continue
            prev_sig = "/"; i += 1
            continue

        if c in "([{":
            stack.append((c, line))
        elif c in ")]}":
            if c == "}" and stack and stack[-1][0] == "${":
                stack.pop(); mode = "tmpl"; prev_sig = "}"; i += 1
                continue
            want = {")": "(", "]": "[", "}": "{"}[c]
            if not stack:
                errs.append(pos(line) + ": stray '" + c + "'")
            elif stack[-1][0] != want:
                o, ol = stack[-1]
                errs.append(pos(line) + ": '" + c + "' closes '" + o + "' opened at line " + str(ol))
                stack.pop()
            else:
                stack.pop()

        if not c.isspace():
            prev_sig = c
        i += 1

    if mode == "tmpl":
        errs.append(pos(stack[-1][1] if stack else line) + ": unterminated template literal")
    for o, ol in stack:
        errs.append(pos(ol) + ": '" + o + "' never closed")
    return errs


def main():
    files = sys.argv[1:] or [str(ROOT / "app.js"), str(ROOT / "sw.js")]
    bad = 0
    for f in files:
        p = Path(f)
        errs = scan(p.read_text(encoding="utf-8"), p.name)
        if errs:
            bad += len(errs)
            for e in errs:
                print("x " + e)
        else:
            print("ok " + p.name)
    if bad:
        print("\n" + str(bad) + " problem(s)")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
