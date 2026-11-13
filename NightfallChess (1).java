import javax.imageio.ImageIO;
import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.SourceDataLine;
import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferInt;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.prefs.Preferences;
import java.util.stream.IntStream;

/**
 * NIGHTFALL CHESS - a 3D dark-fantasy chess game in plain Java (Swing only, no libraries, no asset files).
 *
 * Run:   java NightfallChess.java            (Java 11 or newer)
 *   or:  javac NightfallChess.java  then  java NightfallChess
 *   In Eclipse: new Java project, new class "NightfallChess" in the default package, paste, Run.
 *
 * Controls
 *   Click a piece, then a glowing square ......... move
 *   Drag the mouse ................................ rotate the camera
 *   Mouse wheel ................................... zoom
 *   W A S D / arrow keys .......................... roam around the world
 *   Space ......................................... fly back to the board
 *   V ............................................. switch cinematic / tactical view
 *   F ............................................. flip to the other side
 *   U undo   N menu / new game   K kill-cam on-off   T storm (follows game / always / never)
 *   M mute   Q quality   H help   P frame rate      Speaker button, top right: volume and music
 *
 * Music: the game plays a WAV (or AIFF / AU) file that you supply. Put one called music.wav beside the game,
 * or pick a file with the speaker button. Plain Java cannot read MP3, so convert the song to WAV first.
 *
 * Online: one player chooses "Host an online game" and reads out the address shown; the other chooses "Join".
 * Same Wi-Fi works straight away; across the internet the host's router must forward TCP port 47474.
 *
 * How the file is laid out (search for the ═══ banners):
 *   CHESS RULES ......... legal moves, check, castling, en passant, promotion
 *   COMPUTER OPPONENT ... the chess AI (alpha-beta search)
 *   SOUND ............... sound effects synthesized in code; music played from a file you supply
 *   ONLINE PLAY ......... the connection between two computers
 *   3D MODELS ........... the six pieces, built from outlines
 *   THE WORLD ........... terrain, castles, trees, and the moon-shadow maps
 *   THE GAME ............ animations for each piece, effects, camera, and the software 3D renderer
 *   WINDOW, INPUT & HUD . menu, mouse, keyboard, text
 */
public class NightfallChess extends JPanel {

    // ═══════════════════════════════════ CONSTANTS & SMALL HELPERS ═══════════════════════════════════

    static final int PAWN = 1, KNIGHT = 2, BISHOP = 3, ROOK = 4, QUEEN = 5, KING = 6;
    static final float PI = (float) Math.PI, TAU = PI * 2;
    static final float PS = 1.12f;                                   // piece size
    static final float[] MOON = unit(0.3182f, 0.3665f, 0.8743f);     // direction towards the moon
    static final float[] MR = unit(MOON[2], 0, -MOON[0]);            // "right" and "up" as seen from the moon
    static final float[] MU = {MOON[1] * MR[2] - MOON[2] * MR[1], MOON[2] * MR[0] - MOON[0] * MR[2], MOON[0] * MR[1] - MOON[1] * MR[0]};
    static final float MOON_RAD = 0.062f;                            // how big the moon looks (radians)
    static final float[] MOONC = {0.62f, 0.74f, 1.00f};              // moonlight colour
    static final float[] AMBC = {0.19f, 0.22f, 0.36f};               // night ambient colour
    static final float[] FIREC = {1.00f, 0.50f, 0.16f};              // brazier fire colour
    static final float[] ICE = {0.40f, 0.82f, 1.00f};                // White's magic
    static final float[] VIOLET = {0.86f, 0.30f, 1.00f};             // Black's magic
    static final int FOG = 0x1A1830;
    static final float[][] BRAZIERS = {{-5.1f, 1.5f, -5.1f}, {5.1f, 1.5f, -5.1f}, {-5.1f, 1.5f, 5.1f}, {5.1f, 1.5f, 5.1f}};
    /** Flattened hills the castles stand on: x, z, radius, height. */
    static final float[][] MOUNDS = {{0, 56, 21, 6}, {0, -56, 21, 5}, {-60, 26, 12, 9}, {60, -30, 11, 10}};
    /** Surface kinds, used to add texture and shadow to each pixel after it is drawn. */
    static final int M_NONE = 0, M_GROUND = 1, M_BRICK = 2, M_STONE = 3, M_WOOD = 4, M_ROOF = 5, M_GLOW = 6, M_PIECE = 7;

    /** Thirty graves beside the path: the first fifteen are for fallen White pieces, the rest for Black. */
    static final float[][] GRAVES = new float[30][];
    static { for (int i = 0; i < 30; i++) GRAVES[i] = new float[]{-9.2f - (i % 5) * 1.55f + (hash(i, 3) - .5f) * 0.4f, 13.8f + (i / 5) * 1.7f + (hash(i, 9) - .5f) * 0.4f}; }

    static float sin(float a) { return (float) Math.sin(a); }
    static float cos(float a) { return (float) Math.cos(a); }
    static float sqrt(float a) { return (float) Math.sqrt(a); }
    static float clamp(float v, float a, float b) { return v < a ? a : (v > b ? b : v); }
    static float lerp(float a, float b, float t) { return a + (b - a) * t; }
    static float smooth(float e0, float e1, float x) { float t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
    static float ease(float t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
    static float[] unit(float x, float y, float z) { float l = sqrt(x * x + y * y + z * z); return new float[]{x / l, y / l, z / l}; }

    static int pack(float r, float g, float b) {
        int ri = (int) r, gi = (int) g, bi = (int) b;
        if (ri < 0) ri = 0; else if (ri > 255) ri = 255;
        if (gi < 0) gi = 0; else if (gi > 255) gi = 255;
        if (bi < 0) bi = 0; else if (bi > 255) bi = 255;
        return (ri << 16) | (gi << 8) | bi;
    }
    static int mix(int a, int b, float t) {
        return pack(lerp((a >> 16) & 255, (b >> 16) & 255, t), lerp((a >> 8) & 255, (b >> 8) & 255, t), lerp(a & 255, b & 255, t));
    }
    static int shade(int c, float s) { return pack(((c >> 16) & 255) * s, ((c >> 8) & 255) * s, (c & 255) * s); }

    static float hash(int x, int y) {
        int h = x * 374761393 + y * 668265263;
        h = (h ^ (h >>> 13)) * 1274126177;
        h ^= h >>> 16;
        return (h & 0xffffff) / (float) 0x1000000;
    }
    static float vnoise(float x, float y) {
        int xi = (int) Math.floor(x), yi = (int) Math.floor(y);
        float fx = x - xi, fy = y - yi;
        fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
        return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), fx), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), fx), fy);
    }
    /** Fractal noise, roughly 0..1. */
    static float fbm(float x, float y, int oct) {
        float s = 0, a = 0.5f, tot = 0;
        for (int i = 0; i < oct; i++) { s += a * vnoise(x, y); tot += a; a *= 0.5f; x = x * 2.03f + 17.1f; y = y * 2.03f + 9.7f; }
        return s / tot;
    }

    /** Height of the ground at any point of the world. Flat around the board, hills further out, mountains at the rim. */
    static float terrainH(float x, float z) {
        float d = sqrt(x * x + z * z);
        float h = -1f + (fbm(x * 0.05f + 7.3f, z * 0.05f + 2.1f, 4) - 0.45f) * 15f * smooth(9, 40, d);
        h += smooth(72, 125, d) * (8 + 46 * fbm(x * 0.035f + 40, z * 0.035f + 11, 4));
        for (float[] m : MOUNDS) {
            float dx = x - m[0], dz = z - m[1];
            h = lerp(h, m[3], smooth(m[2] * 1.9f, m[2] * 0.95f, sqrt(dx * dx + dz * dz)));
        }
        return h;
    }

    // ═══════════════════════════════════════════ CHESS RULES ═══════════════════════════════════════════

    static final class Move {
        int from, to, promo, captureSq = -1;      // captureSq differs from 'to' only for en passant
        boolean castle, doublePush;
    }

    /** The complete rules of chess: legal moves, check, castling, en passant, promotion. */
    static final class Rules {
        final int[] b = new int[64];              // square = rank*8 + file; +type is White, -type is Black
        boolean white = true, wk = true, wq = true, bk = true, bq = true;
        int ep = -1;
        static final int[][] KN = {{1, 2}, {2, 1}, {2, -1}, {1, -2}, {-1, -2}, {-2, -1}, {-2, 1}, {-1, 2}};
        static final int[][] DIR = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, 1}, {1, -1}, {-1, 1}, {-1, -1}};

        Rules() { reset(); }
        private Rules(boolean blank) { }

        void reset() {
            Arrays.fill(b, 0);
            int[] back = {ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK};
            for (int f = 0; f < 8; f++) { b[f] = back[f]; b[8 + f] = PAWN; b[48 + f] = -PAWN; b[56 + f] = -back[f]; }
            white = true; wk = wq = bk = bq = true; ep = -1;
        }

        Rules copy() {
            Rules c = new Rules(true);
            System.arraycopy(b, 0, c.b, 0, 64);
            c.white = white; c.wk = wk; c.wq = wq; c.bk = bk; c.bq = bq; c.ep = ep;
            return c;
        }

        int kingSq(boolean w) {
            int k = w ? KING : -KING;
            for (int s = 0; s < 64; s++) if (b[s] == k) return s;
            return -1;
        }

        boolean attacked(int s, boolean byWhite) {
            int f = s & 7, r = s >> 3, sg = byWhite ? 1 : -1;
            int pr = r - sg;
            if (pr >= 0 && pr < 8) {
                if (f > 0 && b[pr * 8 + f - 1] == sg * PAWN) return true;
                if (f < 7 && b[pr * 8 + f + 1] == sg * PAWN) return true;
            }
            for (int[] d : KN) {
                int ff = f + d[0], rr = r + d[1];
                if (ff >= 0 && ff < 8 && rr >= 0 && rr < 8 && b[rr * 8 + ff] == sg * KNIGHT) return true;
            }
            for (int i = 0; i < 8; i++) {
                int[] d = DIR[i];
                int ff = f + d[0], rr = r + d[1];
                if (ff >= 0 && ff < 8 && rr >= 0 && rr < 8 && b[rr * 8 + ff] == sg * KING) return true;
                while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
                    int p = b[rr * 8 + ff];
                    if (p != 0) {
                        if (p == sg * QUEEN || p == sg * (i >= 4 ? BISHOP : ROOK)) return true;
                        break;
                    }
                    ff += d[0]; rr += d[1];
                }
            }
            return false;
        }

        boolean inCheck(boolean w) { int k = kingSq(w); return k >= 0 && attacked(k, !w); }

        private void add(List<Move> out, int from, int to) {
            Move m = new Move(); m.from = from; m.to = to;
            if (b[to] != 0) m.captureSq = to;
            out.add(m);
        }

        private void pawnMove(List<Move> out, int from, int to, int cap, boolean promo) {
            int[] kinds = promo ? new int[]{QUEEN, ROOK, BISHOP, KNIGHT} : new int[]{0};
            for (int k : kinds) { Move m = new Move(); m.from = from; m.to = to; m.captureSq = cap; m.promo = k; out.add(m); }
        }

        List<Move> pseudo() {
            List<Move> out = new ArrayList<>();
            int sg = white ? 1 : -1;
            for (int s = 0; s < 64; s++) {
                int p = b[s];
                if (p * sg <= 0) continue;
                int f = s & 7, r = s >> 3, t = Math.abs(p);
                if (t == PAWN) {
                    int r1 = r + sg;
                    if (r1 < 0 || r1 > 7) continue;
                    boolean promo = r1 == (white ? 7 : 0);
                    if (b[r1 * 8 + f] == 0) {
                        pawnMove(out, s, r1 * 8 + f, -1, promo);
                        if (r == (white ? 1 : 6) && b[(r + 2 * sg) * 8 + f] == 0) {
                            Move m = new Move(); m.from = s; m.to = (r + 2 * sg) * 8 + f; m.doublePush = true; out.add(m);
                        }
                    }
                    for (int df = -1; df <= 1; df += 2) {
                        int ff = f + df;
                        if (ff < 0 || ff > 7) continue;
                        int to = r1 * 8 + ff;
                        if (b[to] * sg < 0) pawnMove(out, s, to, to, promo);
                        else if (to == ep) pawnMove(out, s, to, r * 8 + ff, false);
                    }
                } else if (t == KNIGHT || t == KING) {
                    for (int[] k : (t == KNIGHT ? KN : DIR)) {
                        int ff = f + k[0], rr = r + k[1];
                        if (ff < 0 || ff > 7 || rr < 0 || rr > 7) continue;
                        if (b[rr * 8 + ff] * sg <= 0) add(out, s, rr * 8 + ff);
                    }
                } else {
                    int i0 = t == BISHOP ? 4 : 0, i1 = t == ROOK ? 4 : 8;
                    for (int i = i0; i < i1; i++) {
                        int ff = f + DIR[i][0], rr = r + DIR[i][1];
                        while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
                            int q = b[rr * 8 + ff];
                            if (q * sg > 0) break;
                            add(out, s, rr * 8 + ff);
                            if (q != 0) break;
                            ff += DIR[i][0]; rr += DIR[i][1];
                        }
                    }
                }
            }
            int base = white ? 0 : 56;
            if (b[base + 4] == sg * KING && !attacked(base + 4, !white)) {
                if ((white ? wk : bk) && b[base + 5] == 0 && b[base + 6] == 0 && b[base + 7] == sg * ROOK
                        && !attacked(base + 5, !white) && !attacked(base + 6, !white)) {
                    Move m = new Move(); m.from = base + 4; m.to = base + 6; m.castle = true; out.add(m);
                }
                if ((white ? wq : bq) && b[base + 1] == 0 && b[base + 2] == 0 && b[base + 3] == 0 && b[base] == sg * ROOK
                        && !attacked(base + 3, !white) && !attacked(base + 2, !white)) {
                    Move m = new Move(); m.from = base + 4; m.to = base + 2; m.castle = true; out.add(m);
                }
            }
            return out;
        }

        List<Move> legal() {
            List<Move> out = new ArrayList<>();
            for (Move m : pseudo()) {
                Rules c = copy();
                c.make(m);
                if (!c.inCheck(white)) out.add(m);
            }
            return out;
        }

        void make(Move m) {
            int p = b[m.from], sg = p > 0 ? 1 : -1, t = Math.abs(p);
            if (m.captureSq >= 0) b[m.captureSq] = 0;
            b[m.to] = m.promo != 0 ? sg * m.promo : p;
            b[m.from] = 0;
            if (m.castle) {
                int r = m.from >> 3;
                if ((m.to & 7) == 6) { b[r * 8 + 5] = b[r * 8 + 7]; b[r * 8 + 7] = 0; }
                else { b[r * 8 + 3] = b[r * 8]; b[r * 8] = 0; }
            }
            ep = m.doublePush ? (m.from + m.to) / 2 : -1;
            if (t == KING) { if (sg > 0) wk = wq = false; else bk = bq = false; }
            if (m.from == 0 || m.to == 0) wq = false;
            if (m.from == 7 || m.to == 7) wk = false;
            if (m.from == 56 || m.to == 56) bq = false;
            if (m.from == 63 || m.to == 63) bk = false;
            white = !white;
        }

        /** A number that identifies this exact position (used to spot repetition). */
        long key() {
            long h = 1469598103934665603L;
            for (int p : b) h = (h ^ (p + 7)) * 1099511628211L;
            h = (h ^ (white ? 1 : 2)) * 1099511628211L;
            h = (h ^ ((wk ? 1 : 0) | (wq ? 2 : 0) | (bk ? 4 : 0) | (bq ? 8 : 0))) * 1099511628211L;
            return (h ^ (ep + 3)) * 1099511628211L;
        }

        boolean insufficient() {
            int minor = 0;
            for (int p : b) {
                int t = Math.abs(p);
                if (t == PAWN || t == ROOK || t == QUEEN) return false;
                if (t == KNIGHT || t == BISHOP) minor++;
            }
            return minor <= 1;
        }

        long perft(int depth) {
            if (depth == 0) return 1;
            long n = 0;
            for (Move m : legal()) { Rules c = copy(); c.make(m); n += c.perft(depth - 1); }
            return n;
        }
    }

    // ═══════════════════════════════════════ COMPUTER OPPONENT ═══════════════════════════════════════

    /**
     * The chess AI. It looks ahead a few moves (alpha-beta search), always finishes capture sequences
     * before judging a position, and scores positions by material and by where the pieces stand.
     * Level 1 = easy (shallow and sometimes careless), 2 = normal, 3 = hard (thinks longest).
     */
    static final class Brain {
        static final int MATE = 100000;
        static final int[] VAL = {0, 100, 320, 330, 500, 900, 0};
        /** Piece-square tables, written from White's side with the far rank first. Index 7 is the king in the endgame. */
        static final int[][] PST = {null,
                {0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5,
                        0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0},
                {-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30,
                        -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50},
                {-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10,
                        -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20},
                {0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
                        -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0},
                {-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5,
                        0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20},
                {-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30,
                        -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20},
                {-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30,
                        -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50}};
        volatile boolean stop;
        long deadline, nodes;

        /** Picks a move for the side to play. 'seen' holds earlier positions of this game so the AI avoids repeating them. */
        Move choose(Rules root, int level, Set<Long> seen, Random rnd) {
            int maxDepth = level == 1 ? 2 : (level == 2 ? 4 : 6);
            deadline = System.currentTimeMillis() + (level == 1 ? 500 : (level == 2 ? 1500 : 2800));
            stop = false; nodes = 0;
            List<Move> moves = root.legal();
            if (moves.isEmpty()) return null;
            order(root, moves);
            Move best = moves.get(0);
            int[] scores = new int[moves.size()];
            for (int d = 1; d <= maxDepth; d++) {
                int alpha = -MATE * 2, bestScore = -MATE * 2;
                Move bestD = null;
                int[] sc = new int[moves.size()];
                for (int i = 0; i < moves.size() && !stop; i++) {
                    Rules c = root.copy();
                    c.make(moves.get(i));
                    // the easy level searches every move fully so that it can pick among several reasonable ones
                    int s = -search(c, d - 1, -MATE * 2, level == 1 ? MATE * 2 : -alpha, 1);
                    if (stop) break;
                    if (seen.contains(c.key()) && s > -50) s -= 45;
                    sc[i] = s;
                    if (s > bestScore) { bestScore = s; bestD = moves.get(i); }
                    if (s > alpha) alpha = s;
                }
                if (stop) break;                                               // out of time: keep the last finished answer
                best = bestD; scores = sc;
                int bi = moves.indexOf(best);                                  // try the best move first next round
                moves.add(0, moves.remove(bi));
                int bs = scores[bi];
                System.arraycopy(scores, 0, scores, 1, bi);
                scores[0] = bs;
                if (bestScore > MATE - 200) break;
            }
            if (level == 1) {
                if (rnd.nextFloat() < 0.10f) return moves.get(rnd.nextInt(moves.size()));
                List<Move> ok = new ArrayList<>();
                for (int i = 0; i < moves.size(); i++) if (scores[i] >= scores[0] - 70) ok.add(moves.get(i));
                return ok.get(rnd.nextInt(ok.size()));
            }
            return best;
        }

        /** Captures first, biggest victim with the smallest attacker. */
        void order(Rules r, List<Move> ms) {
            final int[] b = r.b;
            ms.sort((x, y) -> rank(b, y) - rank(b, x));
        }
        static int rank(int[] b, Move m) {
            int s = m.promo != 0 ? 800 : 0;
            if (m.captureSq >= 0) s += 10 * VAL[Math.abs(b[m.captureSq])] - VAL[Math.abs(b[m.from])] / 10 + 1000;
            return s;
        }

        int search(Rules r, int depth, int alpha, int beta, int ply) {
            if ((++nodes & 1023) == 0 && System.currentTimeMillis() > deadline) stop = true;
            if (stop) return 0;
            if (depth <= 0) return quiesce(r, alpha, beta, 0);
            List<Move> ms = r.pseudo();
            order(r, ms);
            boolean any = false;
            for (Move m : ms) {
                Rules c = r.copy();
                c.make(m);
                if (c.inCheck(r.white)) continue;                              // illegal: leaves own king in check
                any = true;
                int s = -search(c, depth - 1, -beta, -alpha, ply + 1);
                if (stop) return 0;
                if (s > alpha) { alpha = s; if (alpha >= beta) break; }
            }
            if (!any) return r.inCheck(r.white) ? -MATE + ply : 0;             // checkmate or stalemate
            return alpha;
        }

        /** Keep going through captures so a position is never judged in the middle of an exchange. */
        int quiesce(Rules r, int alpha, int beta, int qd) {
            int stand = eval(r);
            if (stand >= beta) return beta;
            if (stand > alpha) alpha = stand;
            if (qd >= 6) return alpha;
            List<Move> ms = r.pseudo();
            ms.removeIf(m -> m.captureSq < 0 && m.promo == 0);
            order(r, ms);
            for (Move m : ms) {
                Rules c = r.copy();
                c.make(m);
                if (c.inCheck(r.white)) continue;
                int s = -quiesce(c, -beta, -alpha, qd + 1);
                if (s > alpha) { alpha = s; if (alpha >= beta) break; }
            }
            return alpha;
        }

        /** Score of a position from the point of view of the side to move. */
        int eval(Rules r) {
            int s = 0, npm = 0, wk = 4, bk = 60, mat = 0;
            for (int q = 0; q < 64; q++) {
                int p = r.b[q];
                if (p == 0) continue;
                int t = Math.abs(p);
                if (t == KING) { if (p > 0) wk = q; else bk = q; continue; }
                int v = VAL[t] + PST[t][p > 0 ? (7 - (q >> 3)) * 8 + (q & 7) : q];
                s += p > 0 ? v : -v;
                mat += p > 0 ? VAL[t] : -VAL[t];
                if (t != PAWN) npm += VAL[t];
            }
            int[] kt = npm <= 2600 ? PST[7] : PST[6];
            s += kt[(7 - (wk >> 3)) * 8 + (wk & 7)] - kt[bk];
            if (npm <= 2600 && Math.abs(mat) > 400) {                          // winning endgame: drive the lone king to the edge
                int loser = mat > 0 ? bk : wk;
                int cd = Math.max(Math.abs((loser & 7) * 2 - 7), Math.abs((loser >> 3) * 2 - 7));
                int kd = Math.abs((wk & 7) - (bk & 7)) + Math.abs((wk >> 3) - (bk >> 3));
                int bonus = 9 * cd + 5 * (14 - kd);
                s += mat > 0 ? bonus : -bonus;
            }
            return r.white ? s : -s;
        }
    }

    // ═══════════════════════════════════════════════ SOUND ═══════════════════════════════════════════════

    /**
     * Sound effects are made here from sine waves and filtered noise, softened, given a little hall echo, and mixed by one
     * background thread. Music is different: the game plays a music FILE that you supply (see loadMusic).
     * Two volumes: sfxVol for effects and weather, musicVol for the music. If there is no sound output the game stays silent.
     */
    static final class Audio implements Runnable {
        static final int RATE = 44100;
        static final int SELECT = 0, TAP = 1, THUD = 2, SLIDE = 3, WHOOSH = 4, CLOP = 5, CHARGE = 6, ZAP = 7, CANNON = 8, EXPLODE = 9,
                SWORD = 10, STAB = 11, STOMP = 12, ORB = 13, TELEPORT = 14, CHECK = 15, MATE = 16, PROMOTE = 17, HOWL = 18, CLICK = 19,
                THUNDER = 20, RUMBLE = 21, NUM = 22;
        final float[][] bank = new float[NUM][];
        final float[] ambient, rainLoop;
        static final int VOICES = 28;
        final float[][] vBuf = new float[VOICES][];
        final double[] vPos = new double[VOICES], vRate = new double[VOICES];
        final float[] vL = new float[VOICES], vR = new float[VOICES];
        int ambPos, rainPos;
        float ambGain, rainGain, musGain;
        volatile float sfxVol = 0.4f, musicVol = 0.6f, rain;         // rain = how hard it is raining, 0..1
        volatile boolean mute;
        boolean ok;
        SourceDataLine line;
        // music: the whole file, decoded to 16-bit stereo
        volatile short[] music; volatile float musicRate = RATE; double musicPos;
        volatile String musicName, musicMsg;

        Audio(boolean openLine) {
            Random r = new Random(11);
            for (int i = 0; i < NUM; i++) {
                float[] o = make(i, r);
                boolean dry = i == SELECT || i == CLICK || i == TAP || i == SLIDE;
                bank[i] = norm(dry ? soften(o, 5000) : hall(soften(o, 6500), 0.24f, 0.8f), i == SELECT || i == CLICK ? 0.3f : 0.6f);
            }
            ambient = makeAmbient(r);
            rainLoop = makeRain(r);
            if (!openLine) return;
            try {
                AudioFormat fmt = new AudioFormat(RATE, 16, 2, true, false);
                line = AudioSystem.getSourceDataLine(fmt);
                line.open(fmt, 8192);
                line.start();
                ok = true;
                Thread t = new Thread(this, "nightfall-audio");
                t.setDaemon(true);
                t.start();
            } catch (Throwable e) {
                ok = false;                                                    // no sound device: carry on silently
            }
        }

        // ---- building blocks ----
        static float[] buf(float secs) { return new float[(int) (secs * RATE)]; }

        /** A tone sliding from f0 to f1 that fades out; 'decay' is how fast it dies. */
        static void tone(float[] o, float at, float dur, float f0, float f1, float amp, float decay) {
            int s0 = (int) (at * RATE), n = Math.min(o.length - s0, (int) (dur * RATE));
            double ph = 0;
            for (int i = 0; i < n; i++) {
                float t = i / (float) RATE, u = i / (float) n;
                ph += TAU * f0 * Math.pow(f1 / f0, u) / RATE;
                float env = (float) Math.exp(-decay * t) * Math.min(1, i / 160f) * Math.min(1, (n - i) / 300f);
                o[s0 + i] += amp * env * (float) Math.sin(ph);
            }
        }

        /** Hiss or rumble: noise kept between a low cut (hp) and a high cut that slides from lp0 to lp1. */
        static void noise(float[] o, Random r, float at, float dur, float amp, float decay, float lp0, float lp1, float hp) {
            int s0 = (int) (at * RATE), n = Math.min(o.length - s0, (int) (dur * RATE));
            float lp = 0, hs = 0, ah = 1 - (float) Math.exp(-TAU * hp / RATE);
            for (int i = 0; i < n; i++) {
                float t = i / (float) RATE, u = i / (float) n;
                float a = 1 - (float) Math.exp(-TAU * lp0 * Math.pow(lp1 / lp0, u) / RATE);
                lp += a * (r.nextFloat() * 2 - 1 - lp);
                hs += ah * (lp - hs);
                float env = (float) Math.exp(-decay * t) * Math.min(1, i / 120f) * Math.min(1, (n - i) / 300f);
                o[s0 + i] += amp * env * (lp - hs) * 3;
            }
        }

        static void echo(float[] o, float delay, float fb) {
            int d = (int) (delay * RATE);
            for (int i = d; i < o.length; i++) o[i] += o[i - d] * fb;
        }

        static float[] norm(float[] o, float peak) {
            float m = 1e-6f;
            for (float v : o) m = Math.max(m, Math.abs(v));
            for (int i = 0; i < o.length; i++) o[i] *= peak / m;
            return o;
        }

        /** Takes the harsh top off a sound. */
        static float[] soften(float[] o, float cutoff) {
            float a = 1 - (float) Math.exp(-TAU * cutoff / RATE), y = 0;
            for (int i = 0; i < o.length; i++) { y += a * (o[i] - y); o[i] = y; }
            return o;
        }

        /** A small stone-hall reverb, so effects sit in the scene instead of sounding dry and electronic. */
        static float[] hall(float[] dry, float wet, float tail) {
            int n = dry.length + (int) (tail * RATE);
            float[] out = Arrays.copyOf(dry, n), acc = new float[n];
            int[] combs = {1557, 1617, 1491, 1422, 1277};
            for (int d : combs) {
                float[] b = new float[d]; int p = 0; float lp = 0;
                for (int i = 0; i < n; i++) {
                    float y = b[p];
                    lp += 0.35f * (y - lp);
                    b[p] = (i < dry.length ? dry[i] : 0) + lp * 0.80f;
                    if (++p == d) p = 0;
                    acc[i] += y;
                }
            }
            int[] passes = {225, 556};
            for (int d : passes) {
                float[] b = new float[d]; int p = 0;
                for (int i = 0; i < n; i++) {
                    float bo = b[p], y = -0.5f * acc[i] + bo;
                    b[p] = acc[i] + 0.5f * y;
                    if (++p == d) p = 0;
                    acc[i] = y;
                }
            }
            int fade = RATE / 12;
            for (int i = 0; i < n; i++) out[i] = (out[i] + wet * acc[i] / combs.length) * Math.min(1, (n - i) / (float) fade);
            return out;
        }

        static void bell(float[] o, float at, float f, float amp, float len) {
            float[] part = {1, 2.0f, 3.01f, 4.2f, 5.43f, 6.8f}, am = {1, 0.6f, 0.4f, 0.25f, 0.18f, 0.1f};
            for (int k = 0; k < part.length; k++) tone(o, at, len, f * part[k], f * part[k], amp * am[k], (1.6f + k * 1.3f) / len * 1.6f);
        }

        /** Builds one of the sound effects. */
        static float[] make(int id, Random r) {
            float[] o;
            switch (id) {
                case SELECT: o = buf(0.10f); tone(o, 0, 0.10f, 640, 520, 0.6f, 40); return o;
                case CLICK: o = buf(0.06f); noise(o, r, 0, 0.06f, 1, 110, 4000, 2000, 900); tone(o, 0, 0.05f, 500, 380, 0.5f, 70); return o;
                case TAP: o = buf(0.16f); tone(o, 0, 0.16f, 190, 110, 0.7f, 36); noise(o, r, 0, 0.1f, 0.5f, 80, 3000, 1000, 300); return o;
                case THUD: o = buf(0.34f); tone(o, 0, 0.34f, 98, 46, 1, 15); noise(o, r, 0, 0.2f, 0.5f, 50, 1700, 380, 70); return o;
                case SLIDE: {                                                  // stone grinding over stone
                    o = buf(0.8f);
                    noise(o, r, 0, 0.8f, 1, 1.6f, 1300, 700, 220);
                    float grit = 0;
                    for (int i = 0; i < o.length; i++) {
                        grit += 0.004f * (r.nextFloat() - grit);
                        float u = i / (float) o.length;
                        o[i] *= (0.35f + 1.3f * grit) * Math.min(1, u * 6) * Math.min(1, (1 - u) * 5);
                    }
                    tone(o, 0, 0.8f, 62, 55, 0.05f, 1);
                    return o;
                }
                case WHOOSH: {
                    o = buf(0.55f);
                    float lp = 0, hs = 0;
                    for (int i = 0; i < o.length; i++) {
                        float u = i / (float) o.length, fc = 400 + 1800 * sin(PI * u), a = 1 - (float) Math.exp(-TAU * fc / RATE);
                        lp += a * (r.nextFloat() * 2 - 1 - lp); hs += 0.05f * (lp - hs);
                        o[i] = (lp - hs) * sin(PI * u) * sin(PI * u);
                    }
                    return o;
                }
                case CLOP: {                                                   // three hoof beats
                    o = buf(0.36f);
                    float[] at = {0, 0.11f, 0.2f};
                    for (float t0 : at) { tone(o, t0, 0.09f, 820, 560, 0.6f, 60); tone(o, t0, 0.06f, 1500, 1300, 0.2f, 85); noise(o, r, t0, 0.05f, 0.45f, 130, 3500, 1800, 600); }
                    return o;
                }
                case CHARGE: {                                                 // magic gathering: a rising hum
                    o = buf(0.6f);
                    double ph = 0, ph2 = 0;
                    for (int i = 0; i < o.length; i++) {
                        float u = i / (float) o.length, f = 150 * (float) Math.pow(3.2, u);
                        ph += TAU * f / RATE; ph2 += TAU * f * 1.5 / RATE;
                        float trem = 0.75f + 0.25f * sin(TAU * 11 * i / RATE);
                        o[i] = u * u * trem * ((float) Math.sin(ph) * 0.6f + (float) Math.sin(ph2) * 0.25f) * Math.min(1, (1 - u) * 30);
                    }
                    return o;
                }
                case ZAP: {                                                    // crackling beam
                    o = buf(0.5f);
                    double ph = 0, pm = 0;
                    for (int i = 0; i < o.length; i++) {
                        float u = i / (float) o.length, f = 1300 * (float) Math.pow(0.16, u);
                        pm += TAU * 71 / RATE;
                        ph += TAU * f / RATE;
                        o[i] = (float) Math.sin(ph + 2.2 * Math.sin(pm)) * (float) Math.exp(-u * 4.5f) * Math.min(1, i / 60f) * 0.7f;
                    }
                    noise(o, r, 0, 0.5f, 0.6f, 7, 5000, 1500, 700);
                    return o;
                }
                case CANNON: o = buf(1.1f); tone(o, 0, 1.0f, 125, 34, 1, 5); noise(o, r, 0, 0.9f, 1.1f, 8, 4200, 260, 40); echo(o, 0.13f, 0.3f); return o;
                case EXPLODE: {                                                // a piece shattering
                    o = buf(1.7f);
                    noise(o, r, 0, 1.3f, 1, 4.5f, 5500, 230, 60);
                    tone(o, 0, 0.9f, 88, 30, 0.9f, 4);
                    for (int k = 0; k < 14; k++) { float f = 1800 + r.nextFloat() * 3200; tone(o, 0.04f + r.nextFloat() * 0.75f, 0.2f, f, f * 0.97f, 0.08f, 26); }
                    return o;
                }
                case SWORD: {                                                  // ringing steel
                    o = buf(0.8f);
                    float[] part = {1, 1.47f, 2.09f, 2.56f, 3.11f};
                    for (int k = 0; k < part.length; k++) tone(o, 0.03f, 0.75f, 1500 * part[k], 1492 * part[k], 0.5f / (1 + k * 0.7f), 6 + k * 1.6f);
                    noise(o, r, 0, 0.2f, 0.8f, 22, 6000, 2500, 1500);
                    return o;
                }
                case STAB: o = buf(0.28f); noise(o, r, 0, 0.12f, 1, 30, 5000, 2000, 1200); tone(o, 0.07f, 0.2f, 290, 120, 0.8f, 28); return o;
                case STOMP: o = buf(0.85f); tone(o, 0, 0.8f, 72, 30, 1, 6.5f); noise(o, r, 0, 0.6f, 0.9f, 13, 2400, 190, 35); return o;
                case ORB: o = buf(0.34f); tone(o, 0, 0.34f, 520, 1040, 0.5f, 9); tone(o, 0, 0.34f, 780, 1560, 0.25f, 9); return o;
                case TELEPORT: {
                    o = buf(0.75f);
                    double ph = 0;
                    for (int i = 0; i < o.length * 0.5f; i++) {
                        float u = i / (o.length * 0.5f);
                        ph += TAU * 220 * Math.pow(4, u) / RATE;
                        o[i] = (float) Math.sin(ph) * u * u * 0.5f * Math.min(1, (1 - u) * 25);
                    }
                    noise(o, r, 0, 0.45f, 0.4f, 3, 1200, 4000, 500);
                    bell(o, 0.36f, 1046.5f, 0.45f, 0.38f);
                    return o;
                }
                case CHECK: o = buf(1.7f); bell(o, 0, 440, 0.7f, 1.3f); bell(o, 0.3f, 329.6f, 0.7f, 1.4f); return o;
                case MATE: {                                                   // a deep gong
                    o = buf(3.4f);
                    float[] part = {1, 1.52f, 2.41f, 3.3f, 4.71f, 6.1f};
                    for (int k = 0; k < part.length; k++) tone(o, 0, 3.3f, 98 * part[k], 97.4f * part[k], 0.8f / (1 + k * 0.6f), 0.9f + k * 0.45f);
                    noise(o, r, 0, 1.4f, 0.35f, 3, 900, 150, 40);
                    return o;
                }
                case PROMOTE: {
                    o = buf(1.2f);
                    float[] f = {392, 493.9f, 587.3f, 784};
                    for (int k = 0; k < 4; k++) bell(o, k * 0.11f, f[k], 0.55f, 0.8f);
                    return o;
                }
                case HOWL: {                                                   // a wolf, far away
                    o = buf(3.4f);
                    double ph = 0;
                    int n = (int) (3.2f * RATE);
                    for (int i = 0; i < n; i++) {
                        float t = i / (float) RATE;
                        float f = t < 0.6f ? lerp(285, 465, ease(t / 0.6f)) : (t < 2.3f ? 465 + 6 * sin(TAU * 5.2f * t) : lerp(465, 320, ease((t - 2.3f) / 0.9f)));
                        ph += TAU * f / RATE;
                        float env = Math.min(1, t / 0.45f) * Math.min(1, (3.2f - t) / 1.0f);
                        o[i] = env * ((float) Math.sin(ph) * 0.6f + (float) Math.sin(ph * 2) * 0.2f + (float) Math.sin(ph * 3) * 0.07f);
                    }
                    echo(o, 0.31f, 0.4f);
                    return o;
                }
                case THUNDER: {                                                // a crack, then a long rolling rumble
                    o = buf(5.0f);
                    noise(o, r, 0, 0.25f, 1.2f, 14, 5000, 900, 200);
                    for (int k = 0; k < 7; k++) noise(o, r, 0.05f + k * 0.42f + r.nextFloat() * 0.3f, 1.6f, 0.9f / (1 + k * 0.35f), 2.6f, 500 - k * 40, 90, 25);
                    tone(o, 0, 3.5f, 52, 34, 0.5f, 1.1f);
                    return o;
                }
                case RUMBLE: {                                                 // a castle coming down
                    o = buf(7.0f);
                    noise(o, r, 0, 7f, 1, 0.25f, 420, 120, 25);
                    float grit = 0;
                    for (int i = 0; i < o.length; i++) {
                        grit += 0.0015f * (r.nextFloat() - grit);
                        float u = i / (float) o.length;
                        o[i] *= (0.3f + 1.6f * grit) * Math.min(1, u * 4) * Math.min(1, (1 - u) * 2.5f);
                    }
                    for (int k = 0; k < 40; k++) { float t0 = 0.3f + r.nextFloat() * 5.5f, f = 90 + r.nextFloat() * 160; tone(o, t0, 0.3f, f, f * 0.6f, 0.25f, 16); noise(o, r, t0, 0.12f, 0.2f, 40, 2200, 600, 200); }
                    return o;
                }
                default: return buf(0.05f);
            }
        }

        /** Twelve seconds of night that loop without a seam: soft wind in gusts and a low drone. */
        static float[] makeAmbient(Random r) {
            int L = RATE * 12, X = RATE;
            float[] o = new float[L + X];
            float lp1 = 0, lp2 = 0;
            for (int i = 0; i < L + X; i++) {
                float t = i / (float) L, x = r.nextFloat() * 2 - 1;
                lp1 += 0.03f * (x - lp1);
                lp2 += 0.10f * (x - lp2);
                float g1 = 0.55f + 0.45f * sin(TAU * 2 * t + 1.3f), g2 = 0.5f + 0.5f * sin(TAU * 3 * t + 4);
                o[i] = lp1 * 3.4f * g1 + (lp2 - lp1) * 0.4f * g1 * g2 + 0.04f * (float) Math.sin(TAU * 55.0 * i / RATE);
            }
            for (int i = 0; i < X; i++) { float w = i / (float) X; o[i] = o[i] * w + o[L + i] * (1 - w); }
            return norm(Arrays.copyOf(o, L), 0.5f);
        }

        /** Six seconds of steady rain that loop without a seam. */
        static float[] makeRain(Random r) {
            int L = RATE * 6, X = RATE / 2;
            float[] o = new float[L + X];
            float lp = 0, hs = 0;
            for (int i = 0; i < L + X; i++) {
                lp += 0.45f * (r.nextFloat() * 2 - 1 - lp);
                hs += 0.12f * (lp - hs);
                o[i] = lp - hs;
            }
            for (int k = 0; k < 500; k++) {                                    // individual drops
                int at = r.nextInt(L - 400), len = 60 + r.nextInt(200);
                float amp = 0.1f + 0.25f * r.nextFloat(), last = 0;
                for (int i = 0; i < len; i++) { float x = r.nextFloat() * 2 - 1; o[at + i] += amp * (x - last) * (float) Math.exp(-i * 8f / len); last = x; }
            }
            for (int i = 0; i < X; i++) { float w = i / (float) X; o[i] = o[i] * w + o[L + i] * (1 - w); }
            return norm(soften(Arrays.copyOf(o, L), 5000), 0.5f);
        }

        // ---- music from a file ----
        /**
         * Loads a music file and loops it. Plain Java reads WAV, AIFF and AU files (not MP3), so a song has to be saved
         * or converted to WAV first. The file is read on its own thread; the game carries on meanwhile.
         */
        void loadMusic(final File f) {
            musicMsg = "Loading " + f.getName() + "…";
            Thread t = new Thread(() -> {
                try {
                    AudioInputStream src = AudioSystem.getAudioInputStream(f);
                    AudioFormat sf = src.getFormat();
                    int ch = sf.getChannels();
                    AudioFormat pf = new AudioFormat(AudioFormat.Encoding.PCM_SIGNED, sf.getSampleRate(), 16, ch, ch * 2, sf.getSampleRate(), false);
                    AudioInputStream pcm = AudioSystem.getAudioInputStream(pf, src);
                    ByteArrayOutputStream bo = new ByteArrayOutputStream(1 << 22);
                    byte[] b = new byte[1 << 16];
                    int got; long total = 0;
                    while ((got = pcm.read(b)) > 0 && total < 500_000_000L) { bo.write(b, 0, got); total += got; }
                    pcm.close();
                    byte[] d = bo.toByteArray();
                    int frames = d.length / (2 * ch);
                    short[] m = new short[frames * 2];
                    for (int i = 0; i < frames; i++) {
                        int o = i * 2 * ch;
                        short l = (short) ((d[o] & 255) | (d[o + 1] << 8)), rr = ch > 1 ? (short) ((d[o + 2] & 255) | (d[o + 3] << 8)) : l;
                        m[i * 2] = l; m[i * 2 + 1] = rr;
                    }
                    if (frames < 100) throw new java.io.IOException("empty file");
                    synchronized (this) { musicRate = sf.getSampleRate(); musicPos = 0; music = m; }
                    musicName = f.getName();
                    musicMsg = null;
                } catch (javax.sound.sampled.UnsupportedAudioFileException e) {
                    musicMsg = "Can't play " + f.getName() + ": Java only reads WAV, AIFF or AU. Convert the song to WAV.";
                } catch (Throwable e) {
                    musicMsg = "Couldn't load " + f.getName();
                }
            }, "nightfall-music");
            t.setDaemon(true);
            t.start();
        }

        // ---- playing ----
        /** Start a sound. pan: -1 left .. +1 right. pitch: 1 = normal speed. */
        synchronized void play(int id, float vol, float pan, float pitch) {
            if (mute) return;
            int v = 0; double far = -1;
            for (int i = 0; i < VOICES; i++) {
                if (vBuf[i] == null) { v = i; break; }
                if (vPos[i] > far) { far = vPos[i]; v = i; }                   // all busy: replace the one closest to finishing
            }
            vBuf[v] = bank[id]; vPos[v] = 0; vRate[v] = pitch;
            vL[v] = vol * Math.min(1, 1 - pan); vR[v] = vol * Math.min(1, 1 + pan);
        }

        /** Adds up everything that is playing into one block of stereo samples. */
        void mix(float[] l, float[] r, int n) {
            float sv = mute ? 0 : sfxVol, mv = mute ? 0 : musicVol;
            short[] mus = music;
            float aT = sv * (mus != null ? 0.10f : 0.22f), rT = sv * rain * 0.5f;       // the wind steps back when music is playing
            for (int i = 0; i < n; i++) {
                ambGain += (aT - ambGain) * 0.00008f; rainGain += (rT - rainGain) * 0.00008f;
                l[i] = ambient[ambPos] * ambGain + rainLoop[rainPos] * rainGain;
                r[i] = ambient[(ambPos + 7919) % ambient.length] * ambGain + rainLoop[(rainPos + 5003) % rainLoop.length] * rainGain;
                if (++ambPos >= ambient.length) ambPos = 0;
                if (++rainPos >= rainLoop.length) rainPos = 0;
            }
            if (mus != null) {
                int frames = mus.length / 2;
                double step = musicRate / RATE, pos = musicPos;
                for (int i = 0; i < n; i++) {
                    musGain += (mv - musGain) * 0.0002f;
                    int k = (int) pos; float f = (float) (pos - k); int k2 = k + 1 < frames ? k + 1 : 0;
                    float g = musGain * (0.6f / 32768f);
                    l[i] += (mus[k * 2] + (mus[k2 * 2] - mus[k * 2]) * f) * g;
                    r[i] += (mus[k * 2 + 1] + (mus[k2 * 2 + 1] - mus[k * 2 + 1]) * f) * g;
                    pos += step;
                    if (pos >= frames) pos -= frames;
                }
                musicPos = pos;
            }
            synchronized (this) {
                for (int v = 0; v < VOICES; v++) {
                    float[] b = vBuf[v];
                    if (b == null) continue;
                    double pos = vPos[v], rate = vRate[v];
                    float gl = vL[v] * sv, gr = vR[v] * sv;
                    for (int i = 0; i < n; i++) {
                        int k = (int) pos;
                        if (k + 1 >= b.length) { vBuf[v] = null; break; }
                        float f = (float) (pos - k), s = b[k] + (b[k + 1] - b[k]) * f;
                        l[i] += s * gl; r[i] += s * gr;
                        pos += rate;
                    }
                    vPos[v] = pos;
                }
            }
            for (int i = 0; i < n; i++) {                                      // gentle limiter so loud moments never crackle
                l[i] = l[i] / (1 + Math.abs(l[i]) * 0.6f);
                r[i] = r[i] / (1 + Math.abs(r[i]) * 0.6f);
            }
        }

        @Override public void run() {
            int n = 512;
            float[] l = new float[n], r = new float[n];
            byte[] out = new byte[n * 4];
            while (true) {
                mix(l, r, n);
                for (int i = 0; i < n; i++) {
                    int a = (int) (clamp(l[i], -1, 1) * 32000), b = (int) (clamp(r[i], -1, 1) * 32000);
                    out[i * 4] = (byte) a; out[i * 4 + 1] = (byte) (a >> 8); out[i * 4 + 2] = (byte) b; out[i * 4 + 3] = (byte) (b >> 8);
                }
                line.write(out, 0, out.length);
            }
        }
    }

    // ═══════════════════════════════════════════ ONLINE PLAY ═══════════════════════════════════════════

    /**
     * A direct connection between two copies of the game. One player hosts and the other joins by typing the host's address.
     * Only moves are sent ("MOVE from to promotion"); each side checks them against its own rules.
     * Works straight away on the same Wi-Fi or network. Across the internet the host's router must forward TCP port 47474
     * to the host's computer (or both players can use a virtual-LAN tool).
     */
    static final class Net {
        static final int PORT = 47474;
        final ConcurrentLinkedQueue<String> in = new ConcurrentLinkedQueue<>();
        volatile String status = "";
        volatile boolean connected, failed, closed;
        boolean host;
        volatile ServerSocket server; volatile Socket sock; volatile PrintWriter out;

        void host(final int port) {
            host = true; status = "Waiting for your friend to join…";
            spawn(() -> { server = new ServerSocket(port); Socket s = server.accept(); server.close(); talk(s); }, "Couldn't host a game");
        }

        void join(final String addr, final int port) {
            status = "Connecting to " + addr + "…";
            spawn(() -> { Socket s = new Socket(); s.connect(new InetSocketAddress(addr.trim(), port), 8000); talk(s); }, "Couldn't reach " + addr);
        }

        interface Job { void run() throws Exception; }

        private void spawn(final Job job, final String failText) {
            Thread t = new Thread(() -> {
                try { job.run(); }
                catch (Exception e) { if (!closed && !connected) { failed = true; status = failText + " (" + e.getMessage() + ")"; } }
                if (connected && !closed) in.add("BYE");                       // the line dropped
            }, "nightfall-net");
            t.setDaemon(true);
            t.start();
        }

        private void talk(Socket s) throws Exception {
            sock = s;
            s.setTcpNoDelay(true);
            out = new PrintWriter(new OutputStreamWriter(s.getOutputStream(), "UTF-8"), true);
            BufferedReader rd = new BufferedReader(new InputStreamReader(s.getInputStream(), "UTF-8"));
            connected = true; status = "Connected";
            send("HELLO NIGHTFALL 3");
            String line;
            while ((line = rd.readLine()) != null) in.add(line);
        }

        void send(String s) { PrintWriter o = out; if (o != null) o.println(s); }

        void close() {
            if (closed) return;
            send("BYE");
            closed = true;
            try { if (server != null) server.close(); } catch (Exception e) { /* already closed */ }
            try { if (sock != null) sock.close(); } catch (Exception e) { /* already closed */ }
        }

        /** This computer's addresses on the local network, for the host to read out to a friend. */
        static List<String> addresses() {
            List<String> out = new ArrayList<>();
            try {
                for (java.util.Enumeration<NetworkInterface> e = NetworkInterface.getNetworkInterfaces(); e.hasMoreElements(); ) {
                    NetworkInterface ni = e.nextElement();
                    if (!ni.isUp() || ni.isLoopback()) continue;
                    for (java.util.Enumeration<InetAddress> a = ni.getInetAddresses(); a.hasMoreElements(); ) {
                        InetAddress ad = a.nextElement();
                        if (ad instanceof java.net.Inet4Address) out.add(ad.getHostAddress());
                    }
                }
            } catch (Exception e) { /* no network information available */ }
            return out;
        }
    }

    // ═══════════════════════════════════════════ 3D MODELS ═══════════════════════════════════════════

    /** A triangle mesh: positions, normals, a colour and a "kind" per corner (0 body, 1 glowing, 2 metal trim). */
    static final class Mesh {
        float[] p, n; int[] t, c; byte[] k, mt, tk; int nv, nt; float height;
        float[] shR = new float[8], shY = new float[8];             // rings used to cast the shadow
    }

    /** The outline of a turned (lathe) shape: a list of radius/height points. */
    static final class Prof {
        float[] a = new float[1600]; byte[] k = new byte[800]; int n, sub = 3; byte kind;
        Prof pt(float r, float y) { a[n * 2] = Math.max(0, r); a[n * 2 + 1] = y; k[n] = kind; n++; return this; }
        Prof hard(float r, float y) { return pt(r, y).pt(r, y); }  // a sharp edge
        Prof k(int kd) { kind = (byte) kd; return this; }
        Prof arc(float cy, float rad, float deg0, float deg1, int steps) {
            for (int i = 0; i <= steps; i++) {
                float an = (deg0 + (deg1 - deg0) * i / steps) * PI / 180;
                pt(rad * cos(an), cy + rad * sin(an));
            }
            return this;
        }
        /** A smooth curve through the given radius/height pairs (this is what makes the pieces look turned on a lathe, not folded). */
        Prof spl(float... q) {
            int m = q.length / 2;
            if (n == 0 || a[n * 2 - 2] != q[0] || a[n * 2 - 1] != q[1]) pt(q[0], q[1]);
            for (int i = 0; i + 1 < m; i++) {
                int i0 = Math.max(0, i - 1), i3 = Math.min(m - 1, i + 2);
                for (int s = 1; s <= sub; s++) {
                    float t = s / (float) sub, t2 = t * t, t3 = t2 * t;
                    float r = 0.5f * (2 * q[i * 2] + (-q[i0 * 2] + q[i * 2 + 2]) * t + (2 * q[i0 * 2] - 5 * q[i * 2] + 4 * q[i * 2 + 2] - q[i3 * 2]) * t2 + (-q[i0 * 2] + 3 * q[i * 2] - 3 * q[i * 2 + 2] + q[i3 * 2]) * t3);
                    float y = 0.5f * (2 * q[i * 2 + 1] + (-q[i0 * 2 + 1] + q[i * 2 + 3]) * t + (2 * q[i0 * 2 + 1] - 5 * q[i * 2 + 1] + 4 * q[i * 2 + 3] - q[i3 * 2 + 1]) * t2 + (-q[i0 * 2 + 1] + 3 * q[i * 2 + 1] - 3 * q[i * 2 + 3] + q[i3 * 2 + 1]) * t3);
                    pt(r, y);
                }
            }
            return this;
        }
    }

    static final class MeshBuilder {
        float[] p = new float[9000], n = new float[9000]; int[] c = new int[3000]; byte[] k = new byte[3000], mt = new byte[3000]; int nv;
        int[] t = new int[18000]; int nt;
        int color = 0xFFFFFF; byte kind, mat, grp;                       // grp marks which castle a triangle belongs to

        int v(float x, float y, float z, float nx, float ny, float nz) {
            if (nv * 3 + 3 > p.length) {
                p = Arrays.copyOf(p, p.length * 2); n = Arrays.copyOf(n, n.length * 2);
                c = Arrays.copyOf(c, c.length * 2); k = Arrays.copyOf(k, k.length * 2); mt = Arrays.copyOf(mt, mt.length * 2);
            }
            p[nv * 3] = x; p[nv * 3 + 1] = y; p[nv * 3 + 2] = z;
            n[nv * 3] = nx; n[nv * 3 + 1] = ny; n[nv * 3 + 2] = nz;
            c[nv] = color; k[nv] = kind; mt[nv] = (byte) (mat | (grp << 4));
            return nv++;
        }

        void tri(int a, int b, int cc) {
            if (nt * 3 + 3 > t.length) t = Arrays.copyOf(t, t.length * 2);
            t[nt * 3] = a; t[nt * 3 + 1] = b; t[nt * 3 + 2] = cc; nt++;
        }

        /** Flat four-cornered face with a given outward direction. */
        void quad(float x0, float y0, float z0, float x1, float y1, float z1, float x2, float y2, float z2,
                  float x3, float y3, float z3, float nx, float ny, float nz) {
            int a = v(x0, y0, z0, nx, ny, nz), b = v(x1, y1, z1, nx, ny, nz), cc = v(x2, y2, z2, nx, ny, nz), d = v(x3, y3, z3, nx, ny, nz);
            tri(a, b, cc); tri(a, cc, d);
        }

        /** Spin a profile around the vertical axis. */
        void lathe(Prof pr, int seg, float ox, float oy, float oz) {
            int base = nv; byte keep = kind;
            for (int i = 0; i < pr.n; i++) {
                float r = pr.a[i * 2], y = pr.a[i * 2 + 1];
                boolean hasPrev = i > 0 && !(pr.a[i * 2 - 2] == r && pr.a[i * 2 - 1] == y);
                boolean hasNext = i < pr.n - 1 && !(pr.a[i * 2 + 2] == r && pr.a[i * 2 + 3] == y);
                float dr = 0, dy = 0;
                if (hasPrev) { float a = r - pr.a[i * 2 - 2], b = y - pr.a[i * 2 - 1], l = sqrt(a * a + b * b); dr += a / l; dy += b / l; }
                if (hasNext) { float a = pr.a[i * 2 + 2] - r, b = pr.a[i * 2 + 3] - y, l = sqrt(a * a + b * b); dr += a / l; dy += b / l; }
                float nr = dy, ny = -dr, l = sqrt(nr * nr + ny * ny);
                if (l < 1e-6f) { nr = 1; ny = 0; } else { nr /= l; ny /= l; }
                kind = keep != 0 ? keep : pr.k[i];
                for (int j = 0; j < seg; j++) {
                    float an = j * TAU / seg, ca = cos(an), sa = sin(an);
                    v(ox + r * ca, oy + y, oz + r * sa, nr * ca, ny, nr * sa);
                }
            }
            kind = keep;
            for (int i = 0; i + 1 < pr.n; i++) {
                if (pr.a[i * 2] == pr.a[i * 2 + 2] && pr.a[i * 2 + 1] == pr.a[i * 2 + 3]) continue;
                for (int j = 0; j < seg; j++) {
                    int a = base + i * seg + j, b = base + i * seg + (j + 1) % seg, cc = a + seg, d = b + seg;
                    tri(a, cc, b); tri(b, cc, d);
                }
            }
        }

        // ---- reshape everything added since v0: used to squash, tilt and place parts such as the knight's head ----
        void scale(int v0, float sx, float sy, float sz) {
            for (int i = v0; i < nv; i++) {
                p[i * 3] *= sx; p[i * 3 + 1] *= sy; p[i * 3 + 2] *= sz;
                float nx = n[i * 3] / sx, ny = n[i * 3 + 1] / sy, nz = n[i * 3 + 2] / sz, l = sqrt(nx * nx + ny * ny + nz * nz) + 1e-9f;
                n[i * 3] = nx / l; n[i * 3 + 1] = ny / l; n[i * 3 + 2] = nz / l;
            }
        }
        /** Tip forward: a positive angle swings the +z end downward. */
        void rotX(int v0, float a) {
            float ca = cos(a), sa = sin(a);
            for (int i = v0; i < nv; i++) {
                float y = p[i * 3 + 1], z = p[i * 3 + 2]; p[i * 3 + 1] = y * ca - z * sa; p[i * 3 + 2] = y * sa + z * ca;
                y = n[i * 3 + 1]; z = n[i * 3 + 2]; n[i * 3 + 1] = y * ca - z * sa; n[i * 3 + 2] = y * sa + z * ca;
            }
        }
        /** Lean sideways: a positive angle swings the top towards +x. */
        void rotZ(int v0, float a) {
            float ca = cos(a), sa = sin(a);
            for (int i = v0; i < nv; i++) {
                float x = p[i * 3], y = p[i * 3 + 1]; p[i * 3] = x * ca + y * sa; p[i * 3 + 1] = -x * sa + y * ca;
                x = n[i * 3]; y = n[i * 3 + 1]; n[i * 3] = x * ca + y * sa; n[i * 3 + 1] = -x * sa + y * ca;
            }
        }
        void move(int v0, float x, float y, float z) { for (int i = v0; i < nv; i++) { p[i * 3] += x; p[i * 3 + 1] += y; p[i * 3 + 2] += z; } }

        /** A stretched ball, optionally tipped forward. */
        void ellipsoid(float cx, float cy, float cz, float rx, float ry, float rz, float pitch, int seg, int rings) {
            int v0 = nv;
            lathe(new Prof().arc(0, 1, -90, 90, rings), seg, 0, 0, 0);
            scale(v0, rx, ry, rz); rotX(v0, pitch); move(v0, cx, cy, cz);
        }

        /** Box; local x axis points along 'yaw'. */
        void box(float cx, float cy, float cz, float hx, float hy, float hz, float yaw, boolean top, boolean bottom) {
            float co = cos(yaw), si = sin(yaw);
            float[] h = {hx, hy, hz};
            for (int ax = 0; ax < 3; ax++) for (int sg = -1; sg <= 1; sg += 2) {
                if (ax == 1 && ((sg > 0 && !top) || (sg < 0 && !bottom))) continue;
                int u = (ax + 1) % 3, w = (ax + 2) % 3;
                float[] nl = new float[3]; nl[ax] = sg;
                float nx = nl[0] * co - nl[2] * si, nz = nl[0] * si + nl[2] * co;
                int[] id = new int[4];
                for (int q = 0; q < 4; q++) {
                    float[] l = new float[3];
                    l[ax] = sg * h[ax];
                    l[u] = ((q == 1 || q == 2) ? 1 : -1) * h[u];
                    l[w] = (q >= 2 ? 1 : -1) * h[w];
                    id[q] = v(cx + l[0] * co - l[2] * si, cy + l[1], cz + l[0] * si + l[2] * co, nx, nl[1], nz);
                }
                tri(id[0], id[1], id[2]); tri(id[0], id[2], id[3]);
            }
        }

        /** Flat-sided column (or cone when r1 is 0). */
        void prism(float cx, float y0, float cz, float r0, float r1, float h, int sides, float rot, boolean cap) {
            for (int i = 0; i < sides; i++) {
                float a0 = rot + i * TAU / sides, a1 = rot + (i + 1) * TAU / sides, am = (a0 + a1) / 2;
                float nx = cos(am) * h, ny = r0 - r1, nz = sin(am) * h, l = sqrt(nx * nx + ny * ny + nz * nz);
                quad(cx + r0 * cos(a0), y0, cz + r0 * sin(a0), cx + r0 * cos(a1), y0, cz + r0 * sin(a1),
                        cx + r1 * cos(a1), y0 + h, cz + r1 * sin(a1), cx + r1 * cos(a0), y0 + h, cz + r1 * sin(a0), nx / l, ny / l, nz / l);
            }
            if (cap && r1 > 0) {
                int ce = v(cx, y0 + h, cz, 0, 1, 0);
                for (int i = 0; i < sides; i++) {
                    float a0 = rot + i * TAU / sides, a1 = rot + (i + 1) * TAU / sides;
                    tri(ce, v(cx + r1 * cos(a0), y0 + h, cz + r1 * sin(a0), 0, 1, 0), v(cx + r1 * cos(a1), y0 + h, cz + r1 * sin(a1), 0, 1, 0));
                }
            }
        }

        /** Round tapered branch between two points. */
        void limb(float x0, float y0, float z0, float x1, float y1, float z1, float r0, float r1, int sides) {
            float dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, l = sqrt(dx * dx + dy * dy + dz * dz);
            dx /= l; dy /= l; dz /= l;
            float ax = Math.abs(dy) < 0.9f ? 0 : 1, ay = Math.abs(dy) < 0.9f ? 1 : 0;
            float ux = dy * 0 - dz * ay, uy = dz * ax - dx * 0, uz = dx * ay - dy * ax;
            float ul = sqrt(ux * ux + uy * uy + uz * uz); ux /= ul; uy /= ul; uz /= ul;
            float wx = dy * uz - dz * uy, wy = dz * ux - dx * uz, wz = dx * uy - dy * ux;
            int base = nv;
            for (int ring = 0; ring < 2; ring++) {
                float r = ring == 0 ? r0 : r1, px = ring == 0 ? x0 : x1, py = ring == 0 ? y0 : y1, pz = ring == 0 ? z0 : z1;
                for (int j = 0; j < sides; j++) {
                    float an = j * TAU / sides, ca = cos(an), sa = sin(an);
                    float nx = ca * ux + sa * wx, ny = ca * uy + sa * wy, nz = ca * uz + sa * wz;
                    v(px + nx * r, py + ny * r, pz + nz * r, nx, ny, nz);
                }
            }
            for (int j = 0; j < sides; j++) {
                int a = base + j, b = base + (j + 1) % sides;
                tri(a, a + sides, b); tri(b, a + sides, b + sides);
            }
        }

        /** Tube with oval cross-sections along a curved path in the z-y plane (the knight's neck). */
        void sweep(float[][] sp, int sides) {
            int base = nv;
            float tz = 0, ty = 1;
            for (int i = 0; i < sp.length; i++) {
                int i0 = Math.max(0, i - 1), i1 = Math.min(sp.length - 1, i + 1);
                tz = sp[i1][0] - sp[i0][0]; ty = sp[i1][1] - sp[i0][1];
                float l = sqrt(tz * tz + ty * ty); tz /= l; ty /= l;
                float py = -tz, pz = ty, hd = sp[i][2], hw = sp[i][3];
                for (int j = 0; j < sides; j++) {
                    float an = j * TAU / sides, ca = cos(an), sa = sin(an);
                    float nx = ca / hw, ny = sa * py / hd, nz = sa * pz / hd, nl = sqrt(nx * nx + ny * ny + nz * nz);
                    v(ca * hw, sp[i][1] + sa * hd * py, sp[i][0] + sa * hd * pz, nx / nl, ny / nl, nz / nl);
                }
            }
            for (int i = 0; i + 1 < sp.length; i++) for (int j = 0; j < sides; j++) {
                int a = base + i * sides + j, b = base + i * sides + (j + 1) % sides;
                tri(a, a + sides, b); tri(b, a + sides, b + sides);
            }
            float[] e = sp[sp.length - 1];
            int last = base + (sp.length - 1) * sides, ce = v(0, e[1], e[0], 0, ty, tz);
            for (int j = 0; j < sides; j++) tri(ce, last + j, last + (j + 1) % sides);
        }

        /** Finish: drop empty triangles and make every triangle wind the same way as its outward direction. */
        Mesh build() {
            Mesh m = new Mesh();
            m.p = Arrays.copyOf(p, nv * 3); m.n = Arrays.copyOf(n, nv * 3); m.c = Arrays.copyOf(c, nv); m.k = Arrays.copyOf(k, nv); m.mt = Arrays.copyOf(mt, nv); m.nv = nv;
            int[] out = new int[nt * 3]; int o = 0;
            for (int i = 0; i < nt; i++) {
                int a = t[i * 3], b = t[i * 3 + 1], cc = t[i * 3 + 2];
                float e1x = p[b * 3] - p[a * 3], e1y = p[b * 3 + 1] - p[a * 3 + 1], e1z = p[b * 3 + 2] - p[a * 3 + 2];
                float e2x = p[cc * 3] - p[a * 3], e2y = p[cc * 3 + 1] - p[a * 3 + 1], e2z = p[cc * 3 + 2] - p[a * 3 + 2];
                float cx = e1y * e2z - e1z * e2y, cy = e1z * e2x - e1x * e2z, cz = e1x * e2y - e1y * e2x;
                if (cx * cx + cy * cy + cz * cz < 1e-16f) continue;
                float d = cx * (n[a * 3] + n[b * 3] + n[cc * 3]) + cy * (n[a * 3 + 1] + n[b * 3 + 1] + n[cc * 3 + 1]) + cz * (n[a * 3 + 2] + n[b * 3 + 2] + n[cc * 3 + 2]);
                out[o++] = a;
                if (d < 0) { out[o++] = cc; out[o++] = b; } else { out[o++] = b; out[o++] = cc; }
            }
            m.t = Arrays.copyOf(out, o); m.nt = o / 3;
            m.tk = new byte[m.nt];                                     // a triangle is glowing/metal only if all three corners are
            for (int i = 0; i < m.nt; i++) { byte ka = k[m.t[i * 3]]; if (ka == k[m.t[i * 3 + 1]] && ka == k[m.t[i * 3 + 2]]) m.tk[i] = ka; }
            for (int i = 0; i < nv; i++) m.height = Math.max(m.height, p[i * 3 + 1]);
            for (int i = 0; i < nv; i++) {
                int bin = Math.min(7, Math.max(0, (int) (p[i * 3 + 1] / m.height * 8)));
                m.shR[bin] = Math.max(m.shR[bin], sqrt(p[i * 3] * p[i * 3] + p[i * 3 + 2] * p[i * 3 + 2]));
                m.shY[bin] = (bin + 0.5f) / 8 * m.height;
            }
            return m;
        }
    }

    /**
     * Each piece exists three times: a light model for reflections, shards and ghosts, a medium one for normal play,
     * and a finely detailed one for when the camera is close (the kill-cam).
     */
    static final Mesh[] MESH = new Mesh[7], MESHMID = new Mesh[7], MESHHI = new Mesh[7];
    static { for (int t = 1; t <= 6; t++) { MESH[t] = buildPiece(t, 0); MESHMID[t] = buildPiece(t, 1); MESHHI[t] = buildPiece(t, 2); } }

    /** The turned foot every piece stands on: a plinth, a band of metal, then a sweeping curve up to the stem. */
    static void foot(Prof p, float R, float neck) {
        p.pt(R, 0).hard(R, .045f);
        p.k(2).hard(R * .93f, .05f).hard(R * .93f, .09f);
        p.k(0).hard(R * .87f, .095f);
        p.spl(R * .87f, .095f, R * .78f, .12f, (R * .78f + neck) / 2 + .012f, .15f, neck * 1.12f, .172f, neck, .19f);
    }

    /** The glowing collar (the band of team colour) at height y. */
    static void collar(Prof p, float r, float y, float stem) {
        p.k(1).hard(r, y).spl(r, y, r * 1.12f, y + .026f, r, y + .052f).pt(r, y + .052f);
        p.k(0).hard(stem, y + .062f);
    }

    /** The six chess pieces. lod = level of detail: 0 light, 1 medium, 2 fine. */
    static Mesh buildPiece(int type, int lod) {
        MeshBuilder m = new MeshBuilder();
        Prof p = new Prof();
        p.sub = lod + 1;
        boolean hi = lod > 0;
        int S = lod == 2 ? 24 : (lod == 1 ? 16 : 12), bs = lod == 2 ? 10 : (lod == 1 ? 8 : 6), br = lod == 2 ? 6 : (lod == 1 ? 4 : 3), as = lod == 2 ? 8 : (lod == 1 ? 6 : 4);
        switch (type) {
            case PAWN:
                foot(p, .27f, .125f);
                p.spl(.125f, .19f, .10f, .24f, .078f, .33f, .066f, .43f, .07f, .485f);
                collar(p, .145f, .50f, .07f);
                p.spl(.07f, .562f, .061f, .578f, .068f, .59f).arc(.705f, .135f, -58, 90, as);
                m.lathe(p, S, 0, 0, 0);
                break;
            case ROOK:
                foot(p, .31f, .19f);
                p.spl(.19f, .19f, .178f, .26f, .168f, .40f, .166f, .52f, .172f, .60f);
                collar(p, .225f, .612f, .185f);
                p.spl(.185f, .674f, .20f, .71f, .235f, .745f, .265f, .765f).pt(.265f, .765f);
                p.k(2).hard(.272f, .77f).hard(.272f, .80f).k(0).hard(.265f, .805f);
                p.hard(.265f, .885f).hard(.185f, .885f).hard(.185f, .80f).pt(0, .80f);
                m.lathe(p, S, 0, 0, 0);
                for (int i = 0; i < 6; i++) {                              // battlements
                    float a = i * TAU / 6;
                    m.box(cos(a) * .225f, .935f, sin(a) * .225f, .072f, .05f, .04f, a + PI / 2, true, false);
                }
                break;
            case BISHOP:
                foot(p, .29f, .135f);
                p.spl(.135f, .19f, .105f, .25f, .08f, .40f, .069f, .58f, .075f, .665f);
                collar(p, .155f, .68f, .082f);
                p.spl(.082f, .742f, .075f, .775f, .098f, .82f, .138f, .88f, .152f, .95f, .138f, 1.04f, .098f, 1.115f, .045f, 1.17f).pt(.045f, 1.17f);
                p.k(2).pt(.045f, 1.17f).arc(1.212f, .05f, -58, 90, as);
                m.lathe(p, S, 0, 0, 0);
                break;
            case QUEEN:
                foot(p, .33f, .155f);
                p.spl(.155f, .19f, .12f, .27f, .092f, .47f, .08f, .70f, .086f, .83f);
                collar(p, .17f, .85f, .09f);
                p.spl(.09f, .912f, .086f, .97f, .108f, 1.05f, .155f, 1.14f, .205f, 1.22f).pt(.205f, 1.22f);
                p.k(2).hard(.213f, 1.225f).hard(.213f, 1.262f).hard(.165f, 1.262f).k(0).arc(1.247f, .165f, 5, 90, as);
                m.lathe(p, S, 0, 0, 0);
                m.kind = 2;
                m.lathe(new Prof().arc(1.447f, .05f, -90, 90, br + 1), bs, 0, 0, 0);
                for (int i = 0; i < 8; i++) {                              // the points of the crown, each tipped with a glowing gem
                    float a = i * TAU / 8;
                    m.kind = 2;
                    m.lathe(new Prof().pt(.032f, 0).pt(.012f, .085f), hi ? 8 : 5, cos(a) * .188f, 1.262f, sin(a) * .188f);
                    m.kind = 1;
                    m.lathe(new Prof().arc(0, .027f, -90, 90, br), hi ? 8 : 5, cos(a) * .188f, 1.368f, sin(a) * .188f);
                }
                m.kind = 0;
                break;
            case KING:
                foot(p, .34f, .165f);
                p.spl(.165f, .19f, .128f, .28f, .099f, .51f, .088f, .78f, .094f, .905f);
                collar(p, .18f, .925f, .098f);
                p.spl(.098f, .987f, .094f, 1.04f, .118f, 1.12f, .168f, 1.22f, .215f, 1.30f).pt(.215f, 1.30f);
                p.k(2).hard(.223f, 1.305f).hard(.223f, 1.342f).k(0).hard(.20f, 1.347f);
                p.spl(.20f, 1.347f, .14f, 1.377f, .06f, 1.396f, 0, 1.40f);
                m.lathe(p, S, 0, 0, 0);
                m.kind = 2;                                                // the cross
                m.lathe(new Prof().arc(1.418f, .04f, -90, 90, br), bs, 0, 0, 0);
                m.box(0, 1.545f, 0, .028f, .115f, .028f, 0, true, false);
                m.box(0, 1.565f, 0, .098f, .028f, .028f, 0, true, true);
                m.kind = 0;
                break;
            default: {  // KNIGHT: a horse's head and neck built from overlapping rounded forms
                foot(p, .31f, .20f);
                p.spl(.20f, .19f, .205f, .215f, .198f, .24f).pt(.198f, .24f);
                p.k(1).hard(.215f, .245f).hard(.215f, .285f).k(0).hard(.19f, .29f).pt(0, .31f);
                m.lathe(p, S, 0, 0, 0);
                int sides = lod == 2 ? 14 : (lod == 1 ? 10 : 8);
                float[][] sp = {{-.02f, .26f, .17f, .145f}, {-.05f, .37f, .168f, .132f}, {-.078f, .49f, .158f, .116f}, {-.09f, .61f, .15f, .104f},
                        {-.078f, .72f, .145f, .097f}, {-.04f, .81f, .135f, .092f}, {.01f, .865f, .115f, .088f}};
                m.sweep(sp, sides);                                                              // neck
                m.ellipsoid(0, .36f, .075f, .125f, .135f, .11f, 0, bs, br);                    // chest
                float pitch = 0.66f, hx = 0, hy = .835f, hz = .085f, dy = -sin(pitch), dz = cos(pitch);
                m.ellipsoid(hx, hy, hz, .088f, .105f, .20f, pitch, bs + 2, br + 1);              // skull
                m.ellipsoid(0, hy + dy * .17f, hz + dz * .17f, .064f, .07f, .10f, pitch, bs, br);       // muzzle
                m.ellipsoid(0, hy + dy * .245f, hz + dz * .245f, .058f, .056f, .045f, pitch, bs, br);   // lips and nostrils
                m.ellipsoid(0, .765f, .03f, .092f, .105f, .10f, 0, bs, br);                    // jaw and cheek
                m.ellipsoid(0, .915f, -.01f, .078f, .065f, .085f, 0.2f, bs, br);               // poll
                for (int i = 0; i < 7; i++) {                                                    // mane: a crest of overlapping locks down the back of the neck
                    float u = i / 6f, y = lerp(.90f, .40f, u), z = lerp(-.075f, -.215f, (float) Math.sin(u * PI * 0.62f)) - 0.0f;
                    m.ellipsoid(0, y, z + .0f, .034f, .082f, .062f, -0.25f - 0.5f * u, hi ? 8 : 5, br);
                }
                m.ellipsoid(0, .965f, .03f, .03f, .05f, .05f, 0.5f, hi ? 8 : 5, br);         // forelock
                for (int sg = -1; sg <= 1; sg += 2) {
                    int v0 = m.nv;                                                               // ears
                    m.lathe(new Prof().pt(.034f, 0).spl(.034f, 0, .03f, .05f, .012f, .11f, 0, .135f), hi ? 8 : 5, 0, 0, 0);
                    m.scale(v0, 0.7f, 1, 1); m.rotX(v0, -0.3f); m.rotZ(v0, sg * 0.22f); m.move(v0, sg * .05f, .955f, -.03f);
                    m.kind = 1;                                                                  // glowing eyes
                    m.ellipsoid(sg * .072f, .868f, .105f, .02f, .024f, .03f, pitch, hi ? 8 : 5, br);
                    m.kind = 0;
                    m.ellipsoid(sg * .046f, hy + dy * .262f, hz + dz * .262f, .016f, .016f, .02f, pitch, 5, 2);   // nostrils
                }
            }
        }
        return m.build();
    }

    // ═══════════════════════════════════════════ THE WORLD ═══════════════════════════════════════════

    /** Everything that never moves, with its lighting already worked out, plus the moon-shadow maps. */
    static final class World {
        float[] p; int[] c, t, aux; int nv, nt;
        byte[] grp, glowGrp;                                         // which castle each triangle / window light belongs to (0 = neither)
        float[] glows; int ng;                                       // x, y, z, size, r, g, b
        // Shadow maps: the scene's depth as seen from the moon. A point is in shadow if something is nearer the moon.
        static final int NS = 2048, FS = 1024;
        static final float NEXT = 40, FEXT = 195;
        float[] smNear, smFar, smNear0, smFar0;                      // the "0" pair is the untouched original

        /** 1 = in moonlight, 0 = in shadow (soft edge in between). */
        float shadow(float x, float y, float z, boolean fine) {
            float lx = x * MR[0] + z * MR[2], ly = x * MU[0] + y * MU[1] + z * MU[2], ld = x * MOON[0] + y * MOON[1] + z * MOON[2];
            // the detailed map is used close to the camera; far scenery uses the small coarse one, which is much quicker to read
            if (fine && lx > 1 - NEXT && lx < NEXT - 1 && ly > 1 - NEXT && ly < NEXT - 1) return pcf(smNear, NS, NS / (2 * NEXT), lx + NEXT, ly + NEXT, ld + 0.22f);
            if (lx > 1 - FEXT && lx < FEXT - 1 && ly > 1 - FEXT && ly < FEXT - 1) return pcf(smFar, FS, FS / (2 * FEXT), lx + FEXT, ly + FEXT, ld + 1.7f);
            return 1;
        }

        static float pcf(float[] map, int size, float sc, float u, float v, float d) {
            u = u * sc - 0.5f; v = v * sc - 0.5f;
            int x = (int) u, y = (int) v, i = y * size + x;
            float fu = u - x, fv = v - y;
            float a = map[i] <= d ? 1 : 0, b = map[i + 1] <= d ? 1 : 0, c = map[i + size] <= d ? 1 : 0, e = map[i + size + 1] <= d ? 1 : 0;
            return (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + e * fu) * fv;
        }

        /** Draws every triangle into a depth map as seen from the moon. */
        float[] depthFromMoon(int size, float ext, int skip) {
            float[] map = new float[size * size];
            Arrays.fill(map, -1e9f);
            float sc = size / (2 * ext);
            float[] X = new float[3], Y = new float[3], D = new float[3];
            for (int i = 0; i < nt; i++) {
                if (skip != 0 && grp[i] == skip) continue;                 // a castle that has fallen casts no shadow
                for (int q = 0; q < 3; q++) {
                    int v = t[i * 3 + q] * 3;
                    float x = p[v], y = p[v + 1], z = p[v + 2];
                    X[q] = (x * MR[0] + z * MR[2] + ext) * sc; Y[q] = (x * MU[0] + y * MU[1] + z * MU[2] + ext) * sc; D[q] = x * MOON[0] + y * MOON[1] + z * MOON[2];
                }
                int x0 = Math.max(0, (int) Math.floor(Math.min(X[0], Math.min(X[1], X[2])))), x1 = Math.min(size - 1, (int) Math.ceil(Math.max(X[0], Math.max(X[1], X[2]))));
                int y0 = Math.max(0, (int) Math.floor(Math.min(Y[0], Math.min(Y[1], Y[2])))), y1 = Math.min(size - 1, (int) Math.ceil(Math.max(Y[0], Math.max(Y[1], Y[2]))));
                if (x0 > x1 || y0 > y1) continue;
                float area = (X[1] - X[0]) * (Y[2] - Y[0]) - (Y[1] - Y[0]) * (X[2] - X[0]);
                if (Math.abs(area) < 1e-9f) continue;
                float inv = 1 / area;
                for (int y = y0; y <= y1; y++) for (int x = x0; x <= x1; x++) {
                    float px = x + 0.5f, py = y + 0.5f;
                    float w0 = ((X[1] - px) * (Y[2] - py) - (Y[1] - py) * (X[2] - px)) * inv;
                    float w1 = ((X[2] - px) * (Y[0] - py) - (Y[2] - py) * (X[0] - px)) * inv;
                    float w2 = 1 - w0 - w1;
                    if (w0 < -0.02f || w1 < -0.02f || w2 < -0.02f) continue;
                    float d = w0 * D[0] + w1 * D[1] + w2 * D[2];
                    if (d > map[y * size + x]) map[y * size + x] = d;
                }
            }
            return map;
        }
    }

    static float lastFrac;                                           // set by litStatic: share of the light that comes from the moon

    static int litStatic(int c, float x, float y, float z, float nx, float ny, float nz) {
        float ndl = Math.max(0, nx * MOON[0] + ny * MOON[1] + nz * MOON[2]) * 1.9f;
        float hemi = 0.5f + 0.5f * ny;
        float fill = Math.max(0, -nx * MOON[0] + ny * 0.4f - nz * MOON[2]) * 0.30f;
        float lr = AMBC[0] * hemi + 0.50f * fill, lg = AMBC[1] * hemi + 0.56f * fill, lb = AMBC[2] * hemi + 0.85f * fill;
        if (x * x + z * z < 400) for (float[] L : BRAZIERS) {
            float dx = L[0] - x, dy = L[1] - y, dz = L[2] - z, d2 = dx * dx + dy * dy + dz * dz;
            float w = 2.2f * Math.max(0, nx * dx + ny * dy + nz * dz) / sqrt(d2) / (1 + 0.35f * d2);
            lr += FIREC[0] * w; lg += FIREC[1] * w; lb += FIREC[2] * w;
        }
        float base = 0.3f * lr + 0.55f * lg + 0.15f * lb, moon = (0.3f * MOONC[0] + 0.55f * MOONC[1] + 0.15f * MOONC[2]) * ndl;
        lastFrac = moon / (base + moon + 1e-6f);
        lr += MOONC[0] * ndl; lg += MOONC[1] * ndl; lb += MOONC[2] * ndl;
        return pack(((c >> 16) & 255) * lr, ((c >> 8) & 255) * lg, (c & 255) * lb);
    }

    static void tower(MeshBuilder b, List<float[]> glows, Random rnd, float x, float y0, float z, float r, float h, float roofH,
                      int stone, int roof, float[] win) {
        int sides = 8;
        b.mat = M_BRICK; b.color = stone;
        b.prism(x, y0, z, r, r, h, sides, 0, false);
        b.prism(x, y0 + h - r * 0.35f, z, r, r * 1.22f, r * 0.35f, sides, 0, false);
        b.color = shade(stone, 1.12f);
        b.prism(x, y0 + h, z, r * 1.22f, r * 1.22f, r * 0.4f, sides, 0, true);
        for (int i = 0; i < sides; i++) {
            float a = (i + .5f) * TAU / sides;
            b.box(x + cos(a) * r * 1.08f, y0 + h + r * 0.6f, z + sin(a) * r * 1.08f, r * 0.26f, r * 0.2f, r * 0.1f, a + PI / 2, true, false);
        }
        if (roofH > 0) { b.mat = M_ROOF; b.color = roof; b.prism(x, y0 + h + r * 0.35f, z, r * 1.02f, 0, roofH, sides, 0, false); }
        b.kind = 1; b.mat = M_GLOW;
        b.color = pack(win[0] * 255, win[1] * 255, win[2] * 255);
        for (int lv = 0; lv < 3; lv++) {
            if (rnd.nextFloat() < 0.3f) continue;
            float a = (rnd.nextInt(sides) + .5f) * TAU / sides, d = r * cos(PI / sides) + 0.05f;
            float wy = y0 + h * (0.42f + 0.2f * lv), ww = r * 0.13f, wh = r * 0.34f;
            float wx = x + cos(a) * d, wz = z + sin(a) * d, tx = -sin(a), tz = cos(a);
            b.quad(wx - tx * ww, wy - wh, wz - tz * ww, wx + tx * ww, wy - wh, wz + tz * ww,
                    wx + tx * ww, wy + wh, wz + tz * ww, wx - tx * ww, wy + wh, wz - tz * ww, cos(a), 0, sin(a));
            b.tri(b.v(wx - tx * ww, wy + wh, wz - tz * ww, cos(a), 0, sin(a)), b.v(wx + tx * ww, wy + wh, wz + tz * ww, cos(a), 0, sin(a)),
                    b.v(wx, wy + wh + ww * 1.6f, wz, cos(a), 0, sin(a)));                        // pointed gothic top
            glows.add(new float[]{wx + cos(a) * 0.4f, wy, wz + sin(a) * 0.4f, r * 1.2f, win[0] * 62, win[1] * 62, win[2] * 62});
        }
        b.kind = 0; b.mat = M_BRICK;
    }

    static void wall(MeshBuilder b, float x0, float z0, float x1, float z1, float y0, float h, float th, int stone) {
        float dx = x1 - x0, dz = z1 - z0, len = sqrt(dx * dx + dz * dz), yaw = (float) Math.atan2(dz, dx);
        float mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
        b.mat = M_BRICK; b.color = stone;
        b.box(mx, y0 + h / 2, mz, len / 2, h / 2, th / 2, yaw, true, false);
        int n = Math.max(2, (int) (len / (th * 1.5f)));
        for (int i = 0; i < n; i++) {
            float u = ((i + .5f) / n - .5f) * len;
            b.box(mx + cos(yaw) * u, y0 + h + th * 0.28f, mz + sin(yaw) * u, len / n * 0.29f, th * 0.28f, th / 2, yaw, true, false);
        }
    }

    /** A pole with a banner at the top of a spire. */
    static void flag(MeshBuilder b, float x, float y, float z, float s, int cloth) {
        b.mat = M_WOOD; b.color = 0x2A2622;
        b.limb(x, y, z, x, y + 3.2f * s, z, 0.07f * s, 0.04f * s, 4);
        b.color = cloth;
        for (int sg = -1; sg <= 1; sg += 2) {
            float zz = z + sg * 0.01f;
            b.tri(b.v(x, y + 3.1f * s, zz, 0, 0, sg), b.v(x, y + 2.1f * s, zz, 0, 0, sg), b.v(x - 2.0f * s, y + 2.45f * s, zz + 0.25f * s, 0, 0, sg));
        }
    }

    static void castle(MeshBuilder b, List<float[]> glows, Random rnd, float cx, float cz, float s, boolean dark) {
        float g = terrainH(cx, cz) - 0.6f, f = cz > 0 ? -1 : 1;                   // the gate faces the board
        int stone = dark ? 0x5A566C : 0x9A9AAC, stone2 = dark ? 0x4C4860 : 0x86869A, roof = dark ? 0x4E2A66 : 0x36507E;
        int cloth = dark ? 0x8A2CB0 : 0x3C8CC8;
        float[] win = dark ? new float[]{1f, 0.30f, 0.75f} : new float[]{0.55f, 0.85f, 1f};
        float half = 11 * s, tH = 10 * s, wH = 6 * s, th = 1.2f * s, zf = cz + f * half, zb = cz - f * half;
        for (int sx = -1; sx <= 1; sx += 2) for (int sz = -1; sz <= 1; sz += 2)
            tower(b, glows, rnd, cx + sx * half, g, cz + sz * half, 2.2f * s, tH, 5.5f * s, stone, roof, win);
        wall(b, cx - half, cz - half, cx - half, cz + half, g, wH, th, stone);
        wall(b, cx + half, cz - half, cx + half, cz + half, g, wH, th, stone);
        wall(b, cx - half, zb, cx + half, zb, g, wH, th, stone);
        wall(b, cx - half, zf, cx - 2.8f * s, zf, g, wH, th, stone);
        wall(b, cx + 2.8f * s, zf, cx + half, zf, g, wH, th, stone);
        tower(b, glows, rnd, cx - 2.8f * s, g, zf, 1.7f * s, 8.5f * s, 4 * s, stone, roof, win);
        tower(b, glows, rnd, cx + 2.8f * s, g, zf, 1.7f * s, 8.5f * s, 4 * s, stone, roof, win);
        b.color = stone2;
        b.box(cx, g + wH * 0.6f, zf, 2.8f * s, wH * 0.6f, 0.9f * s, 0, true, false);
        b.kind = 1; b.mat = M_GLOW; b.color = 0x5A300F;                            // torch-lit gateway
        float gz = zf + f * (0.9f * s + 0.05f);
        b.quad(cx - 1.2f * s, g + 0.6f, gz, cx + 1.2f * s, g + 0.6f, gz, cx + 1.2f * s, g + 0.6f + 2.6f * s, gz, cx - 1.2f * s, g + 0.6f + 2.6f * s, gz, 0, 0, f);
        b.tri(b.v(cx - 1.2f * s, g + 0.6f + 2.6f * s, gz, 0, 0, f), b.v(cx + 1.2f * s, g + 0.6f + 2.6f * s, gz, 0, 0, f), b.v(cx, g + 0.6f + 3.9f * s, gz, 0, 0, f));
        glows.add(new float[]{cx, g + 2.2f * s, gz + f * 0.6f, 3.6f * s, 54, 26, 8});
        b.kind = 0; b.mat = M_BRICK;
        float kz = cz - f * 1.5f * s, kh = 4.5f * s;                               // the keep
        b.color = stone2;
        b.box(cx, g + 6.5f * s, kz, kh, 6.5f * s, kh, 0, true, false);
        for (int i = -1; i <= 1; i += 2) {                                         // buttresses on the front
            b.box(cx + i * kh * 0.62f, g + 4.2f * s, kz + f * (kh + 0.35f * s), 0.45f * s, 4.2f * s, 0.4f * s, 0, true, false);
        }
        b.mat = M_ROOF; b.color = roof;
        b.prism(cx, g + 13 * s, kz, kh * 1.45f, 0, 5 * s, 4, PI / 4, false);
        b.kind = 1; b.mat = M_GLOW; b.color = pack(win[0] * 255, win[1] * 255, win[2] * 255);
        for (int i = -1; i <= 1; i++) for (int lv = 0; lv < 2; lv++) {
            float wx = cx + i * 2.4f * s, wy = g + (7 + lv * 3.2f) * s, wz = kz + f * (kh + 0.05f), ww = 0.26f * s, wh = 0.65f * s;
            b.quad(wx - ww, wy - wh, wz, wx + ww, wy - wh, wz, wx + ww, wy + wh, wz, wx - ww, wy + wh, wz, 0, 0, f);
            b.tri(b.v(wx - ww, wy + wh, wz, 0, 0, f), b.v(wx + ww, wy + wh, wz, 0, 0, f), b.v(wx, wy + wh + ww * 1.7f, wz, 0, 0, f));
            glows.add(new float[]{wx, wy, wz + f * 0.4f, 2.2f * s, win[0] * 55, win[1] * 55, win[2] * 55});
        }
        b.kind = 0; b.mat = M_BRICK;
        for (int sx = -1; sx <= 1; sx += 2) for (int sz = -1; sz <= 1; sz += 2)
            tower(b, glows, rnd, cx + sx * kh, g, kz + sz * kh, 1.3f * s, 15.5f * s, 5 * s, stone, roof, win);
        tower(b, glows, rnd, cx, g, kz, 2.3f * s, 21 * s, 10 * s, stone2, roof, win);  // the great spire
        flag(b, cx, g + 21 * s + 2.3f * s * 0.35f + 10 * s - 0.3f, kz, s, cloth);
        if (dark) {
            for (int sx = -1; sx <= 1; sx += 2) {
                tower(b, glows, rnd, cx + sx * 7.6f * s, g, kz, 0.95f * s, 18 * s, 9 * s, stone2, roof, win);
                tower(b, glows, rnd, cx + sx * 3.4f * s, g, kz - f * 6.5f * s, 0.8f * s, 24 * s, 8 * s, stone2, roof, win);
            }
        } else {
            for (int sx = -1; sx <= 1; sx += 2) tower(b, glows, rnd, cx + sx * 7.6f * s, g, kz, 1.6f * s, 12 * s, 6 * s, stone, roof, win);
        }
    }

    /** One branch of a dead tree; it forks into thinner branches, which fork again. */
    static void branch(MeshBuilder b, Random rnd, float x, float y, float z, float dx, float dy, float dz, float len, float r, int depth) {
        float ex = x + dx * len, ey = y + dy * len, ez = z + dz * len, tip = depth >= 3 ? 0.15f : 0.6f;
        b.limb(x, y, z, ex, ey, ez, r, r * tip, depth == 0 ? 6 : (depth == 1 ? 4 : 3));
        if (depth >= 3) return;
        // the limb carries on from its tip (so it never looks sawn off) and throws out side branches lower down
        float[] c = unit(dx + (rnd.nextFloat() - .5f) * 0.9f, dy + 0.1f + (rnd.nextFloat() - .5f) * 0.5f, dz + (rnd.nextFloat() - .5f) * 0.9f);
        branch(b, rnd, ex, ey, ez, c[0], c[1], c[2], len * 0.72f, r * 0.6f, depth + 1);
        int n = depth == 0 ? 2 + rnd.nextInt(2) : 1 + rnd.nextInt(2);
        for (int k = 0; k < n; k++) {
            float u = 0.45f + 0.5f * rnd.nextFloat();
            float[] d = unit(dx * 0.55f + (rnd.nextFloat() - .5f) * 1.7f, dy * 0.55f + 0.3f + (rnd.nextFloat() - .5f) * 0.9f, dz * 0.55f + (rnd.nextFloat() - .5f) * 1.7f);
            branch(b, rnd, lerp(x, ex, u), lerp(y, ey, u), lerp(z, ez, u), d[0], d[1], d[2], len * (0.5f + 0.2f * rnd.nextFloat()), r * lerp(1, 0.6f, u) * 0.62f, depth + 1);
        }
    }

    /** A lumpy rock: a squashed ball with every corner pushed in or out a little. */
    static void boulder(MeshBuilder b, float x, float y, float z, float r, int seed) {
        int v0 = b.nv;
        b.lathe(new Prof().arc(0, 1, -90, 90, 5), 7, 0, 0, 0);
        for (int i = v0; i < b.nv; i++) {
            float px = b.p[i * 3], py = b.p[i * 3 + 1], pz = b.p[i * 3 + 2];
            float j = r * (0.72f + 0.56f * hash((int) (px * 40) + seed * 31, (int) (py * 40 + pz * 97) + seed));
            b.p[i * 3] = x + px * j; b.p[i * 3 + 1] = y + py * j * 0.7f; b.p[i * 3 + 2] = z + pz * j;
        }
    }

    static World buildWorld() {
        MeshBuilder b = new MeshBuilder();
        Random rnd = new Random(7);
        List<float[]> glows = new ArrayList<>();
        // ground
        b.mat = M_GROUND;
        int N = 104; float ext = 132f, cell = 2 * ext / N;
        for (int j = 0; j <= N; j++) for (int i = 0; i <= N; i++) {
            float x = -ext + i * cell, z = -ext + j * cell, h = terrainH(x, z), e = 0.8f;
            float nx = terrainH(x - e, z) - terrainH(x + e, z), nz = terrainH(x, z - e) - terrainH(x, z + e), ny = 2 * e;
            float l = sqrt(nx * nx + ny * ny + nz * nz); nx /= l; ny /= l; nz /= l;
            float var = 0.8f + 0.4f * fbm(x * 0.2f, z * 0.2f, 2);
            int col = mix(0x625E68, shade(0x34483A, var), smooth(0.72f, 0.93f, ny));
            col = mix(col, 0xB4C0DC, smooth(24, 36, h) * smooth(0.55f, 0.85f, ny));
            if (Math.abs(x) < 2.2f && Math.abs(z) > 5 && Math.abs(z) < 44) col = mix(col, 0x74624E, 0.8f);
            b.color = col;
            b.v(x, h, z, nx, ny, nz);
        }
        for (int j = 0; j < N; j++) for (int i = 0; i < N; i++) {
            int a = j * (N + 1) + i;
            b.tri(a, a + 1, a + N + 1); b.tri(a + 1, a + N + 2, a + N + 1);
        }
        // the dais the board sits on (the 8x8 playing surface itself is drawn by the board shader)
        b.mat = M_STONE;
        b.color = 0x4E4C5A; b.box(0, -0.78f, 0, 5.7f, 0.33f, 5.7f, 0, true, false);
        b.color = 0x3E3C4A; b.box(0, -0.225f, 0, 4.75f, 0.225f, 4.75f, 0, false, false);
        float[][] rings = {{4f, 4.09f, 0x9A7A3A}, {4.09f, 4.66f, 0x383642}, {4.66f, 4.75f, 0x9A7A3A}};
        for (float[] rg : rings) {
            float i0 = rg[0], o = rg[1];
            b.color = (int) rg[2];
            b.quad(-o, 0, -o, o, 0, -o, i0, 0, -i0, -i0, 0, -i0, 0, 1, 0);
            b.quad(-o, 0, o, o, 0, o, i0, 0, i0, -i0, 0, i0, 0, 1, 0);
            b.quad(-o, 0, -o, -o, 0, o, -i0, 0, i0, -i0, 0, -i0, 0, 1, 0);
            b.quad(o, 0, -o, o, 0, o, i0, 0, i0, i0, 0, -i0, 0, 1, 0);
        }
        // braziers at the four corners
        for (float[] L : BRAZIERS) {
            b.mat = M_STONE; b.color = 0x444250;
            b.prism(L[0], -0.45f, L[2], 0.20f, 0.13f, 1.35f, 6, 0, false);
            b.color = 0x5A4630;
            b.lathe(new Prof().pt(.10f, 0).pt(.30f, .20f).hard(.36f, .26f).pt(.29f, .26f).pt(.20f, .18f).pt(0, .16f), 10, L[0], 0.9f, L[2]);
            b.kind = 1; b.mat = M_NONE; b.color = 0xFF8A20;
            b.lathe(new Prof().pt(.26f, .19f).pt(.12f, .30f).pt(0, .33f), 8, L[0], 0.9f, L[2]);
            b.kind = 0;
        }
        // ring of standing stones with glowing runes
        for (int k = 0; k < 12; k++) {
            float an = (k * 30 + 15) * PI / 180, r = 10.6f + rnd.nextFloat() * 0.8f, x = cos(an) * r, z = sin(an) * r;
            float h = 2.6f + rnd.nextFloat() * 1.6f, lx = (rnd.nextFloat() - .5f) * 0.5f, lz = (rnd.nextFloat() - .5f) * 0.5f;
            b.mat = M_STONE; b.color = 0x5C5A68;
            b.limb(x, -1.3f, z, x + lx, -1 + h, z + lz, 0.6f, 0.34f, 5);
            b.prism(x + lx, -1 + h - 0.02f, z + lz, 0.34f, 0.05f, 0.3f, 5, 0.3f, false);
            float ix = x - cos(an) * 0.55f + lx * 0.5f, iz = z - sin(an) * 0.55f + lz * 0.5f;
            b.kind = 1; b.mat = M_NONE; b.color = 0x66FFC0;
            b.box(ix, -1 + h * 0.55f, iz, 0.05f, 0.22f, 0.03f, an + PI / 2, true, true);
            b.box(ix, -1 + h * 0.62f, iz, 0.14f, 0.04f, 0.03f, an + PI / 2, true, true);
            b.kind = 0;
            glows.add(new float[]{ix - cos(an) * 0.2f, -1 + h * 0.58f, iz - sin(an) * 0.2f, 0.8f, 18, 58, 42});
        }
        // castles
        int g0 = glows.size();
        b.grp = 1; castle(b, glows, rnd, MOUNDS[0][0], MOUNDS[0][1], 1.0f, true);            // the black fortress
        int g1 = glows.size();
        b.grp = 2; castle(b, glows, rnd, MOUNDS[1][0], MOUNDS[1][1], 0.95f, false);          // the white citadel
        int g2 = glows.size();
        b.grp = 0;
        castle(b, glows, rnd, MOUNDS[2][0], MOUNDS[2][1], 0.5f, false);           // a small outpost
        float[] green = {0.45f, 1f, 0.55f};                                        // the lone wizard's tower
        float wx = MOUNDS[3][0], wz = MOUNDS[3][1], wg = MOUNDS[3][3] - 0.6f;
        tower(b, glows, rnd, wx, wg, wz, 2.6f, 24, 10, 0x6A6878, 0x2E5A4A, green);
        tower(b, glows, rnd, wx + 5, wg, wz + 3, 1.3f, 9, 0, 0x5E5C6C, 0, green);
        tower(b, glows, rnd, wx - 4, wg, wz - 4, 1.1f, 6, 0, 0x5E5C6C, 0, green);
        // dead trees
        b.mat = M_WOOD;
        int placed = 0;
        for (int tries = 0; tries < 700 && placed < 64; tries++) {
            float an = rnd.nextFloat() * TAU, r = 13.5f + rnd.nextFloat() * rnd.nextFloat() * 62, x = cos(an) * r, z = sin(an) * r;
            if (Math.abs(x) < 3.5f || (x > -17.5f && x < -7.8f && z > 12.3f && z < 24.5f)) continue;      // keep the path and the graveyard clear
            boolean bad = false;
            for (float[] m : MOUNDS) { float dx = x - m[0], dz = z - m[1]; if (dx * dx + dz * dz < m[2] * m[2] * 1.5f) bad = true; }
            if (bad) continue;
            b.color = shade(0x3E3832, 0.8f + 0.4f * rnd.nextFloat());
            float[] d = unit((rnd.nextFloat() - .5f) * 0.35f, 1, (rnd.nextFloat() - .5f) * 0.35f);
            branch(b, rnd, x, terrainH(x, z) - 0.3f, z, d[0], d[1], d[2], 2.2f + rnd.nextFloat() * 1.8f, 0.26f + rnd.nextFloat() * 0.14f, 0);
            placed++;
        }
        // boulders
        b.mat = M_STONE;
        for (int k = 0; k < 70; k++) {
            float an = rnd.nextFloat() * TAU, r = 12.5f + rnd.nextFloat() * 60, x = cos(an) * r, z = sin(an) * r;
            if (Math.abs(x) < 3 || (x > -17.5f && x < -7.8f && z > 12.3f && z < 24.5f)) continue;
            float s = 0.3f + rnd.nextFloat() * rnd.nextFloat() * 1.5f;
            b.color = shade(0x5E5C64, 0.8f + 0.35f * rnd.nextFloat());
            boulder(b, x, terrainH(x, z) + s * 0.2f, z, s, k);
        }
        // a small graveyard beside the path
        for (int k = 0; k < GRAVES.length; k++) {
            float x = GRAVES[k][0], z = GRAVES[k][1] + 0.45f;
            float y = terrainH(x, z), yaw = (rnd.nextFloat() - .5f) * 0.5f;
            b.color = shade(0x6A6872, 0.8f + 0.3f * rnd.nextFloat());
            if (k % 3 == 0) {
                b.box(x, y + 0.5f, z, 0.07f, 0.6f, 0.06f, yaw, true, false);
                b.box(x, y + 0.75f, z, 0.26f, 0.07f, 0.06f, yaw, true, true);
            } else {
                b.box(x, y + 0.3f, z, 0.26f, 0.42f, 0.07f, yaw, true, false);
                b.prism(x, y + 0.72f, z, 0.27f, 0.02f, 0.16f, 4, yaw + PI / 4, false);
            }
        }
        Mesh m = b.build();
        World w = new World();
        w.p = m.p; w.t = m.t; w.nv = m.nv; w.nt = m.nt; w.c = new int[m.nv]; w.aux = new int[m.nt]; w.grp = new byte[m.nt];
        float[] frac = new float[m.nv];
        for (int i = 0; i < m.nv; i++) {
            if (m.k[i] == 1) { w.c[i] = m.c[i]; continue; }
            w.c[i] = litStatic(m.c[i], m.p[i * 3], m.p[i * 3 + 1], m.p[i * 3 + 2], m.n[i * 3], m.n[i * 3 + 1], m.n[i * 3 + 2]);
            frac[i] = lastFrac;
        }
        for (int i = 0; i < m.nt; i++) {                               // per triangle: surface kind, which way it faces, share of moonlight
            int a = m.t[i * 3], bb = m.t[i * 3 + 1], cc = m.t[i * 3 + 2];
            float e1x = m.p[bb * 3] - m.p[a * 3], e1y = m.p[bb * 3 + 1] - m.p[a * 3 + 1], e1z = m.p[bb * 3 + 2] - m.p[a * 3 + 2];
            float e2x = m.p[cc * 3] - m.p[a * 3], e2y = m.p[cc * 3 + 1] - m.p[a * 3 + 1], e2z = m.p[cc * 3 + 2] - m.p[a * 3 + 2];
            float nx = Math.abs(e1y * e2z - e1z * e2y), ny = Math.abs(e1z * e2x - e1x * e2z), nz = Math.abs(e1x * e2y - e1y * e2x);
            int axis = ny >= nx && ny >= nz ? 1 : (nx >= nz ? 0 : 2);
            int f = (int) ((frac[a] + frac[bb] + frac[cc]) / 3 * 255);
            w.aux[i] = (m.mt[a] & 15) | (axis << 3) | (f << 8);
            w.grp[i] = (byte) ((m.mt[a] >> 4) & 3);
        }
        w.ng = glows.size(); w.glows = new float[w.ng * 7];
        for (int i = 0; i < w.ng; i++) System.arraycopy(glows.get(i), 0, w.glows, i * 7, 7);
        w.glowGrp = new byte[w.ng];
        for (int i = g0; i < g2; i++) w.glowGrp[i] = (byte) (i < g1 ? 1 : 2);
        w.smNear = w.smNear0 = w.depthFromMoon(World.NS, World.NEXT, 0);
        w.smFar = w.smFar0 = w.depthFromMoon(World.FS, World.FEXT, 0);
        return w;
    }

    // ═══════════════════════════════════════ PIECES, SPARKS & DEBRIS ═══════════════════════════════════════

    static final class Piece {
        int type, sq; boolean white, alive = true;
        float x, y, z, yaw, spin, tilt, tiltX, tiltZ, scale = 1, glow = 1, shake;
    }

    /** Glowing dots: sparks, flames, magic. */
    static final class Particles {
        static final int MAX = 8000;
        final float[] x = new float[MAX], y = new float[MAX], z = new float[MAX], vx = new float[MAX], vy = new float[MAX], vz = new float[MAX];
        final float[] life = new float[MAX], max = new float[MAX], size = new float[MAX], r = new float[MAX], g = new float[MAX], b = new float[MAX];
        final float[] grav = new float[MAX], drag = new float[MAX];
        int n;

        void add(float px, float py, float pz, float ax, float ay, float az, float lf, float sz, float cr, float cg, float cb, float gr, float dr) {
            if (n >= MAX) return;
            x[n] = px; y[n] = py; z[n] = pz; vx[n] = ax; vy[n] = ay; vz[n] = az; life[n] = max[n] = lf; size[n] = sz;
            r[n] = cr; g[n] = cg; b[n] = cb; grav[n] = gr; drag[n] = dr; n++;
        }

        void update(float dt) {
            for (int i = 0; i < n; ) {
                life[i] -= dt;
                if (life[i] <= 0) {
                    n--;
                    x[i] = x[n]; y[i] = y[n]; z[i] = z[n]; vx[i] = vx[n]; vy[i] = vy[n]; vz[i] = vz[n]; life[i] = life[n]; max[i] = max[n];
                    size[i] = size[n]; r[i] = r[n]; g[i] = g[n]; b[i] = b[n]; grav[i] = grav[n]; drag[i] = drag[n];
                    continue;
                }
                vy[i] -= grav[i] * dt;
                float d = Math.max(0, 1 - drag[i] * dt);
                vx[i] *= d; vy[i] *= d; vz[i] *= d;
                x[i] += vx[i] * dt; y[i] += vy[i] * dt; z[i] += vz[i] * dt;
                if (y[i] < 0.03f && vy[i] < 0 && Math.abs(x[i]) < 4.75f && Math.abs(z[i]) < 4.75f) { y[i] = 0.03f; vy[i] = -vy[i] * 0.45f; }
                i++;
            }
        }
    }

    /** Shattered pieces: every triangle of the destroyed model becomes a tumbling shard that falls, bounces and settles. */
    static final class Frags {
        static final int MAX = 9000;
        final float[] c = new float[MAX * 3], o = new float[MAX * 9], v = new float[MAX * 3], ax = new float[MAX * 3];
        final float[] spin = new float[MAX], life = new float[MAX], age = new float[MAX], glow = new float[MAX * 3];
        final int[] alb = new int[MAX];
        int n;

        /** push = sideways shove, power = how violent, up = how much of the blast goes upward (low = crushed flat, high = blown skyward). */
        void spawn(Piece pc, float[] magic, float pushX, float pushZ, float power, float up, Random rnd) {
            Mesh m = MESH[pc.type];
            float cy = cos(pc.yaw), sy = sin(pc.yaw), hc = m.height * PS * 0.45f;
            for (int i = 0; i < m.nt && n < MAX; i++) {
                float[] w = new float[9];
                boolean accent = false, metal = false;
                for (int q = 0; q < 3; q++) {
                    int vi = m.t[i * 3 + q];
                    float lx = m.p[vi * 3] * PS, ly = m.p[vi * 3 + 1] * PS, lz = m.p[vi * 3 + 2] * PS;
                    w[q * 3] = lx * cy + lz * sy + pc.x; w[q * 3 + 1] = ly + pc.y; w[q * 3 + 2] = -lx * sy + lz * cy + pc.z;
                    accent |= m.k[vi] == 1; metal |= m.k[vi] == 2;
                }
                float mx = (w[0] + w[3] + w[6]) / 3, my = (w[1] + w[4] + w[7]) / 3, mz = (w[2] + w[5] + w[8]) / 3;
                for (int q = 0; q < 3; q++) { o[n * 9 + q * 3] = w[q * 3] - mx; o[n * 9 + q * 3 + 1] = w[q * 3 + 1] - my; o[n * 9 + q * 3 + 2] = w[q * 3 + 2] - mz; }
                c[n * 3] = mx; c[n * 3 + 1] = my; c[n * 3 + 2] = mz;
                float dx = mx - pc.x + (rnd.nextFloat() - .5f) * 0.3f, dy = my - (pc.y + hc) + (rnd.nextFloat() - .5f) * 0.3f, dz = mz - pc.z + (rnd.nextFloat() - .5f) * 0.3f;
                float l = sqrt(dx * dx + dy * dy + dz * dz) + 1e-4f, sp = power * (1.2f + rnd.nextFloat() * 4.5f);
                v[n * 3] = dx / l * sp + pushX * (1.6f + rnd.nextFloat() * 1.6f);
                v[n * 3 + 1] = (dy / l * sp + 1.5f + rnd.nextFloat() * 3.5f * power) * up;
                v[n * 3 + 2] = dz / l * sp + pushZ * (1.6f + rnd.nextFloat() * 1.6f);
                float[] a = unit(rnd.nextFloat() - .5f, rnd.nextFloat() - .5f, rnd.nextFloat() - .5f + 1e-3f);
                ax[n * 3] = a[0]; ax[n * 3 + 1] = a[1]; ax[n * 3 + 2] = a[2];
                spin[n] = (rnd.nextFloat() - .5f) * 26; life[n] = 1.7f + rnd.nextFloat() * 2.0f; age[n] = 0;
                alb[n] = accent ? pack(magic[0] * 255, magic[1] * 255, magic[2] * 255) : (metal ? (pc.white ? 0xC8A050 : 0x60667E) : (pc.white ? 0xD4CCBC : 0x3A3050));
                glow[n * 3] = magic[0]; glow[n * 3 + 1] = magic[1]; glow[n * 3 + 2] = magic[2];
                n++;
            }
        }

        void update(float dt) {
            for (int i = 0; i < n; ) {
                age[i] += dt;
                if (age[i] >= life[i] || c[i * 3 + 1] < -3) {
                    n--;
                    System.arraycopy(c, n * 3, c, i * 3, 3); System.arraycopy(o, n * 9, o, i * 9, 9); System.arraycopy(v, n * 3, v, i * 3, 3);
                    System.arraycopy(ax, n * 3, ax, i * 3, 3); System.arraycopy(glow, n * 3, glow, i * 3, 3);
                    spin[i] = spin[n]; life[i] = life[n]; age[i] = age[n]; alb[i] = alb[n];
                    continue;
                }
                v[i * 3 + 1] -= 9.8f * dt;
                c[i * 3] += v[i * 3] * dt; c[i * 3 + 1] += v[i * 3 + 1] * dt; c[i * 3 + 2] += v[i * 3 + 2] * dt;
                if (c[i * 3 + 1] < 0.04f && v[i * 3 + 1] < 0 && Math.abs(c[i * 3]) < 4.75f && Math.abs(c[i * 3 + 2]) < 4.75f) {
                    c[i * 3 + 1] = 0.04f; v[i * 3 + 1] = -v[i * 3 + 1] * 0.38f; v[i * 3] *= 0.6f; v[i * 3 + 2] *= 0.6f; spin[i] *= 0.5f;
                    if (Math.abs(v[i * 3 + 1]) < 0.4f) { v[i * 3 + 1] = 0; spin[i] *= 0.3f; }
                }
                float an = spin[i] * dt, ca = cos(an), sa = sin(an), kx = ax[i * 3], ky = ax[i * 3 + 1], kz = ax[i * 3 + 2];
                for (int q = 0; q < 3; q++) {
                    int j = i * 9 + q * 3;
                    float px = o[j], py = o[j + 1], pz = o[j + 2], dot = (kx * px + ky * py + kz * pz) * (1 - ca);
                    o[j] = px * ca + (ky * pz - kz * py) * sa + kx * dot;
                    o[j + 1] = py * ca + (kz * px - kx * pz) * sa + ky * dot;
                    o[j + 2] = pz * ca + (kx * py - ky * px) * sa + kz * dot;
                }
                i++;
            }
        }
    }

    /** One move being acted out on the board. */
    static final class Anim {
        Move m; Piece mover, victim, rook;
        float fx, fz, tx, tz, rfx, rtx, t, dist, dx, dz, travelT0, travelDur;
        float bx, by, bz, ex, ey, ez, slash = -1;                    // projectile / beam ends / sword swing progress
        float boomT = -1; boolean slowmo;                            // when the victim was destroyed; whether time should run slowly now
        final float[] orbs = new float[9]; int orbMask;
        int step, ev;                                                // footsteps taken, one-time events already fired
        boolean hit, orbOn, beamOn, moverWhite;
    }

    /** Screen-space triangles waiting to be drawn. */
    static final class TriList {
        float[] v = new float[9 * 8192]; int[] c = new int[3 * 8192], a = new int[8192]; int n;
        void add(float x0, float y0, float z0, int c0, float x1, float y1, float z1, int c1, float x2, float y2, float z2, int c2, int aux) {
            if (n * 9 + 9 > v.length) { v = Arrays.copyOf(v, v.length * 2); c = Arrays.copyOf(c, c.length * 2); a = Arrays.copyOf(a, a.length * 2); }
            int o = n * 9, q = n * 3;
            a[n] = aux;
            v[o] = x0; v[o + 1] = y0; v[o + 2] = z0; c[q] = c0;
            if ((x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0) < 0) {
                v[o + 3] = x2; v[o + 4] = y2; v[o + 5] = z2; c[q + 1] = c2; v[o + 6] = x1; v[o + 7] = y1; v[o + 8] = z1; c[q + 2] = c1;
            } else {
                v[o + 3] = x1; v[o + 4] = y1; v[o + 5] = z1; c[q + 1] = c1; v[o + 6] = x2; v[o + 7] = y2; v[o + 8] = z2; c[q + 2] = c2;
            }
            n++;
        }
    }

    // ═══════════════════════════════════════════ THE GAME ═══════════════════════════════════════════

    static final class Snap { Rules r; int half, ghosts; }

    /** The spirit of a captured piece. */
    static final class Ghost { int type, slot; boolean white; float sx, sy, sz, gx, gy, gz, wx, wy, wz, age; }

    /** A castle coming down: every triangle of its walls waits its turn, then falls and tumbles. */
    static final class Rubble {
        final int n; final float[] c, o, v, ax, spin, delay, ground; final int[] col, aux; final byte[] state;
        Rubble(int n) {
            this.n = n; c = new float[n * 3]; o = new float[n * 9]; v = new float[n * 3]; ax = new float[n * 3];
            spin = new float[n]; delay = new float[n]; ground = new float[n]; col = new int[n * 3]; aux = new int[n]; state = new byte[n];
        }
    }

    static final class Game {
        // ---- chess state
        Rules rules = new Rules();
        final ArrayList<Snap> history = new ArrayList<>();
        final ArrayList<Long> keys = new ArrayList<>();                // every position so far, to spot threefold repetition
        int halfmove;                                                  // moves since a capture or pawn move (50-move rule)
        final ArrayList<Piece> pieces = new ArrayList<>();
        final Piece[] at = new Piece[64];
        List<Move> legal, selMoves = new ArrayList<>(), promo;
        int selected = -1, hover = -1, lastFrom = -1, lastTo = -1;
        boolean inCheck, over, menu = true, started; String banner; float mateTimer = -1;
        Anim anim;
        // ---- computer opponent (aiLevel 0 = two human players)
        int aiLevel; boolean humanWhite = true, thinking; Brain brain; volatile Move aiResult; volatile int aiToken; float aiWait;
        // ---- sound
        Audio audio; float howlTimer = 22;
        // ---- online play
        Net net; boolean online, hostWhite = true; final ArrayList<int[]> pending = new ArrayList<>(); String netNote;
        // ---- kill-cam: the camera position to go back to, slow motion, cinema bars
        boolean killCam = true, inKill; final float[] camSave = new float[5]; float slow = 1, liftK = 1, liftKG = 1, bars;
        // ---- storm
        static final int DROPS = 1500;
        int stormMode; float storm, flash, boltLife, nextBolt = 5, thunderIn = -1, thunderVol, thunderPan, fogK = 1, wet = 0.15f, cl0 = 0.5f;
        final float[] bolt = new float[3 * 20], rain = new float[DROPS * 3]; int boltN;
        // ---- the world reacts: ghosts of captured pieces, the loser's castle falling
        final ArrayList<Ghost> ghosts = new ArrayList<>(); final TriList ghostTris = new TriList();
        int fallen; float fallT = -1, collapseIn = -1; Rubble rubble; final float[] camSave2 = new float[5]; boolean castleCam, ruinSwapped, rumbled;
        volatile float[] ruinNear, ruinFar;
        // ---- effects
        final Random rnd = new Random(42);
        final Particles parts = new Particles();
        final Frags frags = new Frags();
        final float[] flashes = new float[4 * 7], rings = new float[4 * 7], scorch = new float[6 * 3];
        float time, shake, emberClock;
        // ---- camera (yaw 0 = behind White)
        float yaw = -1.9f, pitch = 0.16f, dist = 52, tx, ty, tz;
        float yawG = -0.17f, pitchG = 0.40f, distG = 14.5f, txG, tzG;
        boolean tactical;
        float camX, camY, camZ, fx, fy, fz, rx, rz, ux, uy, uz, F, cxc, cyc;
        // ---- renderer
        static final float NEAR = 0.25f;
        static final int SM = 256, BT = 1024, CT = 256, MT = 256, GT = 1024;
        static final float GEXT = 133;
        static final float QD0 = 1 - cos(MOON_RAD * 0.96f), QD1 = 1 - cos(MOON_RAD * 1.04f);
        final World world = buildWorld();
        final int[] btex = new int[BT * BT], sky = new int[512], toneR = new int[256], toneG = new int[256], toneB = new int[256];
        final float[] ctex = new float[CT * CT], mtex = new float[MT * MT], sm = new float[SM * SM], sm2 = new float[SM * SM], ao = new float[SM * SM];
        final float[] fogLut = new float[1024], gtex = new float[GT * GT * 2];
        final float[] starDir, starB; final int[] starC; final int nStars = 1700;
        int W, H; float[] zb, rzb; int[] rpix, aux, buf;
        final TriList main = new TriList(), refl = new TriList();
        float[] VX, VY, VZ, SX, SY, IZ; int[] SC; int curAux;
        final float[] cin = new float[18], cout = new float[36], cpx = new float[6], cpy = new float[6], cpz = new float[6];
        final int[] cpc = new int[6];
        final float[] LT = new float[8 * 7]; int nL;
        float[] SP = new float[7 * 2048]; int nSP;
        final float[] tint = new float[64 * 3]; final byte[] mark = new byte[64]; float[] markCol = ICE;
        final int bands = Math.max(4, Math.min(48, Runtime.getRuntime().availableProcessors() * 3));

        Game() {
            int maxV = world.nv;
            for (int t = 1; t <= 6; t++) maxV = Math.max(maxV, Math.max(MESH[t].nv, Math.max(MESHMID[t].nv, MESHHI[t].nv)));
            VX = new float[maxV]; VY = new float[maxV]; VZ = new float[maxV]; SX = new float[maxV]; SY = new float[maxV]; IZ = new float[maxV]; SC = new int[maxV];
            // board texture: polished marble squares
            for (int y = 0; y < BT; y++) for (int x = 0; x < BT; x++) {
                float u = x * 8f / BT, v = y * 8f / BT;
                int file = (int) u, rank = (int) v;
                float fu = u - file, fv = v - rank, edge = Math.min(Math.min(fu, 1 - fu), Math.min(fv, 1 - fv));
                float marble = fbm(u * 1.7f + file * 13.1f, v * 1.7f + rank * 7.7f, 4), grain = fbm(u * 9 + 3, v * 9 + 8, 3);
                float vein = (float) Math.pow(1 - Math.abs(2 * fbm(u * 2.1f + 50 + file * 3.3f, v * 2.1f + 50, 4) - 1), 7);
                float r, g, b;
                if ((file + rank) % 2 == 0) { float s = 0.66f + 0.5f * marble + 0.16f * grain; r = 50 * s + vein * 46; g = 40 * s + vein * 30; b = 68 * s + vein * 70; }
                else { float s = 0.76f + 0.30f * marble + 0.10f * grain; r = 186 * s - vein * 40; g = 180 * s - vein * 38; b = 172 * s - vein * 26; }
                float k = edge < 0.014f ? 0.32f : (edge < 0.028f ? 1.08f : 1f);
                btex[y * BT + x] = pack(r * k, g * k, b * k);
            }
            // sky colours by height above the horizon
            for (int i = 0; i < 512; i++) {
                float e = i / 511f * 2 - 1;
                sky[i] = e <= 0 ? FOG : mix(FOG, mix(0x201D44, 0x04050D, (float) Math.pow(e, 0.5)), smooth(0, 0.08f, e));
            }
            for (int i = 0; i < 1024; i++) fogLut[i] = 1 - (float) Math.exp(-i / 200f);
            // final colour grade: gentle lift of the mid-tones, slightly cool shadows
            for (int i = 0; i < 256; i++) {
                float x = i / 255f, y = x * 1.32f / (1 + 0.32f * x);
                toneR[i] = (int) clamp(255 * y, 0, 255); toneG[i] = (int) clamp(255 * y + 1, 0, 255); toneB[i] = (int) clamp(255 * y + 4 * (1 - x), 0, 255);
            }
            // tiling noise used for clouds, mist and surface detail
            for (int y = 0; y < CT; y++) for (int x = 0; x < CT; x++) {
                float s = 0, a = 0.5f, tot = 0; int per = 4;
                for (int o = 0; o < 5; o++) {
                    float px = x * per / (float) CT, py = y * per / (float) CT;
                    int xi = (int) px, yi = (int) py; float gx = px - xi, gy = py - yi;
                    gx = gx * gx * (3 - 2 * gx); gy = gy * gy * (3 - 2 * gy);
                    int x1 = (xi + 1) % per, y1 = (yi + 1) % per;
                    s += a * lerp(lerp(hash(xi + o * 57, yi), hash(x1 + o * 57, yi), gx), lerp(hash(xi + o * 57, y1), hash(x1 + o * 57, y1), gx), gy);
                    tot += a; a *= 0.55f; per *= 2;
                }
                ctex[y * CT + x] = s / tot;
            }
            // ground detail (patches of darker and lighter earth), baked once so it is cheap to look up for every pixel
            // together with how much of the ground's light is moonlight at each spot (that part disappears in shadow)
            float gs = 2 * GEXT / GT;
            float[] gh = new float[(GT + 2) * (GT + 2)];
            IntStream.range(0, GT + 2).parallel().forEach(y -> { for (int x = 0; x < GT + 2; x++) gh[y * (GT + 2) + x] = terrainH((x - 0.5f) * gs - GEXT, (y - 0.5f) * gs - GEXT); });
            float lumM = 0.3f * MOONC[0] + 0.55f * MOONC[1] + 0.15f * MOONC[2], lumA = 0.3f * AMBC[0] + 0.55f * AMBC[1] + 0.15f * AMBC[2];
            for (int y = 0; y < GT; y++) for (int x = 0; x < GT; x++) {
                float wx = (x + 0.5f) * gs - GEXT, wz = (y + 0.5f) * gs - GEXT;
                int hi = (y + 1) * (GT + 2) + x + 1;
                float nx = gh[hi - 1] - gh[hi + 1], nz = gh[hi - GT - 2] - gh[hi + GT + 2], ny = 2 * gs, nl = sqrt(nx * nx + ny * ny + nz * nz);
                nx /= nl; ny /= nl; nz /= nl;
                float moon = lumM * Math.max(0, nx * MOON[0] + ny * MOON[1] + nz * MOON[2]) * 1.9f;
                float base = lumA * (0.5f + 0.5f * ny) + 0.5855f * 0.30f * Math.max(0, -nx * MOON[0] + ny * 0.4f - nz * MOON[2]);
                gtex[(y * GT + x) * 2] = 0.60f + 0.80f * (cloud(wx * 0.031f, wz * 0.031f) * 0.55f + cloud(wx * 0.0075f + 0.37f, wz * 0.0075f + 0.11f) * 0.45f);
                gtex[(y * GT + x) * 2 + 1] = moon / (base + moon + 1e-6f);
            }
            // the face of the moon: dark seas, bright highlands, craters with raised rims
            Random mr = new Random(5);
            float[] cr = new float[60 * 3];
            for (int i = 0; i < 60; i++) { cr[i * 3] = mr.nextFloat(); cr[i * 3 + 1] = mr.nextFloat(); cr[i * 3 + 2] = 0.012f + 0.05f * mr.nextFloat() * mr.nextFloat(); }
            for (int y = 0; y < MT; y++) for (int x = 0; x < MT; x++) {
                float u = x / (float) MT, v = y / (float) MT;
                float tone = 0.80f + 0.20f * fbm(u * 8, v * 8, 4) - 0.27f * smooth(0.47f, 0.60f, fbm(u * 2.7f + 9, v * 2.7f + 2, 4));
                for (int i = 0; i < 60; i++) {
                    float dx = u - cr[i * 3], dy = v - cr[i * 3 + 1], d = sqrt(dx * dx + dy * dy) / cr[i * 3 + 2];
                    if (d < 1) tone += d > 0.78f ? 0.10f * (1 - Math.abs(d - 0.89f) / 0.11f) : -0.06f;
                }
                mtex[y * MT + x] = tone;
            }
            // stars
            starDir = new float[nStars * 3]; starB = new float[nStars]; starC = new int[nStars];
            Random sr = new Random(3);
            for (int i = 0; i < nStars; i++) {
                float y = 0.03f + sr.nextFloat() * 0.97f, a = sr.nextFloat() * TAU, rr = sqrt(1 - y * y);
                starDir[i * 3] = cos(a) * rr; starDir[i * 3 + 1] = y; starDir[i * 3 + 2] = sin(a) * rr;
                starB[i] = 40 + 215 * (float) Math.pow(sr.nextFloat(), 3.4);
                float tn = sr.nextFloat();
                starC[i] = tn < 0.6f ? 0xDCE6FF : (tn < 0.85f ? 0xFFF0D8 : 0xBFD0FF);
            }
            newGame();
        }

        // ─────────────────────────────── game flow ───────────────────────────────

        /** Start a game. level 0 = two players, 1-3 = computer opponent of that strength. */
        void start(int level, boolean playWhite) {
            closeNet();
            aiLevel = level; humanWhite = playWhite || level == 0;
            begin();
        }

        /** Start a game against a friend on another computer (the connection is already open). */
        void startOnline(boolean playWhite) { aiLevel = 0; online = true; humanWhite = playWhite; netNote = null; begin(); }

        void begin() {
            newGame();
            menu = false; started = true; tactical = false;
            float target = humanWhite ? -0.17f : PI - 0.17f;
            yawG = target + TAU * Math.round((yaw - target) / TAU);            // turn the short way round
            pitchG = 0.40f; distG = 14.5f; txG = 0; tzG = 0;
        }

        void newGame() {
            cancelAI();
            rules = new Rules(); history.clear(); keys.clear(); keys.add(rules.key()); halfmove = 0;
            anim = null; promo = null; over = false; banner = null; mateTimer = -1; lastFrom = lastTo = -1;
            ghosts.clear(); pending.clear(); collapseIn = -1; inKill = false; liftKG = 1;
            restoreCastle();
            syncPieces();
        }

        void syncPieces() {
            pieces.clear(); Arrays.fill(at, null); selected = -1; selMoves = new ArrayList<>();
            for (int s = 0; s < 64; s++) {
                int p = rules.b[s];
                if (p == 0) continue;
                Piece pc = new Piece();
                pc.type = Math.abs(p); pc.white = p > 0; pc.sq = s; pc.x = (s & 7) - 3.5f; pc.z = (s >> 3) - 3.5f; pc.yaw = pc.white ? 0 : PI;
                pieces.add(pc); at[s] = pc;
            }
            legal = rules.legal(); inCheck = rules.inCheck(rules.white);
        }

        void undo() {
            if (history.isEmpty() || anim != null || online) return;
            cancelAI();
            // against the computer, take back its reply as well so it is your turn again
            int steps = aiLevel > 0 && rules.white == humanWhite && history.size() >= 2 ? 2 : 1;
            for (int i = 0; i < steps; i++) {
                Snap s = history.remove(history.size() - 1);
                rules = s.r; halfmove = s.half; keys.remove(keys.size() - 1);
                while (ghosts.size() > s.ghosts) ghosts.remove(ghosts.size() - 1);
            }
            collapseIn = -1;
            restoreCastle();
            over = false; banner = null; mateTimer = -1; promo = null; lastFrom = lastTo = -1;
            syncPieces();
        }

        void select(int s) {
            selected = s; selMoves = new ArrayList<>();
            if (s >= 0) { for (Move m : legal) if (m.from == s) selMoves.add(m); sfx(Audio.SELECT, 0.5f, (s & 7) - 3.5f, (s >> 3) - 3.5f, 1); }
        }

        boolean aiTurn() { return aiLevel > 0 && rules.white != humanWhite; }

        boolean remoteTurn() { return online && rules.white != humanWhite; }

        void click(float mx, float my) {
            if (menu || anim != null || over || promo != null || aiTurn() || remoteTurn()) return;
            int s = pick(mx, my);
            if (s < 0) { select(-1); return; }
            if (selected >= 0) {
                List<Move> ms = new ArrayList<>();
                for (Move m : selMoves) if (m.to == s) ms.add(m);
                if (ms.size() > 1) { promo = ms; return; }
                if (ms.size() == 1) { startMove(ms.get(0)); return; }
            }
            int p = rules.b[s];
            select(p != 0 && (p > 0) == rules.white && s != selected ? s : -1);
        }

        /** Used by tests: play a move given as two squares. */
        boolean tryMove(int from, int to) {
            for (Move m : legal) if (m.from == from && m.to == to && (m.promo == 0 || m.promo == QUEEN)) { startMove(m); return true; }
            return false;
        }

        // ─────────────────────────────── computer opponent ───────────────────────────────

        void cancelAI() {
            aiToken++;
            if (brain != null) brain.stop = true;
            thinking = false; aiResult = null; aiWait = 0;
        }

        /** The AI thinks on its own thread so the picture keeps moving; its answer is picked up here. */
        void runAI(float dt) {
            aiWait += dt;
            if (!thinking) {
                thinking = true; aiResult = null;
                final int tok = ++aiToken, lvl = aiLevel;
                final Rules snap = rules.copy();
                final Set<Long> seen = new HashSet<>(keys);
                final Brain br = brain = new Brain();
                Thread t = new Thread(() -> { Move m = br.choose(snap, lvl, seen, new Random()); if (tok == aiToken) aiResult = m; }, "nightfall-ai");
                t.setDaemon(true);
                t.start();
            } else if (aiResult != null && aiWait > 0.75f) {
                Move r = aiResult;
                aiResult = null; thinking = false; aiWait = 0;
                for (Move m : legal) if (m.from == r.from && m.to == r.to && m.promo == r.promo) { startMove(m); break; }
            }
        }

        // ─────────────────────────────── moves ───────────────────────────────

        void startMove(Move m) {
            Snap sn = new Snap(); sn.r = rules.copy(); sn.half = halfmove; sn.ghosts = ghosts.size(); history.add(sn);
            Anim a = new Anim();
            a.m = m; a.mover = at[m.from]; a.victim = m.captureSq >= 0 ? at[m.captureSq] : null; a.moverWhite = rules.white;
            halfmove = a.mover.type == PAWN || a.victim != null ? 0 : halfmove + 1;
            rules.make(m);
            keys.add(rules.key());
            if (m.captureSq >= 0) at[m.captureSq] = null;
            at[m.from] = null; at[m.to] = a.mover; a.mover.sq = m.to;
            a.fx = a.mover.x; a.fz = a.mover.z; a.tx = (m.to & 7) - 3.5f; a.tz = (m.to >> 3) - 3.5f;
            a.dx = a.tx - a.fx; a.dz = a.tz - a.fz; a.dist = sqrt(a.dx * a.dx + a.dz * a.dz); a.dx /= a.dist; a.dz /= a.dist;
            a.travelDur = travelDur(a.mover.type, a.dist);
            if (m.castle) {
                int r = m.from >> 3; boolean ks = (m.to & 7) == 6;
                int rf = ks ? r * 8 + 7 : r * 8, rt = ks ? r * 8 + 5 : r * 8 + 3;
                a.rook = at[rf]; at[rf] = null; at[rt] = a.rook; a.rook.sq = rt; a.rfx = a.rook.x; a.rtx = (rt & 7) - 3.5f;
            }
            if (online && a.moverWhite == humanWhite && net != null) net.send("MOVE " + m.from + " " + m.to + " " + m.promo);
            if (a.victim != null && killCam) beginKill(a);
            anim = a; promo = null; selected = -1; selMoves = new ArrayList<>(); lastFrom = m.from; lastTo = m.to; inCheck = false;
        }

        void finishMove() {
            Anim a = anim; Piece p = a.mover;
            endKill();
            p.x = a.tx; p.z = a.tz; p.y = 0; p.tilt = 0; p.glow = 1; p.shake = 0; p.spin = 0; p.scale = 1;
            if (a.rook != null) { a.rook.x = a.rtx; a.rook.y = 0; a.rook.tilt = 0; sfx(Audio.THUD, 0.6f, a.rook.x, a.rook.z); }
            float[] mg = a.moverWhite ? ICE : VIOLET;
            if (p.type == PAWN) sfx(Audio.TAP, 0.6f, p.x, p.z);
            else if (p.type == KNIGHT || p.type == KING) sfx(Audio.THUD, p.type == KNIGHT ? 0.8f : 0.6f, p.x, p.z);
            else if (p.type == BISHOP) sfx(Audio.TAP, 0.45f, p.x, p.z, 0.8f);
            if (a.m.promo != 0) {
                p.type = a.m.promo;
                burst(p.x, 0.8f, p.z, mg, 160, 5f); flash(p.x, 1f, p.z, mg, 1.3f); ring(p.x, p.z, mg);
                sfx(Audio.PROMOTE, 0.8f, p.x, p.z, 1);
            } else if (p.type != QUEEN) for (int i = 0; i < 10; i++) {            // a puff where the piece lands
                float an = rnd.nextFloat() * TAU;
                parts.add(p.x + cos(an) * 0.3f, 0.05f, p.z + sin(an) * 0.3f, cos(an) * 1.2f, 0.3f, sin(an) * 1.2f, 0.35f, 0.07f, 46, 46, 52, 0, 3);
            }
            anim = null;
            legal = rules.legal(); inCheck = rules.inCheck(rules.white);
            int same = 0;
            long key = keys.get(keys.size() - 1);
            for (long k : keys) if (k == key) same++;
            if (legal.isEmpty()) {
                over = true;
                if (inCheck) { banner = (rules.white ? "Black" : "White") + " wins by checkmate"; mateTimer = 0.9f; sfx(Audio.MATE, 1f, 0, 0, 1); }
                else banner = "Stalemate — the game is drawn";
            } else if (rules.insufficient()) { over = true; banner = "Draw — not enough pieces left to win"; }
            else if (same >= 3) { over = true; banner = "Draw — the same position three times"; }
            else if (halfmove >= 100) { over = true; banner = "Draw — fifty moves without progress"; }
            else if (inCheck) sfx(Audio.CHECK, 0.7f, 0, 0, 1);
        }

        // ─────────────────────────────── effects ───────────────────────────────

        void sfx(int id, float vol, float x, float z) { sfx(id, vol, x, z, 0.94f + rnd.nextFloat() * 0.12f); }

        /** Play a sound from a spot on the board: quieter when far from the camera, panned left or right. */
        void sfx(int id, float vol, float x, float z, float pitch) {
            if (audio == null || !audio.ok) return;
            float dx = x - camX, dz = z - camZ, d = sqrt(dx * dx + camY * camY + dz * dz);
            audio.play(id, vol * clamp(18f / (8f + d), 0.25f, 1.25f), clamp((dx * rx + dz * rz) / 9f, -0.8f, 0.8f), pitch);
        }

        void burst(float x, float y, float z, float[] col, int count, float speed) {
            for (int i = 0; i < count; i++) {
                float[] d = unit(rnd.nextFloat() - .5f, rnd.nextFloat() - .3f, rnd.nextFloat() - .5f + 1e-3f);
                float sp = speed * (0.25f + rnd.nextFloat()), hot = rnd.nextFloat();
                parts.add(x, y, z, d[0] * sp, d[1] * sp + 1.5f, d[2] * sp, 0.45f + rnd.nextFloat() * 0.9f, 0.05f + rnd.nextFloat() * 0.09f,
                        lerp(col[0], 1, hot * 0.6f) * 230, lerp(col[1], 1, hot * 0.6f) * 230, lerp(col[2], 1, hot * 0.6f) * 230, 7f, 1.2f);
            }
        }

        /** Slow grey dust that hangs in the air for a moment. */
        void dust(float x, float y, float z, int count, float spread) {
            for (int i = 0; i < count; i++) {
                float an = rnd.nextFloat() * TAU, sp = spread * (0.3f + rnd.nextFloat());
                parts.add(x, y + rnd.nextFloat() * 0.3f, z, cos(an) * sp, 0.2f + rnd.nextFloat() * 0.9f, sin(an) * sp, 0.7f + rnd.nextFloat() * 0.9f,
                        0.22f + rnd.nextFloat() * 0.25f, 20, 21, 26, -0.2f, 2.2f);
            }
        }

        void flash(float x, float y, float z, float[] col, float power) {
            int best = 0;
            for (int i = 1; i < 4; i++) if (flashes[i * 7 + 3] < flashes[best * 7 + 3]) best = i;
            int o = best * 7;
            flashes[o] = x; flashes[o + 1] = y; flashes[o + 2] = z; flashes[o + 3] = power; flashes[o + 4] = col[0]; flashes[o + 5] = col[1]; flashes[o + 6] = col[2];
        }

        void ring(float x, float z, float[] col) {
            int best = 0;
            for (int i = 1; i < 4; i++) if (rings[i * 7 + 3] < rings[best * 7 + 3]) best = i;
            int o = best * 7;
            rings[o] = x; rings[o + 1] = z; rings[o + 2] = 0.2f; rings[o + 3] = 1; rings[o + 4] = col[0]; rings[o + 5] = col[1]; rings[o + 6] = col[2];
        }

        /** Blow a piece to bits. 'up' shapes the blast: low = crushed flat, high = thrown skyward. */
        void explode(Piece v, float[] magic, float pushX, float pushZ, float power, float up) {
            v.alive = false; pieces.remove(v);
            if (v.type != KING) addGhost(v);
            if (anim != null && anim.boomT < 0) anim.boomT = anim.t;
            frags.spawn(v, magic, pushX, pushZ, power, up, rnd);
            float h = MESH[v.type].height * PS * 0.5f;
            burst(v.x, h, v.z, magic, (int) (170 * power), 6.5f * power);
            dust(v.x, 0.1f, v.z, (int) (26 * power), 2.2f * power);
            flash(v.x, h + 0.3f, v.z, magic, 1.6f * power); ring(v.x, v.z, magic);
            int best = 0;                                                      // leave a scorch mark on the marble
            for (int i = 1; i < 6; i++) if (scorch[i * 3 + 2] < scorch[best * 3 + 2]) best = i;
            scorch[best * 3] = v.x; scorch[best * 3 + 1] = v.z; scorch[best * 3 + 2] = 1;
            shake = Math.max(shake, 0.22f * power);
            sfx(Audio.EXPLODE, 0.95f * power, v.x, v.z);
        }

        void update(float dt) {
            time += dt;
            float k = 1 - (float) Math.exp(-dt * (time < 5 ? 1.5f : (inKill ? 7.5f : 5.5f)));   // the first seconds are a slow fly-in
            if (menu && !castleCam) yawG += dt * 0.03f;                            // drift around the scene behind the menu
            yaw += (yawG - yaw) * k; pitch += (pitchG - pitch) * k; dist += (distG - dist) * k;
            tx += (txG - tx) * k; tz += (tzG - tz) * k; liftK += (liftKG - liftK) * k;
            bars += ((inKill || castleCam ? 1 : 0) - bars) * Math.min(1, dt * 7);
            float gy = Math.max(0, terrainH(tx, tz) + 1.2f);
            if (tx * tx + tz * tz < 49) gy = 0;
            ty += (gy - ty) * k;
            shake *= (float) Math.exp(-dt * 7);
            // slow motion around the moment of impact: the game's clock runs slowly, the camera's does not
            slow += ((killCam && anim != null && anim.slowmo ? 0.2f : 1) - slow) * Math.min(1, dt * 18);
            float gdt = dt * slow;
            pollNet();
            if (anim != null) animate(gdt);
            else if (!menu && !over && promo == null) {
                if (aiTurn()) runAI(dt);
                else if (remoteTurn() && !pending.isEmpty()) {                     // the friend's move has arrived
                    int[] mv = pending.remove(0);
                    Move found = null;
                    for (Move m : legal) if (m.from == mv[0] && m.to == mv[1] && m.promo == mv[2]) found = m;
                    if (found != null) startMove(found);
                    else { closeNet(); over = true; banner = "The two games no longer match"; }
                }
            }
            if (mateTimer > 0) {
                mateTimer -= dt;
                if (mateTimer <= 0) {
                    Piece kg = at[rules.kingSq(rules.white)];
                    if (kg != null) { at[kg.sq] = null; explode(kg, rules.white ? VIOLET : ICE, 0, 0, 1.6f, 1.2f); }
                    collapseIn = 1.5f;                                             // and then the loser's castle falls
                }
            }
            if (collapseIn > 0) { collapseIn -= dt; if (collapseIn <= 0) startCollapse(rules.white ? 2 : 1); }
            frags.update(gdt); parts.update(gdt);
            for (int i = 0; i < 4; i++) {
                flashes[i * 7 + 3] *= (float) Math.exp(-dt * 6);
                if (rings[i * 7 + 3] > 0) { rings[i * 7 + 2] += gdt * 5.5f; rings[i * 7 + 3] -= gdt * 1.7f; }
            }
            for (int i = 0; i < 6; i++) scorch[i * 3 + 2] = Math.max(0, scorch[i * 3 + 2] - dt / 10);
            updateGhosts(dt);
            if (fallT >= 0) updateRubble(dt);
            updateWeather(dt);
            // brazier flames (a hot core inside redder tongues), rising embers, drifting motes
            emberClock += dt;
            while (emberClock > 0.016f) {
                emberClock -= 0.016f;
                float[] L = BRAZIERS[rnd.nextInt(4)];
                parts.add(L[0] + (rnd.nextFloat() - .5f) * 0.3f, 1.10f, L[2] + (rnd.nextFloat() - .5f) * 0.3f, (rnd.nextFloat() - .5f) * 0.3f, 0.8f + rnd.nextFloat() * 1.0f,
                        (rnd.nextFloat() - .5f) * 0.3f, 0.30f + rnd.nextFloat() * 0.38f, 0.15f + rnd.nextFloat() * 0.11f, 105, 40 + rnd.nextFloat() * 24, 8, -0.7f, 0.5f);
                if (rnd.nextFloat() < 0.4f)
                    parts.add(L[0] + (rnd.nextFloat() - .5f) * 0.14f, 1.08f, L[2] + (rnd.nextFloat() - .5f) * 0.14f, 0, 0.5f + rnd.nextFloat() * 0.4f, 0,
                            0.16f + rnd.nextFloat() * 0.14f, 0.10f, 150, 112, 46, -0.3f, 0.5f);
                if (rnd.nextFloat() < 0.10f)
                    parts.add(L[0], 1.3f, L[2], (rnd.nextFloat() - .5f) * 1.2f, 1.5f + rnd.nextFloat() * 1.5f, (rnd.nextFloat() - .5f) * 1.2f, 1.2f + rnd.nextFloat(), 0.03f, 255, 150, 40, -0.3f, 0.5f);
                if (rnd.nextFloat() < 0.08f) {
                    float an = rnd.nextFloat() * TAU, r = 5 + rnd.nextFloat() * 16;
                    parts.add(cos(an) * r, 0.2f + rnd.nextFloat() * 5, sin(an) * r, (rnd.nextFloat() - .5f) * 0.4f, 0.1f + rnd.nextFloat() * 0.2f, (rnd.nextFloat() - .5f) * 0.4f,
                            3 + rnd.nextFloat() * 3, 0.045f, 34, 96, 78, 0, 0);
                }
            }
            howlTimer -= dt;
            if (howlTimer < 0 && audio != null && audio.ok) {
                howlTimer = 40 + rnd.nextFloat() * 50;
                audio.play(Audio.HOWL, 0.10f + rnd.nextFloat() * 0.06f, rnd.nextFloat() * 1.4f - 0.7f, 0.88f + rnd.nextFloat() * 0.22f);
            }
        }

        // ─────────────────────────────── animation: every piece moves and fights its own way ───────────────────────────────

        static final int E_T1 = 1, E_T2 = 2, E_A = 4, E_B = 8, E_C = 16, E_D = 32, E_BOOM = 64, E_H0 = 256;

        /** True the first time it is asked about an event during one move; used for "play this sound once". */
        boolean once(Anim a, int bit) { if ((a.ev & bit) != 0) return false; a.ev |= bit; return true; }

        static float travelDur(int type, float d) {
            switch (type) {
                case PAWN: return 0.30f + 0.16f * d;
                case KNIGHT: return 0.62f;
                case BISHOP: return 0.42f + 0.07f * d;
                case ROOK: return 0.50f + 0.09f * d;
                case QUEEN: return 0.72f;
                default: return 0.45f + 0.30f * d;
            }
        }

        void animate(float dt) {
            Anim a = anim;
            a.t += dt;
            a.slowmo = a.boomT >= 0 && a.t < a.boomT + 0.14f;                    // linger on the moment just after the hit
            if (a.victim != null && !a.hit) { attack(a); return; }
            if (a.travelDur <= 0) { finishMove(); return; }
            float u = clamp((a.t - a.travelT0) / a.travelDur, 0, 1);
            travel(a, u);
            if (a.rook != null) {                                              // castling: the rook vaults over its king
                float s = ease(u);
                a.rook.x = lerp(a.rfx, a.rtx, s); a.rook.y = 0.85f * sin(PI * s);
                a.rook.tiltX = 0; a.rook.tiltZ = a.rtx > a.rfx ? -1 : 1; a.rook.tilt = 0.22f * sin(TAU * s);
            }
            if (u >= 1) finishMove();
        }

        /** How a piece crosses the board. u runs from 0 to 1 over the move. */
        void travel(Anim a, float u) {
            Piece p = a.mover;
            float[] mg = a.moverWhite ? ICE : VIOLET;
            float x0 = a.fx, z0 = a.fz, x1 = a.tx, z1 = a.tz, ddx = x1 - x0, ddz = z1 - z0, d = sqrt(ddx * ddx + ddz * ddz);
            float ux2 = d > 1e-4f ? ddx / d : a.dx, uz2 = d > 1e-4f ? ddz / d : a.dz, s = ease(u);
            p.tiltX = uz2; p.tiltZ = -ux2; p.scale = 1; p.spin = 0; p.shake = 0; p.glow = 1;
            switch (p.type) {
                case PAWN: {                                                   // marches in little hops, one per square
                    int hops = Math.max(1, Math.round(d));
                    float ph = u * hops;
                    p.x = lerp(x0, x1, s); p.z = lerp(z0, z1, s);
                    p.y = 0.18f * Math.abs(sin(PI * ph)); p.tilt = 0.10f * sin(PI * u);
                    if ((int) ph > a.step && (int) ph < hops) { a.step = (int) ph; sfx(Audio.TAP, 0.4f, p.x, p.z); }
                    break;
                }
                case KNIGHT: {                                                 // rears up, leaps in a high arc, lands nose-down
                    if (once(a, E_T1)) sfx(Audio.CLOP, 0.6f, p.x, p.z);
                    p.x = lerp(x0, x1, s); p.z = lerp(z0, z1, s);
                    p.y = 1.3f * sin(PI * u); p.tilt = -0.42f * sin(TAU * u);
                    break;
                }
                case BISHOP: {                                                 // floats off the ground and glides, weaving, with a trail of sparks
                    if (once(a, E_T1)) sfx(Audio.WHOOSH, 0.45f, p.x, p.z, 1.15f);
                    float sway = 0.14f * sin(TAU * 1.5f * u) * sin(PI * u);
                    p.x = lerp(x0, x1, s) - uz2 * sway; p.z = lerp(z0, z1, s) + ux2 * sway;
                    p.y = 0.34f * sin(PI * u); p.tilt = 0.10f * sin(PI * u); p.glow = 1 + 1.6f * sin(PI * u);
                    parts.add(p.x + (rnd.nextFloat() - .5f) * 0.3f, p.y + 0.05f, p.z + (rnd.nextFloat() - .5f) * 0.3f, 0, -0.3f, 0, 0.4f + rnd.nextFloat() * 0.3f, 0.05f,
                            mg[0] * 150, mg[1] * 150, mg[2] * 150, 0, 0);
                    break;
                }
                case ROOK: {                                                   // too heavy to lift: grinds across the stone, then stops with a jolt
                    if (once(a, E_T1)) sfx(Audio.SLIDE, 0.65f, p.x, p.z, 0.8f / Math.max(0.6f, a.travelDur));
                    float g = u < 0.82f ? (float) Math.pow(u / 0.82f, 2.1) : 1;
                    p.x = lerp(x0, x1, g); p.z = lerp(z0, z1, g); p.y = 0;
                    if (u < 0.82f) {
                        p.tilt = -0.05f; p.shake = 0.025f;
                        if (u > 0.1f) for (int i = 0; i < 2; i++) {
                            float an = rnd.nextFloat() * TAU;
                            parts.add(p.x + cos(an) * 0.3f - ux2 * 0.2f, 0.04f, p.z + sin(an) * 0.3f - uz2 * 0.2f, -ux2 * 1.5f + (rnd.nextFloat() - .5f), 0.4f + rnd.nextFloat(),
                                    -uz2 * 1.5f + (rnd.nextFloat() - .5f), 0.25f + rnd.nextFloat() * 0.3f, 0.04f, 200, 150, 70, 5, 1);
                        }
                    } else {
                        p.tilt = 0.17f * sin(PI * (u - 0.82f) / 0.18f);
                        if (once(a, E_T2)) { sfx(Audio.THUD, 0.9f, p.x, p.z, 0.85f); shake = Math.max(shake, 0.06f); dust(p.x, 0.05f, p.z, 10, 1.6f); }
                    }
                    break;
                }
                case QUEEN: {                                                  // spins, vanishes, streaks across as light and reappears
                    if (once(a, E_T1)) sfx(Audio.TELEPORT, 0.6f, p.x, p.z, 1);
                    a.orbOn = false;
                    if (u < 0.36f) {
                        float v = ease(u / 0.36f);
                        p.x = x0; p.z = z0; p.y = 0.55f * v; p.scale = 1 - v; p.spin = v * v * TAU * 2; p.glow = 1 + 4 * v;
                        for (int i = 0; i < 2; i++) sparkle(p.x, p.y + 0.6f, p.z, mg, 0.5f * (1 - v) + 0.1f);
                    } else if (u < 0.54f) {
                        float v = (u - 0.36f) / 0.18f;
                        p.scale = 0; p.x = lerp(x0, x1, v); p.z = lerp(z0, z1, v); p.y = 0.55f;
                        a.orbOn = true; a.bx = p.x; a.by = 0.95f; a.bz = p.z;
                        for (int i = 0; i < 4; i++) sparkle(p.x, 0.95f, p.z, mg, 0.12f);
                    } else {
                        float v = ease((u - 0.54f) / 0.46f);
                        if (once(a, E_T2)) { burst(x1, 0.8f, z1, mg, 40, 3f); ring(x1, z1, mg); }
                        p.x = x1; p.z = z1; p.scale = v * (1 + 0.22f * sin(PI * v)); p.y = 0.55f * (1 - v); p.spin = (1 - v) * (1 - v) * TAU * 2; p.glow = 1 + 3 * (1 - v);
                    }
                    break;
                }
                default: {                                                     // the king walks: slow, heavy steps, rocking from side to side
                    int steps = Math.max(2, Math.round(d * 2));
                    float ph = u * steps;
                    p.x = lerp(x0, x1, s); p.z = lerp(z0, z1, s);
                    p.y = 0.07f * Math.abs(sin(PI * ph));
                    p.tiltX = ux2; p.tiltZ = uz2; p.tilt = 0.10f * sin(PI * ph);
                    if ((int) ph > a.step && (int) ph < steps) { a.step = (int) ph; sfx(Audio.THUD, 0.4f, p.x, p.z, 0.8f); }
                }
            }
        }

        void sparkle(float x, float y, float z, float[] mg, float spread) {
            float[] d = unit(rnd.nextFloat() - .5f, rnd.nextFloat() - .5f, rnd.nextFloat() - .5f + 1e-3f);
            parts.add(x + d[0] * spread, y + d[1] * spread, z + d[2] * spread, d[0] * 0.6f, d[1] * 0.6f, d[2] * 0.6f, 0.3f + rnd.nextFloat() * 0.3f, 0.06f, mg[0] * 200, mg[1] * 200, mg[2] * 200, 0, 1);
        }

        void endAttack(Anim a) {
            Piece p = a.mover;
            a.hit = true; a.fx = p.x; a.fz = p.z; a.travelT0 = a.t; a.step = 0; a.ev &= ~(E_T1 | E_T2);
            float ddx = a.tx - a.fx, ddz = a.tz - a.fz, d = sqrt(ddx * ddx + ddz * ddz);
            a.travelDur = d < 0.05f ? 0 : travelDur(p.type, d);
            p.tilt = 0; p.shake = 0; p.spin = 0; p.glow = 1; p.y = 0;
            a.orbOn = false; a.beamOn = false; a.slash = -1; a.orbMask = 0;
        }

        /** How a piece takes another. Each kind has its own attack; when it is over the piece travels onto the square. */
        void attack(Anim a) {
            Piece p = a.mover, v = a.victim;
            float t = a.t, top = MESH[p.type].height * PS, vh = MESH[v.type].height * PS * 0.5f;
            float[] mg = a.moverWhite ? ICE : VIOLET;
            p.tiltX = a.dz; p.tiltZ = -a.dx;
            switch (p.type) {
                case PAWN: {                                                   // SPEAR THRUST: leans back, then lunges and knocks the enemy away
                    float T1 = 0.26f, T2 = 0.11f, T3 = 0.17f, cx = a.tx - a.dx * 0.62f, cz = a.tz - a.dz * 0.62f;
                    if (t < T1) {
                        float s = ease(t / T1);
                        p.x = a.fx - a.dx * 0.22f * s; p.z = a.fz - a.dz * 0.22f * s; p.tilt = -0.3f * s; p.y = 0.04f * s; v.shake = 0.02f * s;
                    } else if (t < T1 + T2) {
                        float u = (t - T1) / T2; u *= u;
                        a.slowmo = true;
                        if (once(a, E_A)) sfx(Audio.STAB, 0.8f, p.x, p.z);
                        p.x = lerp(a.fx - a.dx * 0.22f, cx, u); p.z = lerp(a.fz - a.dz * 0.22f, cz, u); p.tilt = lerp(-0.3f, 0.62f, u); p.glow = 2.5f;
                    } else {
                        if (once(a, E_BOOM)) explode(v, mg, a.dx * 1.9f, a.dz * 1.9f, 0.85f, 1f);
                        float u = clamp((t - T1 - T2) / T3, 0, 1);
                        p.x = cx; p.z = cz; p.tilt = 0.62f * (1 - ease(u)); p.glow = 2.5f - 1.5f * u;
                        if (u >= 1) endAttack(a);
                    }
                    break;
                }
                case KNIGHT: {                                                 // TRAMPLE: rears, leaps high above the enemy and crashes down on it
                    float T1 = 0.30f, T2 = 0.40f, T3 = 0.12f, T4 = 0.24f, apex = MESH[v.type].height * PS + 0.75f;
                    if (t < T1) {
                        float s = ease(t / T1);
                        if (once(a, E_A)) sfx(Audio.CLOP, 0.75f, p.x, p.z);
                        p.tilt = -0.55f * s; p.y = 0.12f * s; p.glow = 1 + 2 * s;
                    } else if (t < T1 + T2) {
                        float u = (t - T1) / T2, s = ease(u);
                        p.x = lerp(a.fx, a.tx, s); p.z = lerp(a.fz, a.tz, s); p.y = 0.12f + (apex - 0.12f) * sin(PI / 2 * u); p.tilt = lerp(-0.55f, 0.25f, u);
                        v.shake = 0.05f * u; p.glow = 3;
                    } else if (t < T1 + T2 + T3) {
                        float u = (t - T1 - T2) / T3;
                        p.x = a.tx; p.z = a.tz; p.y = apex * (1 - u * u); p.tilt = 0.25f * (1 - u); a.slowmo = true;
                        if (p.y < MESH[v.type].height * PS * 0.8f && once(a, E_BOOM)) crush(v, mg);
                    } else {
                        if (once(a, E_BOOM)) crush(v, mg);
                        float u = clamp((t - T1 - T2 - T3) / T4, 0, 1);
                        p.x = a.tx; p.z = a.tz; p.y = 0.17f * sin(PI * u); p.tilt = 0; p.glow = 3 - 2 * u;
                        if (u >= 1) endAttack(a);
                    }
                    break;
                }
                case BISHOP: {                                                 // SMITE: rises, gathers power and burns the enemy with a crackling beam
                    float T1 = 0.50f, T2 = 0.32f, T3 = 0.18f;
                    if (t < T1) {
                        float s = ease(t / T1);
                        if (once(a, E_A)) sfx(Audio.CHARGE, 0.6f, p.x, p.z, 1);
                        p.y = 0.36f * s; p.glow = 1 + 4 * s; p.tilt = -0.10f * s;
                        for (int i = 0; i < 2; i++) gather(p.x, p.y + top, p.z, mg);
                    } else if (t < T1 + T2) {
                        float u = (t - T1) / T2;
                        if (once(a, E_B)) { sfx(Audio.ZAP, 0.8f, p.x, p.z); shake = Math.max(shake, 0.05f); }
                        if (u > 0.5f) a.slowmo = true;
                        a.beamOn = true; a.bx = p.x; a.by = p.y + top; a.bz = p.z; a.ex = v.x; a.ey = vh; a.ez = v.z;
                        p.y = 0.36f; p.tilt = 0.16f; p.glow = 5; v.shake = 0.03f + 0.08f * u; v.glow = 1 + 9 * u;
                        for (int i = 0; i < 3; i++) sparkle(v.x, vh, v.z, mg, 0.35f);
                    } else {
                        a.beamOn = false;
                        if (once(a, E_BOOM)) explode(v, mg, 0, 0, 0.9f, 2.3f);       // burned away: the shards fly upward
                        float u = clamp((t - T1 - T2) / T3, 0, 1);
                        p.y = 0.36f * (1 - ease(u)); p.tilt = 0.16f * (1 - u); p.glow = 5 - 4 * u;
                        if (u >= 1) endAttack(a);
                    }
                    break;
                }
                case ROOK: {                                                   // SIEGE SHOT: tips back and lobs a burning boulder
                    float T1 = 0.30f, fl = 0.36f + 0.05f * a.dist, T3 = 0.22f;
                    if (t < T1) {
                        float s = ease(t / T1);
                        p.tilt = -0.20f * s; p.glow = 1 + 3 * s;
                    } else if (t < T1 + fl) {
                        float u = (t - T1) / fl;
                        if (once(a, E_A)) { sfx(Audio.CANNON, 1f, p.x, p.z); shake = Math.max(shake, 0.14f); burst(a.fx, top, a.fz, FIREC, 36, 3f); dust(a.fx, top, a.fz, 8, 1.2f); }
                        if (u > 0.7f) a.slowmo = true;
                        float rec = 0.28f * (u < 0.15f ? u / 0.15f : Math.max(0, 1 - (u - 0.15f) / 0.6f));
                        p.x = a.fx - a.dx * rec; p.z = a.fz - a.dz * rec; p.tilt = -0.20f * (1 - u) - 0.25f * rec; p.glow = 4 - 3 * u;
                        a.orbOn = true;
                        a.bx = lerp(a.fx, v.x, u); a.by = lerp(top, vh, u) + (0.6f + 0.32f * a.dist) * sin(PI * u); a.bz = lerp(a.fz, v.z, u);
                        for (int i = 0; i < 3; i++)
                            parts.add(a.bx + (rnd.nextFloat() - .5f) * 0.15f, a.by + (rnd.nextFloat() - .5f) * 0.15f, a.bz + (rnd.nextFloat() - .5f) * 0.15f,
                                    (rnd.nextFloat() - .5f) * 0.5f, 0.4f, (rnd.nextFloat() - .5f) * 0.5f, 0.3f + rnd.nextFloat() * 0.3f, 0.11f, 230, 110 + rnd.nextFloat() * 60, 30, -0.5f, 1);
                        v.shake = 0.03f * u;
                    } else {
                        a.orbOn = false;
                        if (once(a, E_BOOM)) { burst(v.x, vh, v.z, FIREC, 110, 6.5f); explode(v, mg, a.dx * 2.4f, a.dz * 2.4f, 1.25f, 1.1f); }
                        float u = clamp((t - T1 - fl) / T3, 0, 1);
                        p.x = a.fx; p.z = a.fz; p.tilt = 0; p.glow = 1;
                        if (u >= 1) endAttack(a);
                    }
                    break;
                }
                case QUEEN: {                                                  // ARCANE BARRAGE: rises spinning and hurls three spiralling orbs
                    float T1 = 0.46f, gap = 0.11f, fl = 0.30f, T3 = 0.24f, tEnd = T1 + 2 * gap + fl;
                    if (t < tEnd) {
                        float rise = ease(Math.min(1, t / T1));
                        if (once(a, E_A)) sfx(Audio.CHARGE, 0.6f, p.x, p.z, 1.35f);
                        if (t > tEnd - 0.12f) a.slowmo = true;
                        p.y = 0.7f * rise; p.spin = t * t * 9; p.glow = 1 + 4 * rise; v.shake = 0.02f + 0.05f * t / tEnd;
                        a.orbMask = 0;
                        float sx = -a.dz, sz = a.dx;                           // sideways, for the spiral
                        for (int k = 0; k < 3; k++) {
                            float u = (t - T1 - k * gap) / fl;
                            if (u < 0) { gather(p.x, p.y + top, p.z, mg); continue; }
                            if (once(a, E_B << k)) sfx(Audio.ORB, 0.55f, p.x, p.z, 1 + 0.14f * k);
                            if (u >= 1) { if (once(a, E_H0 << k)) { burst(v.x, vh, v.z, mg, 30, 3.5f); flash(v.x, vh, v.z, mg, 0.5f); shake = Math.max(shake, 0.06f); } continue; }
                            float rad = 0.42f * sin(PI * u), an = k * TAU / 3 + u * TAU * 1.5f;
                            float ox = lerp(a.fx, v.x, u) + sx * cos(an) * rad, oy = lerp(p.y + top, vh, u) + sin(an) * rad, oz = lerp(a.fz, v.z, u) + sz * cos(an) * rad;
                            a.orbs[k * 3] = ox; a.orbs[k * 3 + 1] = oy; a.orbs[k * 3 + 2] = oz; a.orbMask |= 1 << k;
                            parts.add(ox, oy, oz, 0, 0, 0, 0.22f + rnd.nextFloat() * 0.15f, 0.08f, mg[0] * 190, mg[1] * 190, mg[2] * 190, 0, 0);
                        }
                    } else {
                        a.orbMask = 0;
                        if (once(a, E_BOOM)) { explode(v, mg, 0, 0, 1.4f, 1.35f); ring(v.x, v.z, mg); }
                        float u = clamp((t - tEnd) / T3, 0, 1), sp0 = tEnd * tEnd * 9, sp1 = TAU * (float) Math.ceil(sp0 / TAU);
                        p.y = 0.7f * (1 - ease(u)); p.spin = lerp(sp0, sp1, ease(u)); p.glow = 5 - 4 * u;
                        if (u >= 1) endAttack(a);
                    }
                    break;
                }
                default: {                                                     // ROYAL CLEAVE: the king draws back and swings a blade of light in a full turn
                    float T1 = 0.34f, T2 = 0.38f, T3 = 0.20f;
                    if (t < T1) {
                        float s = ease(t / T1);
                        p.tilt = -0.28f * s; p.y = 0.16f * s; p.glow = 1 + 5 * s;
                    } else if (t < T1 + T2) {
                        float u = (t - T1) / T2;
                        if (once(a, E_A)) sfx(Audio.SWORD, 0.85f, p.x, p.z);
                        if (u > 0.3f && u < 0.8f) a.slowmo = true;
                        p.spin = TAU * ease(u); p.tilt = lerp(-0.28f, 0.22f, u); p.y = 0.16f; p.glow = 6; a.slash = u; v.shake = 0.04f;
                        if (u > 0.55f && once(a, E_BOOM)) explode(v, mg, -a.dz * 1.7f + a.dx * 0.7f, a.dx * 1.7f + a.dz * 0.7f, 1.1f, 1f);   // cut sideways
                    } else {
                        if (once(a, E_BOOM)) explode(v, mg, -a.dz * 1.7f + a.dx * 0.7f, a.dx * 1.7f + a.dz * 0.7f, 1.1f, 1f);
                        float u = clamp((t - T1 - T2) / T3, 0, 1);
                        a.slash = -1; p.spin = 0; p.tilt = 0.22f * (1 - ease(u)); p.y = 0.16f * (1 - ease(u)); p.glow = 6 - 5 * u;
                        if (u >= 1) endAttack(a);
                    }
                }
            }
        }

        /** The knight lands on its victim: flattened, with a heavy shockwave. */
        void crush(Piece v, float[] mg) {
            explode(v, mg, 0, 0, 1.15f, 0.3f);
            ring(v.x, v.z, mg); dust(v.x, 0.05f, v.z, 30, 3.2f);
            shake = Math.max(shake, 0.42f);
            sfx(Audio.STOMP, 1f, v.x, v.z);
        }

        /** A mote of magic drawn in towards a point. */
        void gather(float x, float y, float z, float[] mg) {
            float[] d = unit(rnd.nextFloat() - .5f, rnd.nextFloat() - .5f, rnd.nextFloat() - .5f + 1e-3f);
            parts.add(x + d[0] * 1.1f, y + d[1] * 1.1f, z + d[2] * 1.1f, -d[0] * 3.6f, -d[1] * 3.6f, -d[2] * 3.6f, 0.28f, 0.06f, mg[0] * 200, mg[1] * 200, mg[2] * 200, 0, 0);
        }

        // ─────────────────────────────── kill-cam ───────────────────────────────

        /** A capture is starting: remember where the camera was, then swing in close beside the two pieces. */
        void beginKill(Anim a) {
            camSave[0] = yawG; camSave[1] = pitchG; camSave[2] = distG; camSave[3] = txG; camSave[4] = tzG;
            inKill = true;
            // watch from the side, a little behind the attacker, on whichever side the camera is already nearer
            float px = -a.dz, pz = a.dx;
            if (px * sin(yaw) - pz * cos(yaw) < 0) { px = -px; pz = -pz; }
            float ox = px * 0.82f - a.dx * 0.57f, oz = pz * 0.82f - a.dz * 0.57f, target = (float) Math.atan2(ox, -oz);
            yawG = target + TAU * Math.round((yaw - target) / TAU);
            pitchG = 0.36f; distG = Math.min(8.5f, 4.8f + a.dist * 0.5f); liftKG = 0.3f;
            txG = lerp(a.fx, a.tx, 0.62f); tzG = lerp(a.fz, a.tz, 0.62f);
        }

        void endKill() {
            if (!inKill) return;
            inKill = false;
            yawG = camSave[0]; pitchG = camSave[1]; distG = camSave[2]; txG = camSave[3]; tzG = camSave[4]; liftKG = 1;
        }

        // ─────────────────────────────── weather ───────────────────────────────

        /** The storm gathers as pieces fall and breaks when a king is in check. T switches between: follows the game / always / never. */
        void updateWeather(float dt) {
            int lost = 32 - pieces.size();
            float want = stormMode == 1 ? 1 : stormMode == 2 ? 0 : (!started ? 0 : fallen != 0 ? 1 : inCheck ? 0.85f : clamp((lost - 5) / 14f, 0, 0.75f));
            storm += clamp(want - storm, -dt * 0.07f, dt * 0.13f);
            fogK = 1 + 0.8f * storm; wet = 0.15f + 0.12f * storm; cl0 = 0.50f - 0.22f * storm;
            if (audio != null) audio.rain = storm;
            int active = (int) (DROPS * storm);                                // rain falls in a box that follows the camera
            float floor = Math.max(-1, camY - 9);
            for (int i = 0; i < active; i++) {
                float x = rain[i * 3] + 3.2f * dt, y = rain[i * 3 + 1] - 17 * dt, z = rain[i * 3 + 2] + 1.4f * dt;
                if (y < floor || Math.abs(x - camX) > 11 || Math.abs(z - camZ) > 11) {
                    x = camX + (rnd.nextFloat() - .5f) * 22; z = camZ + (rnd.nextFloat() - .5f) * 22; y = floor + 2 + rnd.nextFloat() * 11;
                }
                rain[i * 3] = x; rain[i * 3 + 1] = y; rain[i * 3 + 2] = z;
            }
            for (int i = 0; i < 3; i++) if (rnd.nextFloat() < storm * 0.9f)   // splashes on the board
                parts.add((rnd.nextFloat() - .5f) * 9.4f, 0.04f, (rnd.nextFloat() - .5f) * 9.4f, 0, 0.5f, 0, 0.14f, 0.05f, 34, 40, 54, 2, 0);
            flash *= (float) Math.exp(-dt * 8);
            if (boltLife > 0) { float b0 = boltLife; boltLife -= dt; if (b0 > 0.09f && boltLife <= 0.09f) flash = Math.max(flash, 0.7f); }
            if (storm > 0.4f) { nextBolt -= dt; if (nextBolt <= 0) strike(); }
            if (thunderIn >= 0) {
                thunderIn -= dt;
                if (thunderIn < 0 && audio != null && audio.ok) audio.play(Audio.THUNDER, thunderVol, thunderPan, 0.85f + rnd.nextFloat() * 0.3f);
            }
        }

        /** A lightning bolt: a jagged path from the clouds to the ground, a flash over everything, thunder a moment later. */
        void strike() {
            nextBolt = 4 + rnd.nextFloat() * 11 * (1.4f - storm);
            flash = 1; boltLife = 0.22f;
            float fwd = (float) Math.atan2(fx, fz), az = fwd + (rnd.nextFloat() - .5f) * (rnd.nextFloat() < 0.7f ? 1.3f : TAU), d = 85 + rnd.nextFloat() * 35;
            float x = camX + sin(az) * d, z = camZ + cos(az) * d, ground = terrainH(x, z);
            boltN = 18;
            for (int i = 0; i < boltN; i++) {
                bolt[i * 3] = x; bolt[i * 3 + 1] = lerp(78, ground, i / (float) (boltN - 1)); bolt[i * 3 + 2] = z;
                x += (rnd.nextFloat() - .5f) * 7; z += (rnd.nextFloat() - .5f) * 7;
            }
            thunderIn = 0.25f + d / 110f; thunderVol = 0.45f + 0.45f * storm; thunderPan = clamp(sin(az - fwd), -0.8f, 0.8f);
        }

        /** Rain streaks: each drop is a short line from where it was a moment ago to where it is now. */
        void drawRain(int[] pix) {
            int active = (int) (DROPS * storm);
            for (int i = 0; i < active; i++) {
                float dx = rain[i * 3] - camX, dy = rain[i * 3 + 1] - camY, dz = rain[i * 3 + 2] - camZ, vz = dx * fx + dy * fy + dz * fz;
                if (vz < 0.4f) continue;
                float iz = 1 / vz, sx = cxc + F * (dx * rx + dz * rz) * iz, sy = cyc - F * (dx * ux + dy * uy + dz * uz) * iz;
                dx -= 0.10f; dy += 0.55f; dz -= 0.045f;
                float vz2 = dx * fx + dy * fy + dz * fz;
                if (vz2 < 0.4f) continue;
                float iz2 = 1 / vz2, sx2 = cxc + F * (dx * rx + dz * rz) * iz2, sy2 = cyc - F * (dx * ux + dy * uy + dz * uz) * iz2;
                int steps = (int) Math.min(70, Math.max(Math.abs(sx2 - sx), Math.abs(sy2 - sy)) + 1);
                float a = clamp(iz * 5, 0.25f, 1);
                for (int s = 0; s <= steps; s++) {
                    float u = s / (float) steps;
                    int px = (int) lerp(sx, sx2, u), py = (int) lerp(sy, sy2, u);
                    if (px < 0 || py < 0 || px >= W || py >= H) continue;
                    int idx = py * W + px;
                    if (iz > zb[idx]) addPix(pix, idx, 22 * a, 26 * a, 36 * a);
                }
            }
        }

        // ─────────────────────────────── the world reacts: ghosts ───────────────────────────────

        /** A captured piece leaves a ghost: first a wisp that flies from the board to the graveyard, then a spirit above its grave. */
        void addGhost(Piece v) {
            Ghost g = new Ghost();
            g.type = v.type; g.white = v.white;
            int cnt = 0;
            for (Ghost o : ghosts) if (o.white == v.white) cnt++;
            g.slot = (v.white ? 0 : 15) + Math.min(14, cnt);
            g.sx = v.x; g.sy = MESH[v.type].height * PS * 0.5f; g.sz = v.z;
            g.gx = GRAVES[g.slot][0]; g.gz = GRAVES[g.slot][1]; g.gy = terrainH(g.gx, g.gz);
            ghosts.add(g);
        }

        void updateGhosts(float dt) {
            for (Ghost g : ghosts) {
                float a0 = g.age;
                g.age += dt;
                float[] c = g.white ? ICE : VIOLET;
                if (g.age > 0.5f && g.age < 2.4f) {
                    float u = ease((g.age - 0.5f) / 1.9f);
                    g.wx = lerp(g.sx, g.gx, u); g.wy = lerp(g.sy, g.gy + 1.2f, u) + 3.2f * sin(PI * u); g.wz = lerp(g.sz, g.gz, u);
                    for (int i = 0; i < 2; i++)
                        parts.add(g.wx + (rnd.nextFloat() - .5f) * 0.2f, g.wy + (rnd.nextFloat() - .5f) * 0.2f, g.wz + (rnd.nextFloat() - .5f) * 0.2f, 0, -0.2f, 0,
                                0.5f + rnd.nextFloat() * 0.4f, 0.07f, c[0] * 150, c[1] * 150, c[2] * 150, 0, 0);
                } else if (a0 < 2.4f && g.age >= 2.4f) {
                    for (int i = 0; i < 24; i++) sparkle(g.gx, g.gy + 1.2f, g.gz, c, 0.6f);
                }
            }
        }

        /** Spirits hovering over the graves: see-through, brightest at their edges, slowly turning. */
        void drawGhosts() {
            for (Ghost g : ghosts) {
                if (g.age < 2.4f) continue;
                Mesh m = MESH[g.type];
                float yw = time * 0.35f + g.slot;
                pCy = cos(yw); pSy = sin(yw); pS = PS * 1.3f; pTilt = false;
                pOx = g.gx; pOy = g.gy + 0.6f + 0.14f * sin(time * 1.2f + g.slot); pOz = g.gz;
                float dx = pOx - camX, dy = pOy + 0.8f - camY, dz = pOz - camZ, vz = dx * fx + dy * fy + dz * fz;
                if (vz < 1) continue;
                float sx = cxc + F * (dx * rx + dz * rz) / vz, sy = cyc - F * (dx * ux + dy * uy + dz * uz) / vz, rad = F * 2.6f / vz;
                if (sx < -rad || sx > W + rad || sy < -rad * 2 || sy > H + rad * 2) continue;
                float k = Math.min(1, (g.age - 2.4f) / 1.6f) * (0.75f + 0.25f * sin(time * 3 + g.slot * 1.7f)) * 0.85f;
                float br = g.white ? 150 : 200, bg = g.white ? 205 : 140, bb = 255;
                for (int i = 0; i < m.nv; i++) {
                    xf(m, i);
                    float vx = camX - X, vy = camY - Y, vzz = camZ - Z, vl = 1 / sqrt(vx * vx + vy * vy + vzz * vzz);
                    float om = 1 - Math.abs(NX * vx + NY * vy + NZ * vzz) * vl, e = (0.07f + 0.93f * om * om) * k;
                    project(i, X, Y, Z);
                    SC[i] = pack(br * e, bg * e, bb * e);
                }
                for (int i = 0; i < m.nt; i++) emit(ghostTris, m.t[i * 3], m.t[i * 3 + 1], m.t[i * 3 + 2], 1);
            }
        }

        /** Like raster(), but adds light instead of covering what is behind (used for the ghosts). */
        static void rasterAdd(TriList L, int[] pix, float[] zb, int W, int y0, int y1) {
            final float[] v = L.v; final int[] c = L.c;
            for (int i = 0, n = L.n; i < n; i++) {
                int o = i * 9;
                float ax = v[o], ay = v[o + 1], az = v[o + 2], bx = v[o + 3], by = v[o + 4], bz = v[o + 5], cx = v[o + 6], cy = v[o + 7], cz = v[o + 8];
                int ys = Math.max(y0, (int) Math.floor(Math.min(ay, Math.min(by, cy)))), ye = Math.min(y1 - 1, (int) Math.ceil(Math.max(ay, Math.max(by, cy))));
                if (ys > ye) continue;
                int xs = Math.max(0, (int) Math.floor(Math.min(ax, Math.min(bx, cx)))), xe = Math.min(W - 1, (int) Math.ceil(Math.max(ax, Math.max(bx, cx))));
                if (xs > xe) continue;
                float area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
                if (area < 1e-7f) continue;
                float inv = 1 / area;
                int ca = c[i * 3], cb = c[i * 3 + 1], cc = c[i * 3 + 2];
                for (int y = ys; y <= ye; y++) {
                    float py = y + 0.5f;
                    for (int x = xs; x <= xe; x++) {
                        float px = x + 0.5f;
                        float w0 = ((cx - bx) * (py - by) - (cy - by) * (px - bx)) * inv, w1 = ((ax - cx) * (py - cy) - (ay - cy) * (px - cx)) * inv, w2 = 1 - w0 - w1;
                        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
                        int idx = y * W + x;
                        if (az * w0 + bz * w1 + cz * w2 <= zb[idx]) continue;
                        addPix(pix, idx, ((ca >> 16) & 255) * w0 + ((cb >> 16) & 255) * w1 + ((cc >> 16) & 255) * w2,
                                ((ca >> 8) & 255) * w0 + ((cb >> 8) & 255) * w1 + ((cc >> 8) & 255) * w2, (ca & 255) * w0 + (cb & 255) * w1 + (cc & 255) * w2);
                    }
                }
            }
        }

        // ─────────────────────────────── the world reacts: the loser's castle falls ───────────────────────────────

        /** g = 1 the black fortress, 2 the white citadel. Its windows go dark, then every stone falls, top first. */
        void startCollapse(final int g) {
            final World w = world;
            int n = 0;
            for (int i = 0; i < w.nt; i++) if (w.grp[i] == g) n++;
            Rubble r = new Rubble(n);
            float top = -1e9f;
            int k = 0;
            for (int i = 0; i < w.nt; i++) {
                if (w.grp[i] != g) continue;
                float mx = 0, my = 0, mz = 0;
                for (int q = 0; q < 3; q++) { int v = w.t[i * 3 + q]; mx += w.p[v * 3] / 3; my += w.p[v * 3 + 1] / 3; mz += w.p[v * 3 + 2] / 3; r.col[k * 3 + q] = w.c[v]; }
                for (int q = 0; q < 3; q++) { int v = w.t[i * 3 + q]; r.o[k * 9 + q * 3] = w.p[v * 3] - mx; r.o[k * 9 + q * 3 + 1] = w.p[v * 3 + 1] - my; r.o[k * 9 + q * 3 + 2] = w.p[v * 3 + 2] - mz; }
                r.c[k * 3] = mx; r.c[k * 3 + 1] = my; r.c[k * 3 + 2] = mz; r.aux[k] = w.aux[i];
                top = Math.max(top, my);
                k++;
            }
            float[] M = MOUNDS[g - 1];
            for (k = 0; k < n; k++) {
                r.delay[k] = 2.4f + (top - r.c[k * 3 + 1]) * 0.085f + rnd.nextFloat() * 0.7f;
                float dx = r.c[k * 3] - M[0], dz = r.c[k * 3 + 2] - M[1], l = sqrt(dx * dx + dz * dz) + 0.01f, sp = 0.3f + rnd.nextFloat() * 2.4f;
                r.v[k * 3] = dx / l * sp; r.v[k * 3 + 2] = dz / l * sp;
                float[] a = unit(rnd.nextFloat() - .5f, rnd.nextFloat() - .5f, rnd.nextFloat() - .5f + 1e-3f);
                r.ax[k * 3] = a[0]; r.ax[k * 3 + 1] = a[1]; r.ax[k * 3 + 2] = a[2];
                r.spin[k] = (rnd.nextFloat() - .5f) * 5; r.ground[k] = M[3] - 0.3f + rnd.nextFloat() * 0.9f;
            }
            rubble = r; fallen = g; fallT = 0; ruinNear = ruinFar = null; ruinSwapped = false; rumbled = false;
            Thread t = new Thread(() -> {                                      // the shadows the castle used to cast have to go too
                float[] a = w.depthFromMoon(World.NS, World.NEXT, g), b = w.depthFromMoon(World.FS, World.FEXT, g);
                ruinFar = b; ruinNear = a;
            }, "nightfall-ruin");
            t.setDaemon(true);
            t.start();
            endKill();                                                         // turn the camera to watch it happen
            camSave2[0] = yawG; camSave2[1] = pitchG; camSave2[2] = distG; camSave2[3] = txG; camSave2[4] = tzG;
            castleCam = true;
            float target = (M[1] > 0 ? 0 : PI) + 0.4f;
            yawG = target + TAU * Math.round((yaw - target) / TAU);
            txG = M[0]; tzG = M[1]; distG = 50; pitchG = 0.2f; liftKG = 0.55f;
        }

        void updateRubble(float dt) {
            Rubble r = rubble;
            fallT += dt;
            if (!rumbled && fallT > 2.2f) { rumbled = true; if (audio != null && audio.ok) audio.play(Audio.RUMBLE, 1f, 0, 1); }
            if (fallT > 2.4f && fallT < 7) shake = Math.max(shake, 0.1f);
            if (fallT > 2.3f && fallT < 7.5f && boltLife <= 0 && rnd.nextFloat() < dt * 0.9f) strike();   // lightning shows the ruin as it falls
            for (int k = 0; k < r.n; k++) {
                if (r.state[k] == 2 || fallT < r.delay[k]) continue;
                r.state[k] = 1;
                r.v[k * 3 + 1] -= 9.8f * dt;
                r.c[k * 3] += r.v[k * 3] * dt; r.c[k * 3 + 1] += r.v[k * 3 + 1] * dt; r.c[k * 3 + 2] += r.v[k * 3 + 2] * dt;
                float an = r.spin[k] * dt, ca = cos(an), sa = sin(an), kx = r.ax[k * 3], ky = r.ax[k * 3 + 1], kz = r.ax[k * 3 + 2];
                for (int q = 0; q < 3; q++) {
                    int j = k * 9 + q * 3;
                    float px = r.o[j], py = r.o[j + 1], pz = r.o[j + 2], dot = (kx * px + ky * py + kz * pz) * (1 - ca);
                    r.o[j] = px * ca + (ky * pz - kz * py) * sa + kx * dot;
                    r.o[j + 1] = py * ca + (kz * px - kx * pz) * sa + ky * dot;
                    r.o[j + 2] = pz * ca + (kx * py - ky * px) * sa + kz * dot;
                }
                if (r.c[k * 3 + 1] <= r.ground[k]) {
                    r.c[k * 3 + 1] = r.ground[k]; r.state[k] = 2;
                    if (rnd.nextFloat() < 0.07f)                               // a cloud of dust where it lands
                        parts.add(r.c[k * 3], r.ground[k] + 0.8f, r.c[k * 3 + 2], (rnd.nextFloat() - .5f) * 3, 1 + rnd.nextFloat() * 2.5f, (rnd.nextFloat() - .5f) * 3,
                                2.2f + rnd.nextFloat() * 2, 2.2f + rnd.nextFloat() * 2.5f, 15, 15, 19, -0.1f, 0.9f);
                }
            }
            if (!ruinSwapped && fallT > 6 && ruinNear != null) { world.smNear = ruinNear; world.smFar = ruinFar; ruinSwapped = true; }
            if (castleCam && fallT > 9) restoreCam2();
        }

        void restoreCam2() {
            if (!castleCam) return;
            castleCam = false;
            yawG = camSave2[0]; pitchG = camSave2[1]; distG = camSave2[2]; txG = camSave2[3]; tzG = camSave2[4]; liftKG = 1;
        }

        /** Puts a fallen castle back (new game, or the mating move was taken back). */
        void restoreCastle() {
            restoreCam2();
            if (fallen == 0) return;
            fallen = 0; fallT = -1; rubble = null;
            world.smNear = world.smNear0; world.smFar = world.smFar0;
        }

        void drawRubble() {
            Rubble r = rubble;
            if (r == null) return;
            for (int k = 0; k < r.n; k++) {
                float dark = 1;
                if ((r.aux[k] & 7) == M_GLOW) dark = clamp(1 - (fallT - 0.3f - hash(k, 7) * 1.4f) / 0.35f, 0.04f, 1);     // the lights go out, one by one
                for (int q = 0; q < 3; q++) {
                    project(q, r.c[k * 3] + r.o[k * 9 + q * 3], r.c[k * 3 + 1] + r.o[k * 9 + q * 3 + 1], r.c[k * 3 + 2] + r.o[k * 9 + q * 3 + 2]);
                    SC[q] = dark < 1 ? shade(r.col[k * 3 + q], dark) : r.col[k * 3 + q];
                }
                curAux = r.aux[k];
                emit(main, 0, 1, 2, r.state[k] == 0 ? 1 : 0);
            }
            curAux = 0;
        }

        // ─────────────────────────────── online play ───────────────────────────────

        void hostOnline(boolean playWhite, int port) { closeNet(); cancelAI(); hostWhite = playWhite; netNote = null; net = new Net(); net.host(port); }

        void joinOnline(String addr, int port) { closeNet(); cancelAI(); netNote = null; net = new Net(); net.join(addr, port); }

        void closeNet() {
            if (net != null) net.close();
            net = null; online = false; pending.clear();
        }

        /** Reads whatever the other computer has sent since the last frame. */
        void pollNet() {
            Net n = net;
            if (n == null) return;
            String line;
            while ((line = n.in.poll()) != null) {
                String[] w = line.trim().split(" ");
                if (w[0].equals("HELLO")) {
                    if (!line.trim().equals("HELLO NIGHTFALL 3")) { closeNet(); netNote = "Your friend has a different version of the game."; return; }
                    if (n.host && !online) { n.send("START " + (hostWhite ? "W" : "B")); startOnline(hostWhite); }
                } else if (w[0].equals("START") && !n.host && w.length > 1 && !online) {
                    startOnline(!w[1].equals("W"));
                } else if (w[0].equals("MOVE") && w.length >= 4) {
                    try { pending.add(new int[]{Integer.parseInt(w[1]), Integer.parseInt(w[2]), Integer.parseInt(w[3])}); }
                    catch (NumberFormatException e) { /* ignore a garbled line */ }
                } else if (w[0].equals("BYE")) {
                    boolean was = online;
                    closeNet();
                    if (was) { netNote = "Your friend left the game."; if (!over) { over = true; banner = "Your friend left the game"; } }
                    else netNote = "The connection was lost.";
                    return;
                }
            }
        }

        // ─────────────────────────────── camera ───────────────────────────────

        void setupCamera(int w, int h) {
            float cp = cos(pitch), sp = sin(pitch);
            camX = tx + dist * cp * sin(yaw); camY = ty + dist * sp; camZ = tz - dist * cp * cos(yaw);
            camY = Math.max(camY, Math.max(0.3f, terrainH(camX, camZ) + 0.7f));
            float lift = dist * 0.34f * (1 - smooth(0.35f, 1.0f, pitch)) * liftK;          // look up at the sky when the camera is low
            float sx = shake * sin(time * 71), sy = shake * cos(time * 93);
            float dx = tx + sx - camX, dy = ty + lift + sy - camY, dz = tz - camZ, l = sqrt(dx * dx + dy * dy + dz * dz);
            fx = dx / l; fy = dy / l; fz = dz / l;
            float rl = sqrt(fx * fx + fz * fz);
            rx = fz / rl; rz = -fx / rl;
            ux = fy * rz; uy = fz * rx - fx * rz; uz = -fy * rx;
            F = (h * 0.5f) / (float) Math.tan(Math.toRadians(60) / 2);
            cxc = w * 0.5f; cyc = h * 0.5f;
        }

        /** Which square is under the mouse? Tall pieces are hit before the board behind them. */
        int pick(float mx, float my) {
            float a = (mx - cxc) / F, b = (cyc - my) / F;
            float dx = fx + a * rx + b * ux, dy = fy + b * uy, dz = fz + a * rz + b * uz;
            float best = 1e9f; int res = -1;
            for (Piece p : pieces) {
                float h = MESH[p.type].height * PS, rad = 0.30f, ox = camX - p.x, oz = camZ - p.z;
                float A = dx * dx + dz * dz, B = 2 * (ox * dx + oz * dz), C = ox * ox + oz * oz - rad * rad, disc = B * B - 4 * A * C;
                if (disc < 0 || A < 1e-9f) continue;
                float t = (-B - sqrt(disc)) / (2 * A);
                if (t <= 0) continue;
                float yy = camY + t * dy;
                if (yy < 0) continue;
                if (yy > h) {
                    if (dy >= 0) continue;
                    float t2 = (h - camY) / dy, ex = ox + t2 * dx, ez = oz + t2 * dz;
                    if (ex * ex + ez * ez > rad * rad) continue;
                    t = t2;
                }
                if (t < best) { best = t; res = p.sq; }
            }
            if (dy < 0) {
                float t = -camY / dy, u = camX + t * dx + 4, v = camZ + t * dz + 4;
                if (t < best && u >= 0 && u < 8 && v >= 0 && v < 8) res = (int) v * 8 + (int) u;
            }
            return res;
        }

        // ─────────────────────────────── rendering ───────────────────────────────

        /**
         * Draws one frame into 'out'. Steps: queue all triangles -> fill them (several threads, each owning a band of rows)
         * -> shade the board and sky -> add shadows, texture and mist to the scenery -> add glows -> smooth edges and grade colour.
         */
        void render(int[] out, int w, int h) {
            if (w != W || h != H) { W = w; H = h; zb = new float[w * h]; rzb = new float[w * h]; rpix = new int[w * h]; aux = new int[w * h]; buf = new int[w * h]; }
            setupCamera(w, h);
            main.n = 0; refl.n = 0; ghostTris.n = 0;
            buildLights(); buildHighlights(); buildShadows();
            drawWorld(); drawRubble();
            curAux = 0; nPc = 0;
            for (Piece p : pieces) drawPiece(p);
            drawFrags(); drawGhosts();
            collectSprites();
            Arrays.fill(zb, 0f); Arrays.fill(rzb, 0f);
            final int[] px = buf, o = out;
            IntStream.range(0, bands).parallel().forEach(i -> {
                int y0 = H * i / bands, y1 = H * (i + 1) / bands;
                raster(main, px, zb, aux, W, y0, y1);
                raster(refl, rpix, rzb, null, W, y0, y1);
                boardPass(px, y0, y1);
                skyPass(px, y0, y1);
                postPass(px, y0, y1);
                rasterAdd(ghostTris, px, zb, W, y0, y1);
                spritePass(px, y0, y1);
            });
            if (storm > 0.01f) drawRain(px);
            IntStream.range(0, bands).parallel().forEach(i -> finalPass(px, o, H * i / bands, H * (i + 1) / bands));
            drawStars(out);
        }

        /** Gathers every glowing dot for this frame: window lights, flames, sparks, magic. */
        void collectSprites() {
            nSP = 0;
            for (int i = 0; i < world.ng; i++) {
                int o = i * 7; float fl = 0.85f + 0.15f * sin(time * 3 + i * 1.7f);
                if (fallen != 0 && world.glowGrp[i] == fallen) {                   // the lights of a falling castle go out one by one
                    fl *= clamp(1 - (fallT - 0.3f - (i % 7) * 0.2f) / 0.4f, 0, 1);
                    if (fl <= 0) continue;
                }
                sprite(world.glows[o], world.glows[o + 1], world.glows[o + 2], world.glows[o + 3], world.glows[o + 4] * fl, world.glows[o + 5] * fl, world.glows[o + 6] * fl);
            }
            for (int i = 0; i < 4; i++) {
                float fl = 0.8f + 0.2f * sin(time * 11 + i * 2.1f);
                sprite(BRAZIERS[i][0], 1.3f, BRAZIERS[i][2], 1.4f, 58 * fl, 24 * fl, 6 * fl);
            }
            Particles q = parts;
            for (int i = 0; i < q.n; i++) {
                float f = q.life[i] / q.max[i];
                sprite(q.x[i], q.y[i], q.z[i], q.size[i] * (0.5f + 0.5f * f), q.r[i] * f, q.g[i] * f, q.b[i] * f);
            }
            if (anim != null) {
                Anim a = anim;
                float[] mg = a.moverWhite ? ICE : VIOLET;
                if (a.orbOn) {                                                 // the rook's boulder, or the queen as a streak of light
                    float[] c = a.mover.type == ROOK ? FIREC : mg;
                    sprite(a.bx, a.by, a.bz, 0.55f, c[0] * 255, c[1] * 255, c[2] * 255);
                    sprite(a.bx, a.by, a.bz, 0.2f, 255, 255, 255);
                }
                if (a.beamOn) for (int i = 0; i <= 28; i++) {                  // the bishop's beam: a jagged line that re-forms every frame
                    float u = i / 28f, j = 0.11f * sin(PI * u);
                    float x = lerp(a.bx, a.ex, u) + (rnd.nextFloat() - .5f) * j, y = lerp(a.by, a.ey, u) + (rnd.nextFloat() - .5f) * j, z = lerp(a.bz, a.ez, u) + (rnd.nextFloat() - .5f) * j;
                    sprite(x, y, z, 0.17f, mg[0] * 170, mg[1] * 170, mg[2] * 170);
                    sprite(x, y, z, 0.07f, 230, 230, 230);
                }
                for (int k = 0; k < 3; k++) if ((a.orbMask >> k & 1) != 0) {
                    sprite(a.orbs[k * 3], a.orbs[k * 3 + 1], a.orbs[k * 3 + 2], 0.36f, mg[0] * 255, mg[1] * 255, mg[2] * 255);
                    sprite(a.orbs[k * 3], a.orbs[k * 3 + 1], a.orbs[k * 3 + 2], 0.13f, 255, 255, 255);
                }
                if (a.slash >= 0) {                                            // the king's blade: a crescent of light sweeping round
                    float base = (float) Math.atan2(a.dz, a.dx), head = base - 2.5f + 3.1f * ease(a.slash), R = Math.max(0.85f, a.dist * 0.95f);
                    for (int i = 0; i < 18; i++) {
                        float an = head - i * 0.07f, f = 1 - i / 18f;
                        float x = a.mover.x + cos(an) * R, z = a.mover.z + sin(an) * R, y = 0.95f + 0.2f * sin(an - base);
                        sprite(x, y, z, 0.07f + 0.13f * f, mg[0] * 240 * f, mg[1] * 240 * f, mg[2] * 240 * f);
                        if (i < 5) sprite(x, y, z, 0.08f, 255, 255, 255);
                    }
                }
            }
            for (int i = 0; i < 4; i++) {
                int o = i * 7; float pw = flashes[o + 3];
                if (pw > 0.03f) sprite(flashes[o], flashes[o + 1], flashes[o + 2], 1.2f + 2.2f * pw, flashes[o + 4] * 170 * pw, flashes[o + 5] * 170 * pw, flashes[o + 6] * 170 * pw);
            }
            for (Ghost g : ghosts) if (g.age > 0.5f && g.age < 2.4f) {             // a spirit on its way to the graveyard
                float[] c = g.white ? ICE : VIOLET;
                sprite(g.wx, g.wy, g.wz, 0.5f, c[0] * 230, c[1] * 230, c[2] * 230);
                sprite(g.wx, g.wy, g.wz, 0.16f, 255, 255, 255);
            }
            if (boltLife > 0) {                                                    // lightning
                float k = 0.55f + 0.45f * rnd.nextFloat();
                for (int i = 0; i + 1 < boltN; i++) for (int j = 0; j < 5; j++) {
                    float u = j / 5f;
                    sprite(lerp(bolt[i * 3], bolt[i * 3 + 3], u), lerp(bolt[i * 3 + 1], bolt[i * 3 + 4], u), lerp(bolt[i * 3 + 2], bolt[i * 3 + 5], u), 1.5f, 150 * k, 165 * k, 225 * k);
                }
                sprite(bolt[0], bolt[1], bolt[2], 16, 46 * k, 52 * k, 76 * k);
            }
        }

        void buildLights() {
            nL = 0;
            for (int i = 0; i < 4; i++) {
                float fl = 2.1f * (1 + 0.14f * sin(time * 13 + i * 2) + 0.09f * sin(time * 7.3f + i));
                int o = nL++ * 7;
                LT[o] = BRAZIERS[i][0]; LT[o + 1] = BRAZIERS[i][1]; LT[o + 2] = BRAZIERS[i][2];
                LT[o + 3] = FIREC[0] * fl; LT[o + 4] = FIREC[1] * fl; LT[o + 5] = FIREC[2] * fl; LT[o + 6] = 0.35f;
            }
            for (int i = 0; i < 4; i++) {
                float pw = flashes[i * 7 + 3];
                if (pw < 0.03f) continue;
                int o = nL++ * 7;
                LT[o] = flashes[i * 7]; LT[o + 1] = flashes[i * 7 + 1]; LT[o + 2] = flashes[i * 7 + 2];
                LT[o + 3] = flashes[i * 7 + 4] * 5 * pw; LT[o + 4] = flashes[i * 7 + 5] * 5 * pw; LT[o + 5] = flashes[i * 7 + 6] * 5 * pw; LT[o + 6] = 0.3f;
            }
        }

        void addTint(int s, float r, float g, float b) { if (s >= 0) { tint[s * 3] += r; tint[s * 3 + 1] += g; tint[s * 3 + 2] += b; } }

        void buildHighlights() {
            Arrays.fill(tint, 0); Arrays.fill(mark, (byte) 0);
            float pulse = 0.75f + 0.25f * sin(time * 5);
            if (lastFrom >= 0) { addTint(lastFrom, 60, 50, 20); addTint(lastTo, 85, 70, 28); }
            if (hover >= 0 && anim == null && !over && !menu) addTint(hover, 26, 30, 42);
            if (inCheck && !over) addTint(rules.kingSq(rules.white), 235 * pulse, 30, 24);
            if (selected >= 0) {
                markCol = rules.white ? ICE : VIOLET;
                addTint(selected, markCol[0] * 150 * pulse, markCol[1] * 150 * pulse, markCol[2] * 150 * pulse);
                for (Move m : selMoves) mark[m.to] = (byte) (m.captureSq >= 0 ? 2 : 1);
            }
        }

        /** Pieces throw moon shadows across the board, and darken the stone right under them. Both are stamped into small maps. */
        void buildShadows() {
            Arrays.fill(sm, 0); Arrays.fill(ao, 0);
            float sxk = -MOON[0] / MOON[1], szk = -MOON[2] / MOON[1], sc = SM / 10f;
            for (Piece p : pieces) {
                if (p.scale < 0.05f) continue;
                Mesh m = MESH[p.type];
                float ps = PS * p.scale;
                for (int k = 0; k < 8; k++) {
                    float r = m.shR[k] * ps, y = m.shY[k] * ps + p.y;
                    if (r <= 0) continue;
                    for (int sub = 0; sub < 3; sub++) {
                        float yy = y + (sub - 1) * m.height * ps / 24f;
                        float cx = (p.x + sxk * yy + 5) * sc, cz = (p.z + szk * yy + 5) * sc, rr = r * sc;
                        int x0 = Math.max(0, (int) (cx - rr)), x1 = Math.min(SM - 1, (int) (cx + rr) + 1), z0 = Math.max(0, (int) (cz - rr)), z1 = Math.min(SM - 1, (int) (cz + rr) + 1);
                        for (int z = z0; z <= z1; z++) for (int x = x0; x <= x1; x++)
                            if ((x - cx) * (x - cx) + (z - cz) * (z - cz) <= rr * rr) sm[z * SM + x] = 1;
                    }
                }
                float lift = 1 - p.y / 0.7f;
                if (lift > 0) {                                                // contact shadow
                    float cx = (p.x + 5) * sc, cz = (p.z + 5) * sc, rr = 0.52f * sc * p.scale;
                    int x0 = Math.max(0, (int) (cx - rr)), x1 = Math.min(SM - 1, (int) (cx + rr) + 1), z0 = Math.max(0, (int) (cz - rr)), z1 = Math.min(SM - 1, (int) (cz + rr) + 1);
                    for (int z = z0; z <= z1; z++) for (int x = x0; x <= x1; x++) {
                        float d = sqrt((x - cx) * (x - cx) + (z - cz) * (z - cz)) / rr;
                        if (d < 1) { float v = (1 - d * d) * lift; if (v > ao[z * SM + x]) ao[z * SM + x] = v; }
                    }
                }
            }
            for (int pass = 0; pass < 2; pass++) {                                 // soften the edges
                for (int z = 1; z < SM - 1; z++) for (int x = 1; x < SM - 1; x++) { int i = z * SM + x; sm2[i] = (sm[i - 1] + sm[i] * 2 + sm[i + 1]) * 0.25f; }
                for (int z = 1; z < SM - 1; z++) for (int x = 1; x < SM - 1; x++) { int i = z * SM + x; sm[i] = (sm2[i - SM] + sm2[i] * 2 + sm2[i + SM]) * 0.25f; }
            }
        }

        /** World position -> camera space -> screen, stored in slot i. */
        void project(int i, float x, float y, float z) {
            float dx = x - camX, dy = y - camY, dz = z - camZ;
            float vz = dx * fx + dy * fy + dz * fz, vx = dx * rx + dz * rz, vy = dx * ux + dy * uy + dz * uz;
            VX[i] = vx; VY[i] = vy; VZ[i] = vz;
            if (vz >= NEAR) { float iz = 1 / vz; IZ[i] = iz; SX[i] = cxc + F * vx * iz; SY[i] = cyc - F * vy * iz; }
        }

        /** Queue one triangle. cull: +1 normal object, -1 mirrored object, 0 two-sided. */
        void emit(TriList L, int a, int b, int c, int cull) {
            boolean na = VZ[a] < NEAR, nb = VZ[b] < NEAR, nc = VZ[c] < NEAR;
            if (na || nb || nc) { if (!(na && nb && nc)) clipEmit(L, a, b, c, cull); return; }
            float ax = SX[a], ay = SY[a], bx = SX[b], by = SY[b], cx = SX[c], cy = SY[c];
            if ((ax < 0 && bx < 0 && cx < 0) || (ax >= W && bx >= W && cx >= W) || (ay < 0 && by < 0 && cy < 0) || (ay >= H && by >= H && cy >= H)) return;
            float area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
            if (cull > 0 ? area <= 0 : (cull < 0 ? area >= 0 : area == 0)) return;
            L.add(ax, ay, IZ[a], SC[a], bx, by, IZ[b], SC[b], cx, cy, IZ[c], SC[c], curAux);
        }

        /** A triangle that pokes through the camera plane gets trimmed first. */
        void clipEmit(TriList L, int a, int b, int c, int cull) {
            int[] id = {a, b, c};
            for (int i = 0; i < 3; i++) {
                int v = id[i], col = SC[v];
                cin[i * 6] = VX[v]; cin[i * 6 + 1] = VY[v]; cin[i * 6 + 2] = VZ[v];
                cin[i * 6 + 3] = (col >> 16) & 255; cin[i * 6 + 4] = (col >> 8) & 255; cin[i * 6 + 5] = col & 255;
            }
            int m = 0;
            for (int i = 0; i < 3; i++) {
                int j = (i + 1) % 3;
                float zi = cin[i * 6 + 2], zj = cin[j * 6 + 2];
                boolean ii = zi >= NEAR, jj = zj >= NEAR;
                if (ii) { System.arraycopy(cin, i * 6, cout, m * 6, 6); m++; }
                if (ii != jj) {
                    float t = (NEAR - zi) / (zj - zi);
                    for (int k = 0; k < 6; k++) cout[m * 6 + k] = cin[i * 6 + k] + (cin[j * 6 + k] - cin[i * 6 + k]) * t;
                    m++;
                }
            }
            if (m < 3) return;
            for (int i = 0; i < m; i++) {
                float iz = 1 / cout[i * 6 + 2];
                cpx[i] = cxc + F * cout[i * 6] * iz; cpy[i] = cyc - F * cout[i * 6 + 1] * iz; cpz[i] = iz;
                cpc[i] = pack(cout[i * 6 + 3], cout[i * 6 + 4], cout[i * 6 + 5]);
            }
            for (int i = 1; i + 1 < m; i++) {
                float area = (cpx[i] - cpx[0]) * (cpy[i + 1] - cpy[0]) - (cpy[i] - cpy[0]) * (cpx[i + 1] - cpx[0]);
                if (cull > 0 ? area <= 0 : (cull < 0 ? area >= 0 : area == 0)) continue;
                L.add(cpx[0], cpy[0], cpz[0], cpc[0], cpx[i], cpy[i], cpz[i], cpc[i], cpx[i + 1], cpy[i + 1], cpz[i + 1], cpc[i + 1], curAux);
            }
        }

        void drawWorld() {
            World w = world;
            for (int i = 0; i < w.nv; i++) { project(i, w.p[i * 3], w.p[i * 3 + 1], w.p[i * 3 + 2]); SC[i] = w.c[i]; }
            for (int i = 0; i < w.nt; i++) {
                if (fallen != 0 && w.grp[i] == fallen) continue;                   // a falling castle is drawn stone by stone instead (drawRubble)
                curAux = w.aux[i];
                emit(main, w.t[i * 3], w.t[i * 3 + 1], w.t[i * 3 + 2], 1);
            }
        }

        // how the piece being drawn is placed (set by drawPiece, used by xf)
        float pCy, pSy, pCt, pSt, pKx, pKz, pS, pOx, pOy, pOz, X, Y, Z, NX, NY, NZ; boolean pTilt;
        final float[] pcGlow = new float[64], pcBody = new float[64], pcX = new float[64], pcY = new float[64], pcZ = new float[64], pcS = new float[64]; int nPc;

        /** Moves corner i of a model to where the piece stands: size, facing, lean, position. Result in X,Y,Z and NX,NY,NZ. */
        void xf(Mesh m, int i) {
            float lx = m.p[i * 3] * pS, ly = m.p[i * 3 + 1] * pS, lz = m.p[i * 3 + 2] * pS, nx0 = m.n[i * 3], ny = m.n[i * 3 + 1], nz0 = m.n[i * 3 + 2];
            float x = lx * pCy + lz * pSy, z = -lx * pSy + lz * pCy, y = ly, nx = nx0 * pCy + nz0 * pSy, nz = -nx0 * pSy + nz0 * pCy;
            if (pTilt) {                                                       // lean around a horizontal axis
                float d = (pKx * x + pKz * z) * (1 - pCt), tx2 = x * pCt + (-pKz * y) * pSt + pKx * d, ty2 = y * pCt + (pKz * x - pKx * z) * pSt, tz2 = z * pCt + (pKx * y) * pSt + pKz * d;
                x = tx2; y = ty2; z = tz2;
                d = (pKx * nx + pKz * nz) * (1 - pCt);
                float nx2 = nx * pCt + (-pKz * ny) * pSt + pKx * d, ny2 = ny * pCt + (pKz * nx - pKx * nz) * pSt, nz2 = nz * pCt + (pKx * ny) * pSt + pKz * d;
                nx = nx2; ny = ny2; nz = nz2;
            }
            X = x + pOx; Y = y + pOy; Z = z + pOz; NX = nx; NY = ny; NZ = nz;
        }

        /**
         * Queues one piece. The detailed model only records which way each bit of surface faces; its lighting is worked out
         * pixel by pixel afterwards (see shadePiece). A lighter model, lit corner by corner, is drawn upside-down for the
         * reflection in the board.
         */
        void drawPiece(Piece pc) {
            if (pc.scale < 0.02f || nPc >= 64) return;
            Mesh m = MESH[pc.type], h = MESHMID[pc.type];
            float yw = pc.yaw + pc.spin;
            pCy = cos(yw); pSy = sin(yw); pCt = cos(pc.tilt); pSt = sin(pc.tilt); pKx = pc.tiltX; pKz = pc.tiltZ; pS = PS * pc.scale; pTilt = pc.tilt != 0;
            pOx = pc.x; pOy = pc.y; pOz = pc.z;
            if (pc.shake > 0) { pOx += (rnd.nextFloat() - .5f) * pc.shake; pOz += (rnd.nextFloat() - .5f) * pc.shake; }
            boolean sel = pc.sq == selected && anim == null;
            if (sel) pOy += 0.14f + 0.05f * sin(time * 4);
            {   // skip pieces that are entirely off the screen
                float dx = pOx - camX, dy = pOy + 0.8f - camY, dz = pOz - camZ, vz = dx * fx + dy * fy + dz * fz;
                if (vz < -2) return;
                if (vz < 8.5f) h = MESHHI[pc.type];                                // close to the camera: use the fine model
                if (vz > 1) { float sx = cxc + F * (dx * rx + dz * rz) / vz, sy = cyc - F * (dx * ux + dy * uy + dz * uz) / vz, rad = F * 2.2f / vz; if (sx < -rad || sx > W + rad || sy < -rad * 2 || sy > H + rad * 2) return; }
            }
            float[] mg = pc.white ? ICE : VIOLET;
            float glow = pc.glow * (0.8f + 0.2f * sin(time * 2.2f + pc.sq)) + (sel ? 1.2f : 0);
            float body = (sel ? 0.12f : 0) + (pc.glow - 1) * 0.07f;
            int pi = nPc++;
            float moonS = world.shadow(pc.x, pc.y + m.height * pS * 0.6f, pc.z, true);      // is the piece standing in the shadow of the scenery?
            pcGlow[pi] = glow; pcBody[pi] = body; pcX[pi] = pOx; pcY[pi] = pOy; pcZ[pi] = pOz; pcS[pi] = moonS;
            for (int i = 0; i < h.nv; i++) {
                xf(h, i);
                project(i, X, Y, Z);
                SC[i] = pack((NX * 0.5f + 0.5f) * 255, (NY * 0.5f + 0.5f) * 255, (NZ * 0.5f + 0.5f) * 255);
            }
            int base = M_PIECE | (pi << 3) | (pc.white ? 2048 : 0);
            for (int i = 0; i < h.nt; i++) { curAux = base | (h.tk[i] << 9); emit(main, h.t[i * 3], h.t[i * 3 + 1], h.t[i * 3 + 2], 1); }
            curAux = 0;
            if (pOy > 2.5f) return;                                                // too high above the board to be mirrored in it
            for (int i = 0; i < m.nv; i++) {
                xf(m, i);
                float x = X, y = Y, z = Z, nx = NX, ny = NY, nz = NZ, r, g, b;
                int kd = m.k[i];
                if (kd == 1) {
                    r = mg[0] * 235 * glow + 30 * glow; g = mg[1] * 235 * glow + 30 * glow; b = mg[2] * 235 * glow + 30 * glow;
                } else {
                    float ar, ag, ab, spec;
                    if (kd == 2) { ar = pc.white ? 0.70f : 0.28f; ag = pc.white ? 0.52f : 0.30f; ab = pc.white ? 0.20f : 0.38f; spec = 1.0f; }
                    else { ar = pc.white ? 0.86f : 0.13f; ag = pc.white ? 0.80f : 0.11f; ab = pc.white ? 0.69f : 0.20f; spec = pc.white ? 0.35f : 1.0f; }
                    float vx = camX - x, vy = camY - y, vz = camZ - z, vl = 1 / sqrt(vx * vx + vy * vy + vz * vz);
                    vx *= vl; vy *= vl; vz *= vl;
                    float ndl = Math.max(0, nx * MOON[0] + ny * MOON[1] + nz * MOON[2]) * 1.6f * moonS;
                    float hx = MOON[0] + vx, hy = MOON[1] + vy, hz = MOON[2] + vz, hl = 1 / sqrt(hx * hx + hy * hy + hz * hz + 1e-6f);
                    float ndh = Math.max(0, (nx * hx + ny * hy + nz * hz) * hl), sp = spec * (float) Math.pow(ndh, 40) * moonS;
                    float fill = Math.max(0, -nx * MOON[0] + ny * 0.5f - nz * MOON[2]) * 0.40f, occ = 0.55f + 0.45f * ny;
                    float lr = AMBC[0] * occ + MOONC[0] * ndl + 0.50f * fill, lg = AMBC[1] * occ + MOONC[1] * ndl + 0.56f * fill, lb = AMBC[2] * occ + MOONC[2] * ndl + 0.85f * fill;
                    for (int q = 0; q < nL; q++) {
                        int o = q * 7;
                        float dx = LT[o] - x, dy = LT[o + 1] - y, dz = LT[o + 2] - z, d2 = dx * dx + dy * dy + dz * dz;
                        float wgt = Math.max(0, nx * dx + ny * dy + nz * dz) / sqrt(d2) / (1 + LT[o + 6] * d2);
                        lr += LT[o + 3] * wgt; lg += LT[o + 4] * wgt; lb += LT[o + 5] * wgt;
                    }
                    r = 255 * (ar * lr + MOONC[0] * sp + mg[0] * body); g = 255 * (ag * lg + MOONC[1] * sp + mg[1] * body); b = 255 * (ab * lb + MOONC[2] * sp + mg[2] * body);
                }
                project(i, x, -y, z); SC[i] = pack(r, g, b);
            }
            for (int i = 0; i < m.nt; i++) emit(refl, m.t[i * 3], m.t[i * 3 + 1], m.t[i * 3 + 2], -1);
        }

        /**
         * Lighting for one pixel of a chess piece. n = which way the surface faces, v = direction back to the camera.
         * Four materials: aged ivory and polished obsidian for the bodies, gold and dark steel for the trim; the collars glow.
         * Each takes moonlight (with scenery shadows), firelight with its own glints, and a reflection of the night sky.
         */
        int shadePiece(int c, int ax, float px, float py, float pz, float vx, float vy, float vz) {
            float nx = ((c >> 16) & 255) * (2 / 255f) - 1, ny = ((c >> 8) & 255) * (2 / 255f) - 1, nz = (c & 255) * (2 / 255f) - 1;
            float nl = 1 / sqrt(nx * nx + ny * ny + nz * nz + 1e-9f);
            nx *= nl; ny *= nl; nz *= nl;
            int pi = (ax >> 3) & 63, kind = (ax >> 9) & 3;
            boolean white = (ax & 2048) != 0;
            float[] mg = white ? ICE : VIOLET;
            float ndv = Math.max(0, nx * vx + ny * vy + nz * vz), om = 1 - ndv, om2 = om * om, om5 = om2 * om2 * om;
            if (kind == 1) { float e = pcGlow[pi] * (0.85f + 0.45f * om); return pack(mg[0] * 235 * e + 34 * e, mg[1] * 235 * e + 34 * e, mg[2] * 235 * e + 34 * e); }
            float ar, ag, ab, wrap, sk, f0, ek, tr, tg, tb, rim;
            boolean sharp;
            if (kind == 2) {
                if (white) { ar = 0.42f; ag = 0.30f; ab = 0.10f; wrap = 0.1f; sk = 1.25f; f0 = 0.62f; ek = 5.5f; tr = 1f; tg = 0.80f; tb = 0.42f; rim = 0.08f; sharp = false; }   // gold
                else { ar = 0.14f; ag = 0.15f; ab = 0.19f; wrap = 0.1f; sk = 1.1f; f0 = 0.50f; ek = 5f; tr = 0.78f; tg = 0.84f; tb = 1f; rim = 0.25f; sharp = false; }            // dark steel
            } else if (white) { ar = 0.86f; ag = 0.80f; ab = 0.69f; wrap = 0.35f; sk = 0.30f; f0 = 0.045f; ek = 2.2f; tr = tg = tb = 1; rim = 0.15f; sharp = false; }           // ivory
            else { ar = 0.085f; ag = 0.07f; ab = 0.125f; wrap = 0f; sk = 1.15f; f0 = 0.10f; ek = 4.2f; tr = tg = tb = 1; rim = 0.5f; sharp = true; }                           // obsidian
            float S = pcS[pi];
            float ndl = Math.max(0, (nx * MOON[0] + ny * MOON[1] + nz * MOON[2] + wrap) / (1 + wrap)) * 1.7f * S;
            float hx = MOON[0] + vx, hy = MOON[1] + vy, hz = MOON[2] + vz, hl = 1 / sqrt(hx * hx + hy * hy + hz * hz + 1e-6f);
            float s = Math.max(0, (nx * hx + ny * hy + nz * hz) * hl);
            s *= s; s *= s; s *= s; s *= s; s *= s;
            if (sharp) s *= s;
            float spec = sk * s * S * 1.4f;
            float occ = (0.55f + 0.45f * ny) * (0.55f + 0.45f * smooth(0, 0.35f, py - pcY[pi]));       // darker near the foot
            float fill = Math.max(0, -nx * MOON[0] + ny * 0.5f - nz * MOON[2]) * 0.40f;
            float lr = AMBC[0] * occ + MOONC[0] * ndl + 0.50f * fill, lg = AMBC[1] * occ + MOONC[1] * ndl + 0.56f * fill, lb = AMBC[2] * occ + MOONC[2] * ndl + 0.85f * fill;
            float sr = MOONC[0] * spec, sg = MOONC[1] * spec, sb = MOONC[2] * spec;
            for (int q = 0; q < nL; q++) {
                int o = q * 7;
                float dx = LT[o] - px, dy = LT[o + 1] - py, dz = LT[o + 2] - pz, d2 = dx * dx + dy * dy + dz * dz, inv = 1 / sqrt(d2), att = 1 / (1 + LT[o + 6] * d2);
                float nd = Math.max(0, nx * dx + ny * dy + nz * dz) * inv * att;
                lr += LT[o + 3] * nd; lg += LT[o + 4] * nd; lb += LT[o + 5] * nd;
                float gx = dx * inv + vx, gy = dy * inv + vy, gz = dz * inv + vz, gl = 1 / sqrt(gx * gx + gy * gy + gz * gz + 1e-6f);
                if (att < 0.03f) continue;                                         // too far from this flame for a visible glint
                float g2 = Math.max(0, (nx * gx + ny * gy + nz * gz) * gl);
                g2 *= g2; g2 *= g2; g2 *= g2; g2 *= g2; g2 *= g2;
                g2 *= att * sk * 0.6f;
                sr += LT[o + 3] * g2; sg += LT[o + 4] * g2; sb += LT[o + 5] * g2;
            }
            float ry = 2 * ndv * ny - vy;                                          // what the polish mirrors: sky above, dark stone below
            int ec = ry > 0 ? sky[(int) ((ry * 0.5f + 0.5f) * 511)] : 0x16141E;
            float fres = (f0 + (1 - f0) * om5) * ek;
            float tn = kind == 0 ? 0.88f + 0.24f * cloud((px - pcX[pi] + py * 0.6f) * 0.9f, (pz - pcZ[pi] + py * 0.4f) * 0.9f) : 1;
            float rm = rim * om2 * om * (0.55f + 0.45f * ny), body = pcBody[pi];
            return pack(255 * (ar * tn * lr + sr * tr + (white ? 0.55f : 0.50f) * rm + mg[0] * body) + ((ec >> 16) & 255) * fres * tr,
                    255 * (ag * tn * lg + sg * tg + (white ? 0.65f : 0.38f) * rm + mg[1] * body) + ((ec >> 8) & 255) * fres * tg,
                    255 * (ab * tn * lb + sb * tb + (white ? 0.90f : 0.95f) * rm + mg[2] * body) + (ec & 255) * fres * tb);
        }

        void drawFrags() {
            Frags f = frags;
            for (int i = 0; i < f.n; i++) {
                float fade = clamp((f.life[i] - f.age[i]) / 0.5f, 0, 1), cx = f.c[i * 3], cy = f.c[i * 3 + 1], cz = f.c[i * 3 + 2];
                int j = i * 9;
                float e1x = f.o[j + 3] - f.o[j], e1y = f.o[j + 4] - f.o[j + 1], e1z = f.o[j + 5] - f.o[j + 2], e2x = f.o[j + 6] - f.o[j], e2y = f.o[j + 7] - f.o[j + 1], e2z = f.o[j + 8] - f.o[j + 2];
                float nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x, nl = 1 / sqrt(nx * nx + ny * ny + nz * nz + 1e-12f);
                float lit = 0.34f + 1.3f * Math.abs(nx * MOON[0] + ny * MOON[1] + nz * MOON[2]) * nl + 0.25f * Math.abs(ny * nl);
                float heat = clamp(1 - f.age[i] / 0.55f, 0, 1) * 200;
                int a = f.alb[i];
                int col = pack(((a >> 16) & 255) * lit * MOONC[0] + f.glow[i * 3] * heat, ((a >> 8) & 255) * lit * MOONC[1] + f.glow[i * 3 + 1] * heat, (a & 255) * lit * MOONC[2] + f.glow[i * 3 + 2] * heat);
                for (int q = 0; q < 3; q++) { project(q, cx + f.o[j + q * 3] * fade, cy + f.o[j + q * 3 + 1] * fade, cz + f.o[j + q * 3 + 2] * fade); SC[q] = col; }
                emit(main, 0, 1, 2, 0);
            }
        }

        /** Fills triangles with depth testing and smooth colour for the rows y0..y1 (each thread gets its own rows). */
        static void raster(TriList L, int[] pix, float[] zb, int[] aux, int W, int y0, int y1) {
            final float[] v = L.v; final int[] c = L.c;
            for (int i = 0, n = L.n; i < n; i++) {
                int o = i * 9;
                float ax = v[o], ay = v[o + 1], az = v[o + 2], bx = v[o + 3], by = v[o + 4], bz = v[o + 5], cx = v[o + 6], cy = v[o + 7], cz = v[o + 8];
                float minY = Math.min(ay, Math.min(by, cy)), maxY = Math.max(ay, Math.max(by, cy));
                int ys = Math.max(y0, (int) Math.floor(minY)), ye = Math.min(y1 - 1, (int) Math.ceil(maxY));
                if (ys > ye) continue;
                int xs = Math.max(0, (int) Math.floor(Math.min(ax, Math.min(bx, cx)))), xe = Math.min(W - 1, (int) Math.ceil(Math.max(ax, Math.max(bx, cx))));
                if (xs > xe) continue;
                double area = (double) (bx - ax) * (cy - ay) - (double) (by - ay) * (cx - ax);
                if (area < 1e-7) continue;
                float inv = (float) (1.0 / area);
                int ca = c[i * 3], cb = c[i * 3 + 1], cc = c[i * 3 + 2], ta = L.a[i];
                boolean flat = ca == cb && cb == cc;
                float ar = (ca >> 16) & 255, ag = (ca >> 8) & 255, ab = ca & 255, br = (cb >> 16) & 255, bg = (cb >> 8) & 255, bb = cb & 255, cr = (cc >> 16) & 255, cg = (cc >> 8) & 255, cbl = cc & 255;
                double w0dx = -(cy - by), w0dy = cx - bx, w1dx = -(ay - cy), w1dy = ax - cx, w2dx = -(by - ay), w2dy = bx - ax;
                double px0 = xs + 0.5, py0 = ys + 0.5;
                double w0r = (double) (cx - bx) * (py0 - by) - (double) (cy - by) * (px0 - bx);
                double w1r = (double) (ax - cx) * (py0 - cy) - (double) (ay - cy) * (px0 - cx);
                double w2r = (double) (bx - ax) * (py0 - ay) - (double) (by - ay) * (px0 - ax);
                float zdx = (float) (az * w0dx + bz * w1dx + cz * w2dx) * inv, zdy = (float) (az * w0dy + bz * w1dy + cz * w2dy) * inv, zr = (float) (az * w0r + bz * w1r + cz * w2r) * inv;
                float rdx = (float) (ar * w0dx + br * w1dx + cr * w2dx) * inv, rdy = (float) (ar * w0dy + br * w1dy + cr * w2dy) * inv, rr = (float) (ar * w0r + br * w1r + cr * w2r) * inv;
                float gdx = (float) (ag * w0dx + bg * w1dx + cg * w2dx) * inv, gdy = (float) (ag * w0dy + bg * w1dy + cg * w2dy) * inv, gr = (float) (ag * w0r + bg * w1r + cg * w2r) * inv;
                float bdx = (float) (ab * w0dx + bb * w1dx + cbl * w2dx) * inv, bdy = (float) (ab * w0dy + bb * w1dy + cbl * w2dy) * inv, bl = (float) (ab * w0r + bb * w1r + cbl * w2r) * inv;
                for (int y = ys; y <= ye; y++) {
                    double w0 = w0r, w1 = w1r, w2 = w2r;
                    float z = zr, r = rr, g = gr, b = bl;
                    int idx = y * W + xs;
                    boolean in = false;
                    for (int x = xs; x <= xe; x++, idx++) {
                        if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
                            in = true;
                            if (z > zb[idx]) { zb[idx] = z; pix[idx] = flat ? ca : pack(r, g, b); if (aux != null) aux[idx] = ta; }
                        } else if (in) break;
                        w0 += w0dx; w1 += w1dx; w2 += w2dx; z += zdx; r += rdx; g += gdx; b += bdx;
                    }
                    w0r += w0dy; w1r += w1dy; w2r += w2dy; zr += zdy; rr += rdy; gr += gdy; bl += bdy;
                }
            }
        }

        /**
         * The polished board, shaded pixel by pixel: marble texture, shadows from the pieces and the scenery,
         * firelight, the mirrored pieces, and the moon itself reflected in the stone.
         */
        void boardPass(int[] pix, int y0, int y1) {
            final float invF = 1f / F, mk = MOON[1] * 2.5f, nsc = World.NS / (2 * World.NEXT);
            final float[] near = world.smNear;
            for (int y = y0; y < y1; y++) {
                float b = (cyc - (y + 0.5f)) * invF, dy = fy + b * uy;
                if (dy > -1e-4f) continue;
                float t = -camY / dy, iz = 1f / t;
                float P0 = camX + t * (fx + b * ux), Pa = t * rx, Q0 = camZ + t * (fz + b * uz), Qa = t * rz;
                float amin = -1e9f, amax = 1e9f;
                if (Math.abs(Pa) > 1e-6f) { float a1 = (-4 - P0) / Pa, a2 = (4 - P0) / Pa; amin = Math.max(amin, Math.min(a1, a2)); amax = Math.min(amax, Math.max(a1, a2)); }
                else if (Math.abs(P0) >= 4) continue;
                if (Math.abs(Qa) > 1e-6f) { float a1 = (-4 - Q0) / Qa, a2 = (4 - Q0) / Qa; amin = Math.max(amin, Math.min(a1, a2)); amax = Math.min(amax, Math.max(a1, a2)); }
                else if (Math.abs(Q0) >= 4) continue;
                if (amin >= amax) continue;
                int xs = Math.max(0, (int) Math.ceil(cxc + amin * F - 0.5f)), xe = Math.min(W - 1, (int) Math.floor(cxc + amax * F - 0.5f));
                for (int x = xs; x <= xe; x++) {
                    int idx = y * W + x;
                    if (iz <= zb[idx]) continue;
                    float a = (x + 0.5f - cxc) * invF, px = P0 + a * Pa, pz = Q0 + a * Qa, u = px + 4, v = pz + 4;
                    if (u < 0 || u >= 8 || v < 0 || v >= 8) continue;
                    zb[idx] = iz; aux[idx] = 0;
                    int file = (int) u, rank = (int) v, s = rank * 8 + file;
                    int tex = btex[((int) (v * (BT / 8f))) * BT + (int) (u * (BT / 8f))];
                    // shadows: pieces (stamped map), scenery (the moon's depth map), and the dark patch under each piece
                    float su = (px + 5) * (SM / 10f) - 0.5f, sv = (pz + 5) * (SM / 10f) - 0.5f;
                    int sx = (int) su, sy = (int) sv, si = sy * SM + sx;
                    float fu = su - sx, fv = sv - sy;
                    float sh = 1 - 0.85f * ((sm[si] * (1 - fu) + sm[si + 1] * fu) * (1 - fv) + (sm[si + SM] * (1 - fu) + sm[si + SM + 1] * fu) * fv);
                    sh *= 0.12f + 0.88f * World.pcf(near, World.NS, nsc, px * MR[0] + pz * MR[2] + World.NEXT, px * MU[0] + pz * MU[2] + World.NEXT, px * MOON[0] + pz * MOON[2] + 0.22f);
                    float occ = 1 - 0.5f * ((ao[si] * (1 - fu) + ao[si + 1] * fu) * (1 - fv) + (ao[si + SM] * (1 - fu) + ao[si + SM + 1] * fu) * fv);
                    for (int q = 0; q < 6; q++) {
                        float life = scorch[q * 3 + 2];
                        if (life <= 0) continue;
                        float dx = px - scorch[q * 3], dz = pz - scorch[q * 3 + 1], d2 = dx * dx + dz * dz;
                        if (d2 < 0.45f) occ *= 1 - 0.62f * Math.min(1, life * 2) * (1 - d2 / 0.45f);
                    }
                    float lr = (AMBC[0] + MOONC[0] * mk * sh) * occ, lg = (AMBC[1] + MOONC[1] * mk * sh) * occ, lb = (AMBC[2] + MOONC[2] * mk * sh) * occ;
                    for (int q = 0; q < nL; q++) {
                        int o = q * 7;
                        float dx = LT[o] - px, ly = LT[o + 1], dz = LT[o + 2] - pz, d2 = dx * dx + ly * ly + dz * dz, wgt = ly / sqrt(d2) / (1 + LT[o + 6] * d2) * occ;
                        lr += LT[o + 3] * wgt; lg += LT[o + 4] * wgt; lb += LT[o + 5] * wgt;
                    }
                    // reflection (the polish is a little uneven, following the grain of the marble)
                    float il = 1 / sqrt(1 + a * a + b * b), c = -dy * il, om = 1 - c, om2 = om * om;
                    float fr = (wet + (1 - wet) * om2 * om2 * om) * (0.8f + 0.0016f * (tex & 255)) * (0.55f + 0.45f * occ);
                    float rr, rg, rb, spr = 0, spg = 0, spb = 0;
                    if (rzb[idx] > 0) { int rc = rpix[idx]; rr = (rc >> 16) & 255; rg = (rc >> 8) & 255; rb = rc & 255; }
                    else {
                        int sc = sky[(int) ((c * 0.5f + 0.5f) * 511)];
                        rr = (sc >> 16) & 255; rg = (sc >> 8) & 255; rb = sc & 255;
                        float cosM = ((fx + a * rx + b * ux) * MOON[0] - dy * MOON[1] + (fz + a * rz + b * uz) * MOON[2]) * il, q = Math.max(0, 1 - cosM);
                        float disk = q < QD0 ? 1 : (q < QD1 ? (QD1 - q) / (QD1 - QD0) : 0);
                        float h1 = 1 / (1 + q * 520), h2 = 1 / (1 + q * 24);
                        float mr = disk * 520 + h1 * h1 * 250 + h2 * 42;                  // the moon is far brighter than anything else
                        rr += MOONC[0] * mr; rg += MOONC[1] * mr; rb += MOONC[2] * mr;
                        float gl = (h1 * 26 + h2 * h2 * 16) * sh;                         // soft sheen around the reflection
                        spr = MOONC[0] * gl; spg = MOONC[1] * gl; spb = MOONC[2] * gl;
                    }
                    float k = 1 - fr;
                    float r = ((tex >> 16) & 255) * lr * k + rr * fr + spr, g = ((tex >> 8) & 255) * lg * k + rg * fr + spg, bl = (tex & 255) * lb * k + rb * fr + spb;
                    // glowing square markers
                    float qx = u - file - 0.5f, qz = v - rank - 0.5f;
                    float tr = tint[s * 3], tg = tint[s * 3 + 1], tb = tint[s * 3 + 2];
                    if (tr + tg + tb > 0) {
                        float e = Math.max(Math.abs(qx), Math.abs(qz)), w = 0.3f + 0.7f * smooth(0.33f, 0.5f, e);
                        r += tr * w; g += tg * w; bl += tb * w;
                    }
                    if (mark[s] != 0) {
                        float d2 = qx * qx + qz * qz, pulse = 0.8f + 0.2f * sin(time * 5 + s);
                        if (mark[s] == 1) { float w = clamp((0.05f - d2) / 0.022f, 0, 1) * 235 * pulse; r += markCol[0] * w; g += markCol[1] * w; bl += markCol[2] * w; }
                        else { float w = clamp(1 - Math.abs(sqrt(d2) - 0.40f) / 0.06f, 0, 1) * 230 * pulse; r += w; g += w * 0.16f; bl += w * 0.12f; }
                    }
                    for (int q = 0; q < 4; q++) {
                        int o = q * 7;
                        if (rings[o + 3] <= 0) continue;
                        float dx = px - rings[o], dz = pz - rings[o + 1], d = sqrt(dx * dx + dz * dz);
                        float w = clamp(1 - Math.abs(d - rings[o + 2]) / 0.3f, 0, 1) * rings[o + 3] * 210;
                        r += rings[o + 4] * w; g += rings[o + 5] * w; bl += rings[o + 6] * w;
                    }
                    pix[idx] = pack(r, g, bl);
                }
            }
        }

        float cloud(float u, float v) {
            u *= CT; v *= CT;
            int xi = (int) u, yi = (int) v;
            if (u < xi) xi--;
            if (v < yi) yi--;
            float fu = u - xi, fv = v - yi;
            int x0 = xi & (CT - 1), x1 = (xi + 1) & (CT - 1), y0 = (yi & (CT - 1)) * CT, y1 = ((yi + 1) & (CT - 1)) * CT;
            return (ctex[y0 + x0] * (1 - fu) + ctex[y0 + x1] * fu) * (1 - fv) + (ctex[y1 + x0] * (1 - fu) + ctex[y1 + x1] * fu) * fv;
        }

        /** How thick the drifting clouds are in a given direction (0..1). */
        float cloudDensity(float dx, float dy, float dz, float e) {
            if (e < 0.03f) return 0;
            float inv = 0.16f / dy, cu = dx * inv + time * 0.004f, cv = dz * inv;
            float n = cloud(cu, cv) * 0.62f + cloud(cu * 2.9f + 0.31f, cv * 2.9f - time * 0.003f) * 0.38f;
            return smooth(cl0, cl0 + 0.20f, n) * smooth(0.03f, 0.20f, e) * (0.9f + 0.1f * storm);    // a storm brings the clouds in
        }

        /** Night sky wherever nothing else was drawn: gradient, moon with its halo, and moonlit clouds. */
        void skyPass(int[] pix, int y0, int y1) {
            final float invF = 1f / F, invSin = 1f / sin(MOON_RAD);
            for (int y = y0; y < y1; y++) {
                float b = (cyc - (y + 0.5f)) * invF, dy = fy + b * uy;
                for (int x = 0; x < W; x++) {
                    int idx = y * W + x;
                    if (zb[idx] != 0) continue;
                    float a = (x + 0.5f - cxc) * invF, il = 1 / sqrt(1 + a * a + b * b), e = dy * il;
                    float dx = fx + a * rx + b * ux, dz = fz + a * rz + b * uz;
                    int sc = sky[(int) ((e * 0.5f + 0.5f) * 511)];
                    float r = ((sc >> 16) & 255) + flash * 24, g = ((sc >> 8) & 255) + flash * 28, bl = (sc & 255) + flash * 42;
                    float cosM = (dx * MOON[0] + dy * MOON[1] + dz * MOON[2]) * il, q = Math.max(0, 1 - cosM);
                    float h1 = 1 / (1 + q * 480), h2 = 1 / (1 + q * 12), hal = h1 * h1 * 120 + h2 * 32;
                    r += MOONC[0] * hal; g += MOONC[1] * hal; bl += MOONC[2] * hal;
                    if (q < QD1) {
                        float mx = (dx * MR[0] + dz * MR[2]) * il * invSin, my = (dx * MU[0] + dy * MU[1] + dz * MU[2]) * il * invSin;
                        int tx = Math.min(MT - 1, Math.max(0, (int) ((mx * 0.5f + 0.5f) * MT))), ty = Math.min(MT - 1, Math.max(0, (int) ((0.5f - my * 0.5f) * MT)));
                        float tone = mtex[ty * MT + tx] * (1 - 0.34f * (mx * mx + my * my)), cov = q < QD0 ? 1 : (QD1 - q) / (QD1 - QD0);
                        r = lerp(r, 258 * tone, cov); g = lerp(g, 254 * tone, cov); bl = lerp(bl, 238 * tone, cov);
                    }
                    float dens = cloudDensity(dx, dy, dz, e);
                    if (dens > 0) {
                        float lit = h2 * 125 + h1 * 60 + flash * 170;                 // lightning lights the clouds from inside
                        r = lerp(r, 15 + MOONC[0] * lit, dens); g = lerp(g, 16 + MOONC[1] * lit, dens); bl = lerp(bl, 30 + MOONC[2] * lit, dens);
                    }
                    pix[idx] = pack(r, g, bl);
                }
            }
        }

        /**
         * Finishing pass over the scenery. For every pixel it works out the point in the world that was hit, then adds:
         * the shadow cast by castles, trees and stones; a texture for the kind of surface (ground, brick, rock, bark, roof tiles);
         * and mist that thickens with distance and in low ground.
         */
        void postPass(int[] pix, int y0, int y1) {
            final float invF = 1f / F;
            final int fr0 = (FOG >> 16) & 255, fg0 = (FOG >> 8) & 255, fb0 = FOG & 255;
            for (int y = y0; y < y1; y++) {
                float b = (cyc - (y + 0.5f)) * invF, dyr = fy + b * uy, bx0 = fx + b * ux, bz0 = fz + b * uz;
                for (int x = 0; x < W; x++) {
                    int idx = y * W + x, ax = aux[idx], mat = ax & 7;
                    if (mat == 0 || zb[idx] == 0) continue;
                    float a = (x + 0.5f - cxc) * invF, t = 1f / zb[idx], dx = bx0 + a * rx, dz = bz0 + a * rz;
                    float px = camX + dx * t, py = camY + dyr * t, pz = camZ + dz * t, len = sqrt(1 + a * a + b * b), dist = t * len, il = 1 / len;
                    int c = pix[idx];
                    if (mat == M_PIECE) { pix[idx] = shadePiece(c, ax, px, py, pz, -dx * il, -dyr * il, -dz * il); continue; }
                    float r = (c >> 16) & 255, g = (c >> 8) & 255, bl = c & 255, k = 1;
                    if (mat != M_GLOW) {
                        float frac = ((ax >> 8) & 255) / 255f, kk = 1, fade;
                        if (mat == M_GROUND) {                                     // the ground reads its detail and moonlight share from the baked map
                            float gu = (px + GEXT) * (GT / (2 * GEXT)) - 0.5f, gv = (pz + GEXT) * (GT / (2 * GEXT)) - 0.5f;
                            int gx = (int) gu, gz = (int) gv, gi = (gz * GT + gx) * 2;
                            if (gx >= 0 && gz >= 0 && gx < GT - 1 && gz < GT - 1) {
                                float gfu = gu - gx, gfv = gv - gz, w00 = (1 - gfu) * (1 - gfv), w10 = gfu * (1 - gfv), w01 = (1 - gfu) * gfv, w11 = gfu * gfv;
                                kk = gtex[gi] * w00 + gtex[gi + 2] * w10 + gtex[gi + GT * 2] * w01 + gtex[gi + GT * 2 + 2] * w11;
                                frac = gtex[gi + 1] * w00 + gtex[gi + 3] * w10 + gtex[gi + GT * 2 + 1] * w01 + gtex[gi + GT * 2 + 3] * w11;
                            }
                        }
                        if (frac > 0.004f) {
                            float S = world.shadow(px, py, pz, dist < 55);
                            if (py > -0.06f && px > -4.95f && px < 4.95f && pz > -4.95f && pz < 4.95f) {      // pieces also shade the board's frame
                                float su = (px + 5) * (SM / 10f) - 0.5f, sv = (pz + 5) * (SM / 10f) - 0.5f;
                                S *= 1 - 0.85f * sm[(int) sv * SM + (int) su];
                            }
                            k = 1 - frac * (1 - S) * 0.94f;
                        }
                        switch (mat) {
                            case M_GROUND:
                                fade = clamp(1.25f - dist / 95f, 0, 1);
                                if (fade > 0) {
                                    if (dist < 28) kk *= lerp(1, 0.80f + 0.40f * cloud(px * 0.21f, pz * 0.21f), 1 - dist / 28);
                                    k *= lerp(1, kk, fade);
                                }
                                break;
                            case M_BRICK:
                                fade = clamp((85 - dist) / 45f, 0, 1);
                                if (fade > 0) {
                                    int axis = (ax >> 3) & 3;
                                    float bu = axis == 0 ? pz : px, bv = axis == 1 ? pz : py;
                                    float row = bv / 0.62f; int ri = (int) row; if (row < ri) ri--;
                                    float col = bu / 1.35f + (ri & 1) * 0.5f; int ci = (int) col; if (col < ci) ci--;
                                    float mort = (row - ri < 0.11f || col - ci < 0.055f) ? 0.60f : 1;
                                    kk = (0.82f + 0.30f * hash(ci * 7 + 3, ri * 13 + axis)) * mort * (0.88f + 0.24f * cloud(bu * 0.23f, bv * 0.23f));
                                    k *= lerp(1, kk, fade);
                                }
                                break;
                            case M_STONE:
                                fade = clamp((70 - dist) / 40f, 0, 1);
                                if (fade > 0) k *= lerp(1, 0.76f + 0.48f * cloud(px * 0.11f + py * 0.07f, pz * 0.11f + py * 0.05f), fade);
                                break;
                            case M_WOOD:
                                fade = clamp((50 - dist) / 30f, 0, 1);
                                if (fade > 0) k *= lerp(1, 0.72f + 0.56f * cloud((px + pz) * 0.37f, py * 0.05f), fade);
                                break;
                            default:                                               // roof tiles
                                fade = clamp((80 - dist) / 45f, 0, 1);
                                if (fade > 0) {
                                    float row = py / 0.5f;
                                    kk = (row - (float) Math.floor(row) < 0.16f ? 0.66f : 1) * (0.84f + 0.32f * cloud((px + pz) * 0.31f, py * 0.31f));
                                    k *= lerp(1, kk, fade);
                                }
                        }
                        r *= k; g *= k; bl *= k;
                    }
                    // mist: thicker far away and in the low ground, lit up towards the moon
                    float dens = dist * 0.0075f * fogK;
                    if (dist > 16 && py < 7) dens += (dist - 16) * 0.0105f * Math.min(1, (7 - py) * 0.1f);
                    float f = fogLut[Math.min(1023, (int) (dens * 200))];
                    float q = Math.max(0, 1 - (1 - (dx * MOON[0] + dyr * MOON[1] + dz * MOON[2]) * il) * 1.5f), mg = 36 * q * q;
                    r += (fr0 + MOONC[0] * mg - r) * f; g += (fg0 + MOONC[1] * mg - g) * f; bl += (fb0 + MOONC[2] * mg - bl) * f;
                    pix[idx] = pack(r, g, bl);
                }
            }
        }

        /** Last step: smooth jagged edges, darken the corners of the picture a little, and apply the colour grade. */
        void finalPass(int[] src, int[] dst, int y0, int y1) {
            final float icx = 2f / W, icy = 2f / H;
            final int gain = (int) (256 * (1 - 0.14f * storm) * (1 + 1.4f * flash));    // storms darken the night; lightning whitens it
            for (int y = y0; y < y1; y++) {
                float vy = (y + 0.5f) * icy - 1; vy *= vy;
                boolean inner = y > 0 && y < H - 1;
                for (int x = 0; x < W; x++) {
                    int idx = y * W + x, c = src[idx];
                    int r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
                    if (inner && x > 0 && x < W - 1) {
                        int n = src[idx - W], s = src[idx + W], e = src[idx + 1], w = src[idx - 1];
                        int lc = (r * 2 + g * 5 + b) >> 3;
                        int ln = (((n >> 16) & 255) * 2 + ((n >> 8) & 255) * 5 + (n & 255)) >> 3, ls = (((s >> 16) & 255) * 2 + ((s >> 8) & 255) * 5 + (s & 255)) >> 3;
                        int le = (((e >> 16) & 255) * 2 + ((e >> 8) & 255) * 5 + (e & 255)) >> 3, lw = (((w >> 16) & 255) * 2 + ((w >> 8) & 255) * 5 + (w & 255)) >> 3;
                        int lo = Math.min(lc, Math.min(Math.min(ln, ls), Math.min(le, lw))), hi = Math.max(lc, Math.max(Math.max(ln, ls), Math.max(le, lw)));
                        if (hi - lo > 12 + (hi >> 3)) {                            // an edge: blend across it
                            if (Math.abs(ln - lc) + Math.abs(ls - lc) >= Math.abs(le - lc) + Math.abs(lw - lc)) {
                                r = (r * 2 + ((n >> 16) & 255) + ((s >> 16) & 255)) >> 2; g = (g * 2 + ((n >> 8) & 255) + ((s >> 8) & 255)) >> 2; b = (b * 2 + (n & 255) + (s & 255)) >> 2;
                            } else {
                                r = (r * 2 + ((e >> 16) & 255) + ((w >> 16) & 255)) >> 2; g = (g * 2 + ((e >> 8) & 255) + ((w >> 8) & 255)) >> 2; b = (b * 2 + (e & 255) + (w & 255)) >> 2;
                            }
                        }
                    }
                    float vx = (x + 0.5f) * icx - 1;
                    int vg = ((256 - (int) (62 * (vx * vx + vy))) * gain) >> 8;
                    dst[idx] = (toneR[Math.min(255, (r * vg) >> 8)] << 16) | (toneG[Math.min(255, (g * vg) >> 8)] << 8) | toneB[Math.min(255, (b * vg) >> 8)];
                }
            }
        }

        static void addPix(int[] pix, int idx, float r, float g, float b) {
            int p = pix[idx];
            pix[idx] = pack(((p >> 16) & 255) + r, ((p >> 8) & 255) + g, (p & 255) + b);
        }

        void drawStars(int[] pix) {
            float cosCut = cos(MOON_RAD * 1.25f);
            for (int i = 0; i < nStars; i++) {
                float dx = starDir[i * 3], dy = starDir[i * 3 + 1], dz = starDir[i * 3 + 2];
                float vz = dx * fx + dy * fy + dz * fz;
                if (vz < 0.1f) continue;
                int sx = (int) (cxc + F * (dx * rx + dz * rz) / vz), sy = (int) (cyc - F * (dx * ux + dy * uy + dz * uz) / vz);
                if (sx < 1 || sy < 1 || sx >= W - 1 || sy >= H - 1) continue;
                int idx = sy * W + sx;
                if (zb[idx] != 0 || dx * MOON[0] + dy * MOON[1] + dz * MOON[2] > cosCut) continue;
                float br = starB[i] * (0.78f + 0.22f * sin(time * (1.5f + (i % 7) * 0.4f) + i)) * (1 - cloudDensity(dx, dy, dz, dy)) * smooth(0.02f, 0.2f, dy) * (1 - 0.9f * storm);
                int c = starC[i];
                float r = ((c >> 16) & 255) / 255f * br, g = ((c >> 8) & 255) / 255f * br, b = (c & 255) / 255f * br;
                addPix(pix, idx, r, g, b);
                if (starB[i] > 120) for (int k = 0; k < 4; k++) {
                    int j = idx + (k == 0 ? 1 : k == 1 ? -1 : k == 2 ? W : -W);
                    if (zb[j] == 0) addPix(pix, j, r * 0.35f, g * 0.35f, b * 0.35f);
                }
            }
        }

        /** Queue a soft glowing dot in the world (it is hidden by anything in front of it). */
        void sprite(float x, float y, float z, float size, float r, float g, float b) {
            float dx = x - camX, dy = y - camY, dz = z - camZ, vz = dx * fx + dy * fy + dz * fz;
            if (vz < NEAR) return;
            float iz = 1 / vz, sx = cxc + F * (dx * rx + dz * rz) * iz, sy = cyc - F * (dx * ux + dy * uy + dz * uz) * iz, rad = Math.min(260, size * F * iz);
            if (sx + rad < 0 || sy + rad < 0 || sx - rad >= W || sy - rad >= H) return;
            if (nSP * 7 + 7 > SP.length) SP = Arrays.copyOf(SP, SP.length * 2);
            int o = nSP++ * 7;
            SP[o] = sx; SP[o + 1] = sy; SP[o + 2] = rad; SP[o + 3] = iz * 1.02f; SP[o + 4] = r; SP[o + 5] = g; SP[o + 6] = b;
        }

        /** Adds the glow of every queued dot to the rows y0..y1. */
        void spritePass(int[] pix, int y0, int y1) {
            for (int i = 0; i < nSP; i++) {
                int o = i * 7;
                float sx = SP[o], sy = SP[o + 1], rad = SP[o + 2], zt = SP[o + 3], r = SP[o + 4], g = SP[o + 5], b = SP[o + 6];
                if (rad < 0.75f) {
                    int px = (int) sx, py = (int) sy;
                    if (px < 0 || py < y0 || px >= W || py >= y1) continue;
                    float k = Math.min(1, rad * rad * 1.8f + 0.15f);
                    if (zt > zb[py * W + px]) addPix(pix, py * W + px, r * k, g * k, b * k);
                    continue;
                }
                int xa = Math.max(0, (int) (sx - rad)), xb = Math.min(W - 1, (int) (sx + rad)), ya = Math.max(y0, (int) (sy - rad)), yb = Math.min(y1 - 1, (int) (sy + rad));
                float ir2 = 1 / (rad * rad);
                for (int py = ya; py <= yb; py++) {
                    float ey = (py + 0.5f - sy) * (py + 0.5f - sy);
                    for (int px = xa; px <= xb; px++) {
                        float d2 = ((px + 0.5f - sx) * (px + 0.5f - sx) + ey) * ir2;
                        if (d2 >= 1) continue;
                        int idx = py * W + px;
                        if (zt <= zb[idx]) continue;
                        float w = (1 - d2) * (1 - d2);
                        addPix(pix, idx, r * w, g * w, b * w);
                    }
                }
            }
        }
    }

    // ═══════════════════════════════════════ WINDOW, INPUT & HUD ═══════════════════════════════════════

    final Game game = new Game();
    BufferedImage img;
    int[] pix;
    final boolean[] keys = new boolean[256];
    int pressX, pressY, lastX, lastY, mouseX, mouseY, sliderDrag = -1; boolean dragging, volOpen;
    long lastNanos = System.nanoTime();
    int quality = 0; boolean showFps, showHelp = true, autoQuality = true, menuWhite = true; float fps = 60, helpTimer = 14, slowTime, toastT;
    String toast;
    final Rectangle[] promoBoxes = new Rectangle[4], menuBoxes = new Rectangle[9], sliders = new Rectangle[2];
    Rectangle volBtn = new Rectangle(), volPanel = new Rectangle(), chooseBtn = new Rectangle();
    Preferences prefs;
    static final int[] QUALITY = {820_000, 500_000, 290_000};

    NightfallChess() {
        setPreferredSize(new Dimension(1280, 800));
        setBackground(Color.BLACK);
        setFocusable(true);
        try { prefs = Preferences.userNodeForPackage(NightfallChess.class); } catch (Throwable t) { prefs = null; }
        try { game.audio = new Audio(true); } catch (Throwable t) { game.audio = null; }
        if (game.audio != null && prefs != null) {
            game.audio.sfxVol = clamp(prefs.getFloat("sfxVol", 0.4f), 0, 1);
            game.audio.musicVol = clamp(prefs.getFloat("musicVol", 0.6f), 0, 1);
        }
        findMusic();
        MouseAdapter ma = new MouseAdapter() {
            @Override public void mousePressed(MouseEvent e) {
                pressX = lastX = e.getX(); pressY = lastY = e.getY(); dragging = false; requestFocusInWindow();
                sliderDrag = -1;
                if (volOpen) for (int i = 0; i < 2; i++) if (sliders[i] != null && sliders[i].contains(e.getPoint())) { sliderDrag = i; setSlider(e.getX()); }
            }
            @Override public void mouseDragged(MouseEvent e) {
                if (sliderDrag >= 0) { setSlider(e.getX()); return; }
                if (!dragging && Math.abs(e.getX() - pressX) + Math.abs(e.getY() - pressY) > 5) dragging = true;
                if (dragging) {
                    game.yawG -= (e.getX() - lastX) * 0.0075f;
                    game.pitchG = clamp(game.pitchG + (e.getY() - lastY) * 0.006f, 0.07f, 1.5f);
                }
                lastX = e.getX(); lastY = e.getY();
            }
            @Override public void mouseReleased(MouseEvent e) {
                if (sliderDrag >= 0) { sliderDrag = -1; savePrefs(); return; }
                if (dragging || !SwingUtilities.isLeftMouseButton(e)) return;
                Point pt = e.getPoint();
                if (volBtn.contains(pt)) { volOpen = !volOpen; click(); return; }
                if (volOpen && chooseBtn.contains(pt)) { click(); chooseMusic(); return; }
                if (volOpen && volPanel.contains(pt)) return;
                if (game.menu) { menuClick(pt); return; }
                if (game.promo != null) {
                    for (int i = 0; i < 4; i++) if (promoBoxes[i] != null && promoBoxes[i].contains(pt)) { game.startMove(game.promo.get(i)); return; }
                    game.promo = null; return;
                }
                game.click(e.getX() * game.W / (float) getWidth(), e.getY() * game.H / (float) getHeight());
            }
            @Override public void mouseMoved(MouseEvent e) {
                mouseX = e.getX(); mouseY = e.getY();
                if (game.W > 0) game.hover = game.pick(e.getX() * game.W / (float) getWidth(), e.getY() * game.H / (float) getHeight());
            }
            @Override public void mouseWheelMoved(MouseWheelEvent e) { game.distG = clamp(game.distG * (float) Math.pow(1.12, e.getPreciseWheelRotation()), 4.5f, 95); }
        };
        addMouseListener(ma); addMouseMotionListener(ma); addMouseWheelListener(ma);
        addKeyListener(new KeyAdapter() {
            @Override public void keyPressed(KeyEvent e) {
                int k = e.getKeyCode();
                if (k < 256) keys[k] = true;
                switch (k) {
                    case KeyEvent.VK_SPACE: game.txG = 0; game.tzG = 0; game.distG = game.tactical ? 12.5f : 14.5f; break;
                    case KeyEvent.VK_V:
                        game.tactical = !game.tactical;
                        game.pitchG = game.tactical ? 0.98f : 0.40f; game.distG = game.tactical ? 12.5f : 14.5f; game.txG = 0; game.tzG = 0; break;
                    case KeyEvent.VK_F: game.yawG += PI; break;
                    case KeyEvent.VK_U: if (game.online) say("No take-backs in an online game"); else game.undo(); break;
                    case KeyEvent.VK_N: game.cancelAI(); game.menu = true; game.promo = null; break;
                    case KeyEvent.VK_M: if (game.audio != null) { game.audio.mute = !game.audio.mute; say(game.audio.mute ? "Sound off" : "Sound on"); } break;
                    case KeyEvent.VK_K: game.killCam = !game.killCam; say(game.killCam ? "Kill-cam on" : "Kill-cam off"); break;
                    case KeyEvent.VK_T:
                        game.stormMode = (game.stormMode + 1) % 3;
                        say(game.stormMode == 0 ? "Storm: follows the game" : game.stormMode == 1 ? "Storm: always" : "Storm: never"); break;
                    case KeyEvent.VK_Q: quality = (quality + 1) % 3; autoQuality = false; say("Quality " + (3 - quality) + " of 3"); break;
                    case KeyEvent.VK_P: showFps = !showFps; break;
                    case KeyEvent.VK_H: showHelp = !showHelp; helpTimer = 1e9f; break;
                    case KeyEvent.VK_ESCAPE:
                        if (volOpen) volOpen = false;
                        else if (game.menu) { if (game.started && (game.net == null || game.online)) game.menu = false; }
                        else { game.promo = null; game.select(-1); }
                        break;
                    default:
                }
            }
            @Override public void keyReleased(KeyEvent e) { if (e.getKeyCode() < 256) keys[e.getKeyCode()] = false; }
        });
        new Timer(15, e -> tick()).start();
    }

    void say(String s) { toast = s; toastT = 2.2f; }

    void click() { if (game.audio != null && game.audio.ok) game.audio.play(Audio.CLICK, 0.6f, 0, 1); }

    void setSlider(int x) {
        if (game.audio == null || sliderDrag < 0) return;
        float v = clamp((x - sliders[sliderDrag].x) / (float) sliders[sliderDrag].width, 0, 1);
        if (sliderDrag == 0) game.audio.musicVol = v; else game.audio.sfxVol = v;
    }

    void savePrefs() {
        if (prefs == null || game.audio == null) return;
        try { prefs.putFloat("sfxVol", game.audio.sfxVol); prefs.putFloat("musicVol", game.audio.musicVol); } catch (Throwable t) { /* settings just won't be remembered */ }
    }

    /** Looks for a music file to play: the one chosen last time, otherwise a WAV/AIFF/AU file next to the game. */
    void findMusic() {
        if (game.audio == null) return;
        String saved = prefs != null ? prefs.get("music", "") : "";
        File f = saved.isEmpty() ? null : new File(saved);
        if (f == null || !f.isFile()) {
            f = null;
            String[] dirs = {".", "music", "src", "bin"};
            for (String d : dirs) {
                File[] list = new File(d).listFiles();
                if (list == null || f != null) continue;
                for (File c : list) {
                    String n = c.getName().toLowerCase();
                    boolean sound = n.endsWith(".wav") || n.endsWith(".aif") || n.endsWith(".aiff") || n.endsWith(".au");
                    if (c.isFile() && sound && (n.contains("dark") || n.startsWith("music") || d.equals("music"))) { f = c; break; }
                }
            }
        }
        if (f != null) game.audio.loadMusic(f);
    }

    void chooseMusic() {
        if (game.audio == null) return;
        JFileChooser fc = new JFileChooser(prefs != null ? prefs.get("musicDir", ".") : ".");
        fc.setDialogTitle("Choose a music file (WAV, AIFF or AU)");
        fc.setFileFilter(new javax.swing.filechooser.FileNameExtensionFilter("Music files (WAV, AIFF, AU)", "wav", "aif", "aiff", "au"));
        if (fc.showOpenDialog(this) != JFileChooser.APPROVE_OPTION) return;
        File f = fc.getSelectedFile();
        game.audio.loadMusic(f);
        if (prefs != null) try { prefs.put("music", f.getAbsolutePath()); prefs.put("musicDir", f.getParent()); } catch (Throwable t) { /* not remembered */ }
        lastNanos = System.nanoTime();
    }

    void menuClick(Point pt) {
        for (int i = 0; i < 9; i++) {
            if (menuBoxes[i] == null || !menuBoxes[i].contains(pt)) continue;
            boolean waiting = game.net != null && !game.online;
            if (waiting != (i == 8)) continue;                                  // while waiting for a friend only Cancel works
            click();
            if (i < 3) game.start(i + 1, menuWhite);
            else if (i == 3) menuWhite = true;
            else if (i == 4) menuWhite = false;
            else if (i == 5) game.start(0, true);
            else if (i == 6) game.hostOnline(menuWhite, Net.PORT);
            else if (i == 7) {
                String last = prefs != null ? prefs.get("host", "") : "";
                String addr = (String) JOptionPane.showInputDialog(this, "Type the address shown on your friend's screen\n(they choose \"Host an online game\" first):", "Join a game",
                        JOptionPane.PLAIN_MESSAGE, null, null, last);
                lastNanos = System.nanoTime();
                if (addr != null && !addr.trim().isEmpty()) {
                    if (prefs != null) try { prefs.put("host", addr.trim()); } catch (Throwable t) { /* not remembered */ }
                    game.joinOnline(addr.trim(), Net.PORT);
                }
            } else game.closeNet();
            helpTimer = Math.max(helpTimer, 10);
            return;
        }
    }

    void tick() {
        long now = System.nanoTime();
        float dt = Math.min(0.05f, (now - lastNanos) / 1e9f);
        lastNanos = now;
        fps = lerp(fps, 1f / Math.max(dt, 1e-4f), 0.05f);
        helpTimer -= dt; toastT -= dt;
        // on a slow computer, quietly drop to a lower resolution so the game stays smooth (Q overrides this)
        slowTime = autoQuality && fps < 24 ? slowTime + dt : 0;
        if (slowTime > 2.5f && quality < 2) { quality++; slowTime = 0; fps = 40; }
        // roaming: move the point the camera circles around
        float mf = 0, ms = 0;
        if (keys[KeyEvent.VK_W] || keys[KeyEvent.VK_UP]) mf += 1;
        if (keys[KeyEvent.VK_S] || keys[KeyEvent.VK_DOWN]) mf -= 1;
        if (keys[KeyEvent.VK_D] || keys[KeyEvent.VK_RIGHT]) ms += 1;
        if (keys[KeyEvent.VK_A] || keys[KeyEvent.VK_LEFT]) ms -= 1;
        if ((mf != 0 || ms != 0) && !game.menu && !game.inKill && !game.castleCam) {
            float sp = (6 + game.dist * 0.9f) * dt, sy = sin(game.yaw), cy = cos(game.yaw);
            game.txG = clamp(game.txG + (-sy * mf + cy * ms) * sp, -75, 75);
            game.tzG = clamp(game.tzG + (cy * mf + sy * ms) * sp, -75, 75);
        }
        game.update(dt);
        repaint();
    }

    @Override protected void paintComponent(Graphics g0) {
        int pw = getWidth(), ph = getHeight();
        if (pw < 32 || ph < 32) return;
        float sc = (float) Math.sqrt(Math.max(1.0, (double) pw * ph / QUALITY[quality]));
        int w = Math.max(64, Math.round(pw / sc)), h = Math.max(64, Math.round(ph / sc));
        if (img == null || img.getWidth() != w || img.getHeight() != h) {
            img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
            pix = ((DataBufferInt) img.getRaster().getDataBuffer()).getData();
        }
        game.render(pix, w, h);
        Graphics2D g = (Graphics2D) g0;
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(img, 0, 0, pw, ph, null);
        hud(g, pw, ph);
    }

    void shadowText(Graphics2D g, String s, int x, int y, Color c) {
        g.setColor(new Color(0, 0, 0, 190));
        g.drawString(s, x + 2, y + 2);
        g.setColor(c);
        g.drawString(s, x, y);
    }

    void centered(Graphics2D g, String s, int cx, int y, Color c) { shadowText(g, s, cx - g.getFontMetrics().stringWidth(s) / 2, y, c); }

    void button(Graphics2D g, int i, String label, int x, int y, int w, int h, boolean chosen, Color accent) {
        menuBoxes[i] = new Rectangle(x, y, w, h);
        boolean hot = menuBoxes[i].contains(mouseX, mouseY);
        g.setColor(chosen ? new Color(accent.getRed() / 4, accent.getGreen() / 4, accent.getBlue() / 3, 235) : (hot ? new Color(44, 40, 76, 235) : new Color(18, 16, 34, 225)));
        g.fillRoundRect(x, y, w, h, 14, 14);
        g.setColor(chosen || hot ? accent : new Color(96, 100, 136));
        g.drawRoundRect(x, y, w, h, 14, 14);
        g.setColor(new Color(224, 230, 248));
        g.drawString(label, x + (w - g.getFontMetrics().stringWidth(label)) / 2, y + h / 2 + g.getFontMetrics().getAscent() / 2 - 2);
    }

    /** The volume button in the top-right corner, and the panel with the two sliders that it opens. */
    void volumeUi(Graphics2D g, int pw) {
        Color pale = new Color(214, 222, 245), ice = new Color(120, 205, 255);
        Audio au = game.audio;
        volBtn = new Rectangle(pw - 58, 16, 42, 38);
        boolean hot = volBtn.contains(mouseX, mouseY);
        g.setColor(hot || volOpen ? new Color(44, 40, 76, 235) : new Color(18, 16, 34, 200));
        g.fillRoundRect(volBtn.x, volBtn.y, volBtn.width, volBtn.height, 12, 12);
        g.setColor(hot || volOpen ? ice : new Color(96, 100, 136));
        g.drawRoundRect(volBtn.x, volBtn.y, volBtn.width, volBtn.height, 12, 12);
        int sx = volBtn.x + 10, sy = volBtn.y + 19;                              // a little loudspeaker
        g.setColor(pale);
        g.fillPolygon(new int[]{sx, sx + 6, sx + 13, sx + 13, sx + 6, sx}, new int[]{sy - 4, sy - 4, sy - 10, sy + 10, sy + 4, sy + 4}, 6);
        boolean silent = au == null || !au.ok || au.mute || (au.sfxVol < 0.01f && au.musicVol < 0.01f);
        g.setStroke(new BasicStroke(2f));
        if (silent) { g.setColor(new Color(255, 100, 90)); g.drawLine(sx + 17, sy - 6, sx + 25, sy + 6); g.drawLine(sx + 25, sy - 6, sx + 17, sy + 6); }
        else { g.drawArc(sx + 10, sy - 6, 10, 12, -60, 120); g.drawArc(sx + 9, sy - 11, 18, 22, -60, 120); }
        g.setStroke(new BasicStroke(1f));
        if (!volOpen) {
            if (au != null && au.musicMsg != null) { g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 12)); shadowText(g, au.musicMsg, pw - 20 - g.getFontMetrics().stringWidth(au.musicMsg), 72, new Color(255, 200, 150)); }
            return;
        }
        volPanel = new Rectangle(pw - 336, 62, 320, 196);
        g.setColor(new Color(10, 9, 22, 235));
        g.fillRoundRect(volPanel.x, volPanel.y, volPanel.width, volPanel.height, 16, 16);
        g.setColor(new Color(96, 100, 136));
        g.drawRoundRect(volPanel.x, volPanel.y, volPanel.width, volPanel.height, 16, 16);
        if (au == null || !au.ok) {
            g.setFont(new Font(Font.SERIF, Font.PLAIN, 16));
            shadowText(g, "No sound device was found.", volPanel.x + 18, volPanel.y + 40, pale);
            return;
        }
        String[] names = {"Music", "Sound effects"};
        float[] vals = {au.musicVol, au.sfxVol};
        for (int i = 0; i < 2; i++) {
            int y = volPanel.y + 34 + i * 52;
            g.setFont(new Font(Font.SERIF, Font.BOLD, 16));
            shadowText(g, names[i], volPanel.x + 18, y, pale);
            shadowText(g, Math.round(vals[i] * 100) + "%", volPanel.x + volPanel.width - 56, y, pale);
            sliders[i] = new Rectangle(volPanel.x + 18, y + 6, volPanel.width - 36, 22);
            g.setColor(new Color(40, 40, 66));
            g.fillRoundRect(sliders[i].x, y + 14, sliders[i].width, 6, 6, 6);
            g.setColor(ice);
            g.fillRoundRect(sliders[i].x, y + 14, (int) (sliders[i].width * vals[i]), 6, 6, 6);
            g.fillOval(sliders[i].x + (int) (sliders[i].width * vals[i]) - 8, y + 9, 16, 16);
        }
        chooseBtn = new Rectangle(volPanel.x + 18, volPanel.y + 132, volPanel.width - 36, 30);
        boolean ch = chooseBtn.contains(mouseX, mouseY);
        g.setColor(ch ? new Color(44, 40, 76) : new Color(24, 22, 44));
        g.fillRoundRect(chooseBtn.x, chooseBtn.y, chooseBtn.width, chooseBtn.height, 10, 10);
        g.setColor(ch ? ice : new Color(96, 100, 136));
        g.drawRoundRect(chooseBtn.x, chooseBtn.y, chooseBtn.width, chooseBtn.height, 10, 10);
        g.setFont(new Font(Font.SERIF, Font.BOLD, 15));
        g.setColor(pale);
        String lb = "Choose a music file…";
        g.drawString(lb, chooseBtn.x + (chooseBtn.width - g.getFontMetrics().stringWidth(lb)) / 2, chooseBtn.y + 20);
        g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 11));
        String st = au.musicMsg != null ? au.musicMsg : (au.musicName != null ? "Playing: " + au.musicName : "No music loaded. Pick a WAV file, or put one named music.wav beside the game.");
        while (st.length() > 4 && g.getFontMetrics().stringWidth(st) > volPanel.width - 30) st = st.substring(0, st.length() - 2) + "…";
        shadowText(g, st, volPanel.x + 18, volPanel.y + 182, new Color(190, 198, 222));
    }

    void hud(Graphics2D g, int pw, int ph) {
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        Color pale = new Color(214, 222, 245), ice = new Color(120, 205, 255), vio = new Color(215, 110, 255), dim = new Color(170, 178, 205);
        boolean w = game.rules.white;
        if (game.bars > 0.01f) {                                                 // cinema bars while the kill-cam is running
            int bh = (int) (ph * 0.085f * game.bars);
            g.setColor(Color.BLACK);
            g.fillRect(0, 0, pw, bh); g.fillRect(0, ph - bh, pw, bh);
        }
        if (game.menu) {
            int cx = pw / 2, y = Math.max(64, ph / 2 - 250);
            g.setColor(new Color(6, 6, 16, 160));
            g.fillRoundRect(cx - 330, y - 56, 660, 530, 26, 26);
            g.setFont(new Font(Font.SERIF, Font.BOLD, 54));
            centered(g, "NIGHTFALL CHESS", cx, y, new Color(232, 226, 246));
            g.setFont(new Font(Font.SERIF, Font.ITALIC, 19));
            centered(g, "a game of kings, under a cold moon", cx, y + 30, new Color(150, 160, 200));
            if (game.net != null && !game.online) {                              // waiting for the other player
                Net n = game.net;
                g.setFont(new Font(Font.SERIF, Font.BOLD, 24));
                centered(g, n.status, cx, y + 110, n.failed ? new Color(255, 130, 110) : pale);
                g.setFont(new Font(Font.SERIF, Font.PLAIN, 18));
                if (n.host && !n.failed) {
                    centered(g, "Your friend chooses \"Join an online game\" and types this address:", cx, y + 158, pale);
                    List<String> ad = Net.addresses();
                    g.setFont(new Font(Font.MONOSPACED, Font.BOLD, 30));
                    int yy = y + 204;
                    if (ad.isEmpty()) { centered(g, "(no network found)", cx, yy, ice); yy += 40; }
                    for (int i = 0; i < Math.min(3, ad.size()); i++) { centered(g, ad.get(i), cx, yy, ice); yy += 40; }
                    g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 13));
                    centered(g, "This works when both computers are on the same Wi-Fi or network.", cx, yy + 6, dim);
                    centered(g, "Over the internet, your router must forward TCP port " + Net.PORT + " to this computer.", cx, yy + 26, dim);
                }
                g.setFont(new Font(Font.SERIF, Font.BOLD, 20));
                button(g, 8, n.failed ? "Back" : "Cancel", cx - 100, y + 392, 200, 48, false, vio);
                volumeUi(g, pw);
                return;
            }
            g.setFont(new Font(Font.SERIF, Font.BOLD, 20));
            centered(g, "Play against the computer", cx, y + 84, pale);
            String[] lv = {"Easy", "Normal", "Hard"};
            for (int i = 0; i < 3; i++) button(g, i, lv[i], cx - 285 + i * 195, y + 98, 180, 50, false, ice);
            g.setFont(new Font(Font.SERIF, Font.PLAIN, 18));
            shadowText(g, "You play as", cx - 285, y + 190, pale);
            g.setFont(new Font(Font.SERIF, Font.BOLD, 18));
            button(g, 3, "White (moves first)", cx - 160, y + 165, 220, 40, menuWhite, ice);
            button(g, 4, "Black", cx + 75, y + 165, 130, 40, !menuWhite, vio);
            g.setFont(new Font(Font.SERIF, Font.BOLD, 20));
            centered(g, "Play with a friend", cx, y + 252, pale);
            button(g, 5, "Two players on this computer", cx - 285, y + 266, 570, 50, false, vio);
            button(g, 6, "Host an online game", cx - 285, y + 328, 278, 50, false, vio);
            button(g, 7, "Join an online game", cx + 7, y + 328, 278, 50, false, vio);
            g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 13));
            if (game.netNote != null) centered(g, game.netNote, cx, y + 410, new Color(255, 150, 120));
            centered(g, game.started ? "Esc: back to the game      speaker button (top right): volume and music" : "Speaker button (top right): volume and music      N: come back to this menu at any time",
                    cx, y + 446, dim);
            volumeUi(g, pw);
            return;
        }
        boolean cinema = game.bars > 0.5f;
        if (!cinema) {
            g.setFont(new Font(Font.SERIF, Font.BOLD, 26));
            shadowText(g, "NIGHTFALL CHESS", 24, 42, pale);
        }
        g.setFont(new Font(Font.SERIF, Font.PLAIN, 19));
        if (!game.over) {
            if (!cinema) {
                g.setColor(w ? ice : vio);
                g.fillOval(26, 58, 13, 13);
                String side = w ? "White" : "Black", line, dots = "...".substring(0, 1 + (int) (game.time * 2.5f) % 3);
                if (game.online) line = game.remoteTurn() ? "Online — waiting for your friend (" + side + ")" + dots : "Online — your move (" + side + ")";
                else if (game.aiLevel == 0) line = side + " to move";
                else if (game.aiTurn()) line = "Computer (" + side + ") is thinking" + dots;
                else line = "Your move (" + side + ")";
                shadowText(g, line, 48, 71, pale);
            }
            if (game.inCheck && game.anim == null) {
                g.setFont(new Font(Font.SERIF, Font.BOLD, 34));
                centered(g, "CHECK", pw / 2, 62, new Color(255, 90, 80));
            }
        } else if (game.banner != null) {
            g.setFont(new Font(Font.SERIF, Font.BOLD, 46));
            centered(g, game.banner, pw / 2, ph / 2 - 150, new Color(240, 228, 200));
            if (!cinema) {
                g.setFont(new Font(Font.SERIF, Font.PLAIN, 21));
                centered(g, game.online ? "Press N for the menu" : "Press N for a new game, or U to take the last move back", pw / 2, ph / 2 - 114, pale);
            }
        }
        if (game.promo != null) {
            String[] names = {"Queen", "Rook", "Bishop", "Knight"};
            int bw = 120, bh = 70, x0 = (pw - (bw * 4 + 36)) / 2, y0 = ph / 2 - bh / 2;
            g.setFont(new Font(Font.SERIF, Font.BOLD, 22));
            shadowText(g, "Promote your pawn to…", x0, y0 - 16, pale);
            for (int i = 0; i < 4; i++) {
                promoBoxes[i] = new Rectangle(x0 + i * (bw + 12), y0, bw, bh);
                g.setColor(new Color(16, 14, 30, 225));
                g.fillRoundRect(promoBoxes[i].x, promoBoxes[i].y, bw, bh, 14, 14);
                g.setColor(w ? ice : vio);
                g.drawRoundRect(promoBoxes[i].x, promoBoxes[i].y, bw, bh, 14, 14);
                g.setColor(pale);
                g.drawString(names[i], promoBoxes[i].x + (bw - g.getFontMetrics().stringWidth(names[i])) / 2, y0 + 43);
            }
        }
        if (toast != null && toastT > 0) {
            g.setFont(new Font(Font.SERIF, Font.BOLD, 20));
            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, clamp(toastT, 0, 1)));
            centered(g, toast, pw / 2, 104, pale);
            g.setComposite(AlphaComposite.SrcOver);
        }
        if (showHelp && helpTimer > 0 && !cinema) {
            g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 13));
            String s = "Click: move   Drag: rotate   Wheel: zoom   WASD: roam   Space: board   V: view   F: flip   U: undo   N: menu   K: kill-cam   T: storm   M: mute   Q: quality   H: hide";
            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, clamp(helpTimer, 0, 1)));
            centered(g, s, pw / 2, ph - 18, new Color(190, 198, 222));
            g.setComposite(AlphaComposite.SrcOver);
        }
        if (showFps) {
            g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
            shadowText(g, Math.round(fps) + " fps   " + game.W + "x" + game.H + "   " + (game.main.n + game.refl.n) + " triangles", pw - 360, 76, pale);
        }
        if (!cinema) volumeUi(g, pw);
    }

    public static void main(String[] args) throws Exception {
        if (args.length > 0 && args[0].equals("--selftest")) { selfTest(args.length > 1 ? args[1] : "shot"); return; }
        SwingUtilities.invokeLater(() -> {
            JFrame f = new JFrame("Nightfall Chess");
            NightfallChess p = new NightfallChess();
            f.setContentPane(p);
            f.pack();
            f.setLocationRelativeTo(null);
            f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            f.setVisible(true);
            p.requestFocusInWindow();
        });
    }

    /** Developer check: verifies the move generator and writes two frames to PNG files without opening a window. */
    static void selfTest(String prefix) throws Exception {
        Rules r = new Rules();
        long[] want = {20, 400, 8902, 197281};
        for (int d = 1; d <= 4; d++) System.out.println("perft(" + d + ") = " + r.perft(d) + (r.perft(d) == want[d - 1] ? "  ok" : "  WRONG, expected " + want[d - 1]));
        Game g = new Game();
        g.start(0, true);
        int w = 1280, h = 800;
        BufferedImage im = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        int[] px = ((DataBufferInt) im.getRaster().getDataBuffer()).getData();
        for (int i = 0; i < 300; i++) g.update(0.033f);                        // let the opening camera sweep finish
        long t0 = System.nanoTime();
        for (int i = 0; i < 20; i++) g.render(px, w, h);
        System.out.println("render: " + (System.nanoTime() - t0) / 20 / 1e6 + " ms/frame, " + (g.main.n + g.refl.n) + " triangles");
        ImageIO.write(im, "png", new File(prefix + "0.png"));
        int[][] moves = {{12, 28}, {51, 35}, {28, 35}};                          // e4 d5 exd5
        for (int[] mv : moves) {
            if (!g.tryMove(mv[0], mv[1])) System.out.println("illegal scripted move " + mv[0] + "-" + mv[1]);
            for (int steps = 0; g.anim != null && steps < 900; steps++) {
                g.update(0.02f);
                if (mv[0] == 28 && steps == 34) { g.render(px, w, h); ImageIO.write(im, "png", new File(prefix + "1.png")); }
            }
        }
        System.out.println("wrote 2 frames");
    }
}
